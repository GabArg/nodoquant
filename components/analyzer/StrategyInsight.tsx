"use client";

import type { Trade } from "@/lib/analyzer/parser";

interface InsightProps {
    profitFactor: number;
    winrate: number;      // 0-100
    maxDrawdown: number;  // positive %
    totalTrades: number;
    trades?: Trade[];
    onViewFullReport?: () => void;
}

// ── Edge Location Analysis ────────────────────────────────────────────────────

interface EdgeLocation {
    bestSymbol: string | null;
    bestDayOfWeek: string | null;
    bestSession: string | null;
    bestRR: string | null;
    hasSufficientData: boolean;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SESSION_MAP = (hour: number): string => {
    if (hour >= 7 && hour < 16) return "London";
    if (hour >= 12 && hour < 21) return "New York";
    if (hour >= 0 && hour < 8) return "Asia";
    return "Off-hours";
};

function computeEdgeLocation(trades: Trade[]): EdgeLocation {
    if (trades.length < 10) return { bestSymbol: null, bestDayOfWeek: null, bestSession: null, bestRR: null, hasSufficientData: false };

    // Best symbol by average profit
    const bySymbol: Record<string, number[]> = {};
    trades.forEach(t => {
        if (t.symbol) {
            bySymbol[t.symbol] = bySymbol[t.symbol] ?? [];
            bySymbol[t.symbol].push(t.profit);
        }
    });
    const bestSymbol = Object.entries(bySymbol)
        .filter(([, ps]) => ps.length >= 5)
        .map(([sym, ps]) => ({ sym, avg: ps.reduce((a, b) => a + b, 0) / ps.length }))
        .sort((a, b) => b.avg - a.avg)[0]?.sym ?? null;

    // Best day
    const byDay: Record<number, number[]> = {};
    trades.forEach(t => {
        const dt = t.exit_time ?? t.datetime;
        if (dt) {
            const d = dt.getDay();
            byDay[d] = byDay[d] ?? [];
            byDay[d].push(t.profit);
        }
    });
    const bestDayEntry = Object.entries(byDay)
        .filter(([, ps]) => ps.length >= 3)
        .map(([d, ps]) => ({ d: parseInt(d), avg: ps.reduce((a, b) => a + b, 0) / ps.length }))
        .sort((a, b) => b.avg - a.avg)[0];
    const bestDayOfWeek = bestDayEntry ? DAY_NAMES[bestDayEntry.d] : null;

    // Best session
    const bySession: Record<string, number[]> = {};
    trades.forEach(t => {
        const dt = t.exit_time ?? t.datetime;
        if (dt) {
            const session = SESSION_MAP(dt.getUTCHours());
            bySession[session] = bySession[session] ?? [];
            bySession[session].push(t.profit);
        }
    });
    const bestSession = Object.entries(bySession)
        .filter(([, ps]) => ps.length >= 3)
        .map(([s, ps]) => ({ s, avg: ps.reduce((a, b) => a + b, 0) / ps.length }))
        .sort((a, b) => b.avg - a.avg)[0]?.s ?? null;

    // Best RR range
    const withRR = trades.filter(t => t.risk_reward != null && t.risk_reward > 0);
    let bestRR: string | null = null;
    if (withRR.length >= 5) {
        const buckets: Record<string, number[]> = {
            "< 1:1": [],
            "1:1 – 2:1": [],
            "2:1 – 3:1": [],
            "> 3:1": [],
        };
        withRR.forEach(t => {
            const rr = t.risk_reward!;
            if (rr < 1) buckets["< 1:1"].push(t.profit);
            else if (rr < 2) buckets["1:1 – 2:1"].push(t.profit);
            else if (rr < 3) buckets["2:1 – 3:1"].push(t.profit);
            else buckets["> 3:1"].push(t.profit);
        });
        bestRR = Object.entries(buckets)
            .filter(([, ps]) => ps.length >= 3)
            .map(([label, ps]) => ({ label, avg: ps.reduce((a, b) => a + b, 0) / ps.length }))
            .sort((a, b) => b.avg - a.avg)[0]?.label ?? null;
    }

    const hasSufficientData = !!(bestSymbol || bestDayOfWeek || bestSession);
    return { bestSymbol, bestDayOfWeek, bestSession, bestRR, hasSufficientData };
}

// ── Insight card component ──────────────────────────────────────────────────

interface CardProps {
    icon: string;
    title: string;
    level: "positive" | "neutral" | "negative" | "info";
    headline: string;
    body: string;
    tip: string;
}

const LEVEL_STYLE = {
    positive: { dot: "#10b981", border: "rgba(16,185,129,0.2)", bg: "rgba(16,185,129,0.05)", head: "#34d399" },
    neutral: { dot: "#fbbf24", border: "rgba(251,191,36,0.2)", bg: "rgba(251,191,36,0.05)", head: "#fbbf24" },
    negative: { dot: "#f87171", border: "rgba(239,68,68,0.2)", bg: "rgba(239,68,68,0.05)", head: "#f87171" },
    info: { dot: "#818cf8", border: "rgba(99,102,241,0.2)", bg: "rgba(99,102,241,0.05)", head: "#a5b4fc" },
};

function InsightCard({ icon, title, level, headline, body, tip }: CardProps) {
    const s = LEVEL_STYLE[level];
    return (
        <div className="rounded-2xl p-5 space-y-3" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
            <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{icon}</span>
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: s.dot }}>{title}</span>
                <span className="ml-auto w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.dot, boxShadow: `0 0 6px ${s.dot}` }} />
            </div>
            <p className="text-sm font-semibold leading-snug" style={{ color: s.head }}>{headline}</p>
            <p className="text-sm leading-relaxed" style={{ color: "#9ca3af" }}>{body}</p>
            <div className="rounded-lg px-3 py-2 text-xs leading-relaxed" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#6b7280" }}>
                <span style={{ color: "#818cf8", fontWeight: 600 }}>💡 Tip: </span>{tip}
            </div>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function StrategyInsight({
    profitFactor,
    winrate,
    maxDrawdown,
    totalTrades,
    trades = [],
}: InsightProps) {

    // Card 1: Edge Quality
    const edgeLevel: CardProps["level"] = profitFactor >= 1.5 && winrate >= 50 ? "positive"
        : profitFactor >= 1.0 ? "neutral" : "negative";
    const edgeCard: CardProps = {
        icon: "📊",
        title: "Edge Quality",
        level: edgeLevel,
        headline: profitFactor >= 1.5 && winrate >= 50
            ? "Your strategy shows a strong statistical edge."
            : profitFactor >= 1.0
                ? "Your strategy has a marginal but profitable edge."
                : "No statistical edge detected in this sample.",
        body: profitFactor >= 1.5
            ? `A Profit Factor of ${profitFactor.toFixed(2)} with a ${winrate.toFixed(1)}% win rate is a solid combination. The strategy earns significantly more than it loses across the tested trades.`
            : profitFactor >= 1.0
                ? `Profit Factor ${profitFactor.toFixed(2)} is profitable but relatively low. Small improvements to entry timing or exit management could substantially boost results.`
                : `Profit Factor below 1.0 means gross losses exceed gross profits. The strategy is losing money on average before any edge can be established.`,
        tip: profitFactor >= 1.5
            ? "Run Monte Carlo analysis to validate this edge holds under 1,000 simulated market conditions."
            : profitFactor >= 1.0
                ? "Focus on improving the Risk:Reward ratio per trade. Even a small increase can push PF above 1.5."
                : "Review your latest 20 losing trades. Look for a common failure pattern in entry signals.",
    };

    // Card 2: Risk Profile
    const ddAbs = Math.abs(maxDrawdown);
    const riskLevel: CardProps["level"] = ddAbs <= 15 ? "positive" : ddAbs <= 30 ? "neutral" : "negative";
    const riskCard: CardProps = {
        icon: "🛡️",
        title: "Risk Profile",
        level: riskLevel,
        headline: ddAbs <= 15
            ? "Max drawdown is well-controlled at this risk level."
            : ddAbs <= 30
                ? "Drawdown is moderate — manageable with proper position sizing."
                : "High drawdown detected — risk management needs review.",
        body: ddAbs <= 15
            ? `Your worst peak-to-trough decline was ${ddAbs.toFixed(1)}%. This is within acceptable limits for most trading styles. The strategy can be scaled with confidence.`
            : ddAbs <= 30
                ? `A ${ddAbs.toFixed(1)}% maximum drawdown requires disciplined position sizing to survive. Consider using 0.5–1% risk per trade to keep account drawdowns survivable.`
                : `A ${ddAbs.toFixed(1)}% drawdown is significant. Prop firm challenges and live trading both require this to be reduced before deployment.`,
        tip: ddAbs <= 15
            ? "A Kelly-based position sizing model will optimize returns at this drawdown level."
            : ddAbs <= 30
                ? "Use 0.5× Kelly criterion to reduce drawdown by ~40% while retaining most of the upside."
                : "Target a maximum of 20% drawdown. Add a daily and weekly loss limit to enforce it.",
    };

    // Card 3: Sample Reliability
    const sampleLevel: CardProps["level"] = totalTrades >= 100 ? "positive" : totalTrades >= 30 ? "neutral" : "negative";
    const sampleCard: CardProps = {
        icon: "🔬",
        title: "Sample Reliability",
        level: sampleLevel,
        headline: totalTrades >= 100
            ? "Statistically robust sample — results carry high confidence."
            : totalTrades >= 30
                ? "Moderate sample — results are directional but not conclusive."
                : "Small sample — results should not be trusted without more data.",
        body: totalTrades >= 100
            ? `${totalTrades} trades provides strong statistical power. The metrics shown have low variance and are unlikely to be the result of random luck.`
            : totalTrades >= 30
                ? `${totalTrades} trades is enough to detect a trend, but not to quantify it precisely. We recommend accumulating at least 100 trades before drawing firm conclusions.`
                : `With only ${totalTrades} trades, any apparent edge may be entirely due to variance. At this sample size, even a losing strategy can appear profitable by chance.`,
        tip: totalTrades >= 100
            ? "Re-analyze periodically as you add new trades to monitor if the edge is stable over time."
            : totalTrades >= 30
                ? "Continue trading and re-upload your history every 30 additional trades to track how metrics stabilize."
                : "Do not change your strategy based on fewer than 30 trades. Focus on getting to 50+ first.",
    };

    // Card 4: Edge Location
    const location = computeEdgeLocation(trades);
    const locationParts: string[] = [];
    if (location.bestSymbol) locationParts.push(location.bestSymbol);
    if (location.bestSession) locationParts.push(`${location.bestSession} session`);
    if (location.bestDayOfWeek) locationParts.push(location.bestDayOfWeek);
    if (location.bestRR) locationParts.push(`${location.bestRR} RR range`);

    const locationCard: CardProps = {
        icon: "📍",
        title: "Edge Location",
        level: "info",
        headline: location.hasSufficientData
            ? `Your strategy performs best on ${locationParts.join(", ")}.`
            : "Not enough data to determine edge location.",
        body: location.hasSufficientData
            ? `Analysis of your ${trades.length} trades shows the highest average profit ${location.bestSymbol ? `on ${location.bestSymbol}` : ""
            }${location.bestSession ? ` during the ${location.bestSession} session` : ""}${location.bestDayOfWeek ? ` on ${location.bestDayOfWeek}s` : ""
            }. Concentrating on these conditions may significantly improve overall performance.`
            : `Add symbol, session time, and direction data to your CSV to unlock this insight. It identifies exactly when and where your edge is strongest.`,
        tip: location.hasSufficientData
            ? `Consider filtering your strategy to only trade during the ${location.bestSession ?? "highest-performing"} session on ${location.bestDayOfWeek ?? "your best days"}.`
            : "Make sure your CSV includes a 'symbol' column and a datetime column to enable edge location analysis.",
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#4b5563" }}>Strategy Insights</h3>
            <InsightCard {...edgeCard} />
            <InsightCard {...riskCard} />
            <InsightCard {...sampleCard} />
            <InsightCard {...locationCard} />
        </div>
    );
}
