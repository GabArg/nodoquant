"use client";

import type { Trade } from "@/lib/analyzer/parser";
import { useTranslations } from "next-intl";

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

const SESSION_MAP_KEY = (hour: number): string => {
    if (hour >= 7 && hour < 16) return "london";
    if (hour >= 12 && hour < 21) return "newyork";
    if (hour >= 0 && hour < 8) return "asia";
    return "outOfHours";
};

function computeEdgeLocation(trades: Trade[], t: any): EdgeLocation {
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
    const dayNames: string[] = t.raw("days");
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
    const bestDayOfWeek = bestDayEntry ? dayNames[bestDayEntry.d] : null;

    // Best session
    const bySession: Record<string, number[]> = {};
    const sessionsT = t.raw("sessions");
    trades.forEach(t => {
        const dt = t.exit_time ?? t.datetime;
        if (dt) {
            const key = SESSION_MAP_KEY(dt.getUTCHours());
            const sessionName = sessionsT[key];
            bySession[sessionName] = bySession[sessionName] ?? [];
            bySession[sessionName].push(t.profit);
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
    tip: string;
}

const LEVEL_STYLE = {
    positive: { dot: "#10b981", border: "rgba(16,185,129,0.15)", bg: "linear-gradient(135deg, rgba(16,185,129,0.06) 0%, transparent 100%)", head: "#34d399" },
    neutral: { dot: "#fbbf24", border: "rgba(251,191,36,0.15)", bg: "linear-gradient(135deg, rgba(251,191,36,0.06) 0%, transparent 100%)", head: "#fbbf24" },
    negative: { dot: "#f87171", border: "rgba(239,68,68,0.15)", bg: "linear-gradient(135deg, rgba(239,68,68,0.06) 0%, transparent 100%)", head: "#f87171" },
    info: { dot: "#818cf8", border: "rgba(99,102,241,0.15)", bg: "linear-gradient(135deg, rgba(99,102,241,0.06) 0%, transparent 100%)", head: "#a5b4fc" },
};

function InsightCard({ icon, title, level, headline, tip }: CardProps) {
    const t = useTranslations("analyzer.insights");
    const s = LEVEL_STYLE[level];
    
    const levelLabel = level === "positive" ? t("levels.optimal") 
                     : level === "negative" ? t("levels.warning") 
                     : level === "neutral" ? t("levels.review") 
                     : t("levels.analyzed");

    return (
        <div className="rounded-[28px] p-6 space-y-5 transition-all duration-300 hover:bg-white/[0.04] border group relative overflow-hidden bg-white/[0.01]" 
             style={{ borderColor: s.border }}>
            
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl shadow-inner">
                        {icon}
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] block mb-0.5" style={{ color: s.dot }}>{title}</span>
                        <div className="flex items-center gap-2">
                             <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
                             <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
                                {levelLabel}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <p className="text-xl font-black leading-tight tracking-tight text-white mb-3">
                    {headline}
                </p>
                <div className="flex gap-3">
                    <div className="w-px bg-indigo-500/30 shrink-0" />
                    <p className="text-[11px] leading-relaxed font-medium text-gray-400">
                        <span className="text-indigo-400 font-black mr-1 uppercase text-[9px] tracking-widest">{t("proTip")}</span>
                        {tip}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function StrategyInsight({ profitFactor, winrate, maxDrawdown, totalTrades, trades = [] }: InsightProps) {
    const t = useTranslations("analyzer.insights");

    // Card 1: Edge Quality
    const edgeLevel: CardProps["level"] = profitFactor >= 1.5 && winrate >= 50 ? "positive"
        : profitFactor >= 1.0 ? "neutral" : "negative";
    const edgeCard: CardProps = {
        icon: "📊",
        title: t("edgeQuality.title"),
        level: edgeLevel,
        headline: profitFactor >= 1.5 && winrate >= 50
            ? t("edgeQuality.solid")
            : profitFactor >= 1.0
                ? t("edgeQuality.marginal")
                : t("edgeQuality.none"),
        tip: profitFactor >= 1.5
            ? t("edgeQuality.tipSolid")
            : profitFactor >= 1.0
                ? t("edgeQuality.tipMarginal")
                : t("edgeQuality.tipNone"),
    };

    // Card 2: Risk Profile
    const ddAbs = Math.abs(maxDrawdown);
    const riskLevel: CardProps["level"] = ddAbs <= 15 ? "positive" : ddAbs <= 30 ? "neutral" : "negative";
    const riskCard: CardProps = {
        icon: "🛡️",
        title: t("riskProfile.title"),
        level: riskLevel,
        headline: ddAbs <= 15
            ? t("riskProfile.controlled")
            : ddAbs <= 30
                ? t("riskProfile.moderate")
                : t("riskProfile.high"),
        tip: ddAbs <= 15
            ? t("riskProfile.tipControlled")
            : ddAbs <= 30
                ? t("riskProfile.tipModerate")
                : t("riskProfile.tipHigh"),
    };

    // Card 3: Sample Reliability
    const sampleLevel: CardProps["level"] = totalTrades >= 100 ? "positive" : totalTrades >= 30 ? "neutral" : "negative";
    const sampleCard: CardProps = {
        icon: "🔬",
        title: t("sample.title"),
        level: sampleLevel,
        headline: totalTrades >= 100
            ? t("sample.robust")
            : totalTrades >= 30
                ? t("sample.moderate")
                : t("sample.low"),
        tip: totalTrades >= 100
            ? t("sample.tipRobust")
            : totalTrades >= 30
                ? t("sample.tipModerate")
                : t("sample.tipLow"),
    };

    // Card 4: Edge Location
    const location = computeEdgeLocation(trades, t);

    const locationCard: CardProps = {
        icon: "📍",
        title: t("location.title"),
        level: "info",
        headline: location.hasSufficientData
            ? t("location.optimal")
            : t("location.insufficient"),
        tip: location.hasSufficientData
            ? t("location.tipOptimal", { session: location.bestSession ?? "principal" })
            : t("location.tipInsufficient"),
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col items-center">
                <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-600 mb-2">{t("title")}</h3>
                <div className="h-1 w-12 bg-indigo-500/20 rounded-full" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InsightCard {...edgeCard} />
                <InsightCard {...riskCard} />
                <InsightCard {...sampleCard} />
                <InsightCard {...locationCard} />
            </div>
        </div>
    );
}
