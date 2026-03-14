"use client";

import { useEffect, useRef, useState } from "react";
import type { BasicMetrics } from "@/lib/analyzer/metrics";
import type { Trade } from "@/lib/analyzer/parser";
import { calcEdgeScore } from "@/lib/edgeScore";
import { useTranslations } from "next-intl";

interface Props {
    metrics: BasicMetrics;
    format: string;
    fileName?: string;
    trades?: Trade[];
    onViewFullReport?: () => void;
    onReset?: () => void;
    hideScore?: boolean;
    hideMetrics?: boolean;
}

function scoreTier(s: number, t: any): { label: string; color: string; bg: string; border: string; ring: string; narrative: string; ranking: string } {
    if (s >= 90) return { 
        label: t("tiers.elite"), 
        color: "#10b981", 
        bg: "rgba(16,185,129,0.08)", 
        border: "rgba(16,185,129,0.25)", 
        ring: "#10b981",
        narrative: t("narrative.elite"),
        ranking: t("ranking.top5")
    };
    if (s >= 75) return { 
        label: t("tiers.strong"), 
        color: "#10b981", 
        bg: "rgba(16,185,129,0.08)", 
        border: "rgba(16,185,129,0.25)", 
        ring: "#10b981",
        narrative: t("narrative.strong"),
        ranking: t("ranking.top20")
    };
    if (s >= 60) return { 
        label: t("tiers.promising"), 
        color: "#fbbf24", 
        bg: "rgba(251,191,36,0.08)", 
        border: "rgba(251,191,36,0.25)", 
        ring: "#fbbf24",
        narrative: t("narrative.promising"),
        ranking: t("ranking.top40")
    };
    if (s >= 40) return { 
        label: t("tiers.unstable"), 
        color: "#fb923c", 
        bg: "rgba(251,146,60,0.08)", 
        border: "rgba(251,146,60,0.25)", 
        ring: "#fb923c",
        narrative: t("narrative.unstable"),
        ranking: t("ranking.bottom50")
    };
    return { 
        label: t("tiers.none"), 
        color: "#f87171", 
        bg: "rgba(239,68,68,0.08)", 
        border: "rgba(239,68,68,0.25)", 
        ring: "#f87171",
        narrative: t("narrative.none"),
        ranking: t("ranking.bottom20")
    };
}

/** Animated count-up hook */
function useCountUp(target: number, duration = 1200, delay = 200) {
    const [value, setValue] = useState(0);
    const raf = useRef<number>(0);
    useEffect(() => {
        const start = performance.now() + delay;
        function step(now: number) {
            const elapsed = Math.max(0, now - start);
            const t = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - t, 3);
            setValue(Math.round(eased * target));
            if (t < 1) raf.current = requestAnimationFrame(step);
        }
        raf.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf.current);
    }, [target, duration, delay]);
    return value;
}

/** SVG ring progress */
function ScoreRing({ score, color, size = 200 }: { score: number; displayScore: number; color: string; size?: number }) {
    const radius = (size - 20) / 2;
    const circ = 2 * Math.PI * radius;
    const fill = (score / 100) * circ;
    return (
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} className="drop-shadow-[0_0_25px_rgba(0,0,0,0.5)]">
            <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="10" />
            <circle
                cx={size / 2} cy={size / 2} r={radius}
                fill="none" stroke={color} strokeWidth="10"
                strokeDasharray={`${fill} ${circ}`}
                strokeLinecap="round"
                style={{ 
                    transition: "stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                    filter: "url(#glow)"
                }}
            />
        </svg>
    );
}


/** Compute R-based expectancy from trades if risk_reward available, else null */
function computeExpectancyR(trades: Trade[]): number | null {
    const withRR = trades.filter(t => t.risk_reward != null && t.risk_reward > 0);
    if (withRR.length < trades.length * 0.3) return null; // < 30% have RR data
    const winners = withRR.filter(t => t.profit > 0);
    const losers = withRR.filter(t => t.profit <= 0);
    const wr = winners.length / withRR.length;
    const avgWinR = winners.length > 0
        ? winners.reduce((s, t) => s + (t.risk_reward ?? 1), 0) / winners.length
        : 0;
    return parseFloat(((wr * avgWinR) - (1 - wr) * 1).toFixed(2));
}

/** Generate the one-liner using R if available, else profit factor */
function buildNarrative(metrics: BasicMetrics, trades: Trade[], t: any): string {
    const expR = computeExpectancyR(trades);
    if (expR !== null) {
        if (expR > 0) return t("narrative.gainR", { val: expR });
        if (expR === 0) return t("narrative.breakEvenR");
        return t("narrative.lossR", { val: expR });
    }
    // Fallback: use profit factor (no currency — R-neutral)
    const pf = metrics.profitFactor;
    if (pf >= 1.5) return t("narrative.highPf", { val: pf.toFixed(2) });
    if (pf >= 1.0) return t("narrative.marginalPf", { val: pf.toFixed(2) });
    return t("narrative.lowPf");
}

export default function BasicResults({ metrics, format, fileName, trades = [], onViewFullReport, onReset, hideScore, hideMetrics }: Props) {
    const t = useTranslations("analyzer.results");
    const wizT = useTranslations("analyzer.wizard");
    const [copied, setCopied] = useState(false);
    // Compute 0-100 score from calcEdgeScore (0-10) × 10
    const edgeRaw = calcEdgeScore(metrics.winrate, metrics.profitFactor, metrics.maxDrawdown, metrics.totalTrades);
    // Apply sample-size penalty consistent with leaderboard
    let rawScore = Math.round(edgeRaw * 10);
    if (metrics.totalTrades < 50) rawScore = Math.round(rawScore * 0.6);
    else if (metrics.totalTrades < 100) rawScore = Math.round(rawScore * 0.8);
    rawScore = Math.min(100, Math.max(0, rawScore));

    const tier = scoreTier(rawScore, t);
    const animatedScore = useCountUp(rawScore, 1200, 300);
    const narrativeHeader = buildNarrative(metrics, trades, t);
;
    const wr = metrics.winrate;

    const copySummary = () => {
        const edgeLabel = rawScore >= 60 ? t("tiers.promising") : rawScore >= 40 ? t("tiers.unstable") : t("tiers.none");
        const text = `${t("summaryLabels.score")}: ${rawScore}
${t("summaryLabels.edge")}: ${edgeLabel}
${t("summaryLabels.trades")}: ${metrics.totalTrades}
${t("summaryLabels.winRate")}: ${wr.toFixed(1)}%
${t("summaryLabels.pf")}: ${metrics.profitFactor.toFixed(2)}
${t("summaryLabels.dd")}: ${Math.min(99.9, Math.abs(metrics.maxDrawdown)).toFixed(1)}%
${t("summaryLabels.pnl")}: ${metrics.sumProfit >= 0 ? "+" : ""}${metrics.sumProfit.toFixed(2)}`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-10 animate-fade-in">

            {/* ── Score Hero ── */}
            {!hideScore && (
                <div className="flex flex-col items-center py-16 rounded-[40px] relative overflow-hidden transition-all duration-500 shadow-[0_24px_60px_rgba(0,0,0,0.4)]"
                    style={{ background: tier.bg, border: `1px solid ${tier.border}` }}>
                    
                    {/* Background soft glow */}
                    <div className="absolute inset-0 pointer-events-none opacity-20 blur-[100px]"
                        style={{ background: `radial-gradient(circle, ${tier.color} 0%, transparent 70%)` }} />

                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-400 mb-10 relative z-10">
                        {t("scoreTitle")}
                    </p>

                    {/* Ring + number (The Gauge) */}
                    <div className="relative mb-10 group z-10 scale-110 sm:scale-125">
                        <ScoreRing score={animatedScore} displayScore={animatedScore} color={tier.ring} size={200} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-8xl sm:text-9xl font-black tabular-nums tracking-tighter leading-none" style={{ color: tier.color, textShadow: `0 0 40px ${tier.color}40` }}>
                                {animatedScore}
                            </span>
                        </div>
                    </div>

                    {/* Tier label & Description */}
                    <div className="flex flex-col items-center max-w-sm px-8 text-center animate-slide-up relative z-10">
                        <h3 className="text-5xl font-black text-white mb-4 tracking-tighter leading-tight italic uppercase">
                            {tier.label}
                        </h3>
                        
                        {/* Narrative Message */}
                        <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-xs mb-4">
                            {tier.narrative}
                        </p>

                        {/* Narrative Detail (1-liner R/PF info) */}
                        <div className="rounded-xl px-4 py-2 bg-white/[0.04] border border-white/[0.08] text-[10px] font-bold text-gray-500 italic mb-6">
                            "{narrativeHeader}"
                        </div>

                        {/* Global Ranking Message */}
                        <div className="flex flex-col items-center gap-2 mb-10">
                            <p className="text-xs font-black px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/5" style={{ color: tier.color }}>
                                {tier.ranking}
                            </p>
                        </div>

                        {/* Copy Summary & Badge */}
                        <div className="flex flex-col items-center gap-6">
                            <div className="flex items-center gap-4">
                                <span className="text-[9px] px-3 py-1 rounded-full font-bold uppercase tracking-widest" style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}>
                                    {format === "mt5" ? t("formatMt5") : format === "mt4" ? t("formatMt4") : format === "binance" ? t("formatBinance") : t("formatCsv")}
                                </span>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                                    {t("basedOn", { count: metrics.totalTrades })}{fileName ? ` · ${fileName}` : ""}
                                </p>
                            </div>

                            <div className="flex flex-wrap justify-center gap-4">
                                <button 
                                    onClick={copySummary}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all shadow-xl shadow-black/20"
                                >
                                    {copied ? (
                                        <>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                            {t("copied")}
                                        </>
                                    ) : (
                                        <>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                                                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                                            </svg>
                                            {t("copySummary")}
                                        </>
                                    )}
                                </button>

                                {onReset && (
                                    <button 
                                        onClick={onReset}
                                        className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/[0.05] border border-white/[0.1] text-gray-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/[0.1] hover:text-white transition-all"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                            <path d="M3 3v5h5" />
                                        </svg>
                                        {wizT("importAnother")}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── 4 Key Metrics ── */}
            {!hideMetrics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { 
                            label: t("metrics.winrate"), 
                            value: `${wr.toFixed(1)}%`, 
                            good: wr >= 50, 
                            neutral: wr >= 40,
                            gradient: "from-emerald-400 to-teal-500" 
                        },
                        { 
                            label: t("metrics.profitFactor"), 
                            value: metrics.profitFactor.toFixed(2), 
                            good: metrics.profitFactor >= 1.5, 
                            neutral: metrics.profitFactor >= 1,
                            gradient: "from-cyan-400 to-blue-500"
                        },
                        { 
                            label: t("metrics.maxDrawdown"), 
                            value: `${Math.min(99.9, Math.abs(metrics.maxDrawdown)).toFixed(1)}%`, 
                            subValue: `($${Math.round(metrics.maxDrawdownAbs)})`,
                            good: Math.abs(metrics.maxDrawdown) <= 15, 
                            neutral: Math.abs(metrics.maxDrawdown) <= 30,
                            gradient: "from-emerald-400 to-emerald-600" // Always green for low draws
                        },
                        { 
                            label: t("metrics.netPnl"), 
                            value: `${metrics.sumProfit >= 0 ? "+" : ""}${metrics.sumProfit.toFixed(2)}`, 
                            good: metrics.sumProfit > 0, 
                            neutral: metrics.sumProfit >= 0,
                            gradient: "from-green-400 to-emerald-500"
                        },
                    ].map(m => {
                        const isBad = !m.good && !m.neutral;
                        const color = m.good ? "#10b981" : m.neutral ? "#fb923c" : "#f87171";
                        const gradientClass = isBad ? "from-rose-400 to-red-500" : m.gradient;
                        
                        return (
                            <div key={m.label} className="group relative flex flex-col items-center rounded-[32px] px-5 py-9 text-center transition-all duration-500 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.15] hover:-translate-y-2 overflow-hidden">
                                
                                {/* Background Glow Effect on Hover */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-[40px] pointer-events-none"
                                    style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }} />

                                <div className="min-h-[2.5rem] flex items-center justify-center mb-1 relative z-10">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 group-hover:text-gray-300 transition-colors">
                                        {m.label}
                                    </p>
                                </div>

                                <p className={`text-3xl sm:text-4xl font-black tabular-nums transition-all duration-500 group-hover:scale-110 bg-gradient-to-br ${gradientClass} bg-clip-text text-transparent relative z-10`}
                                   style={{ filter: `drop-shadow(0 0 15px ${color}30)` }}>
                                    {m.value}
                                </p>

                                {"subValue" in m && m.subValue && (
                                    <p className="text-[10px] font-bold tracking-widest mt-2 opacity-60 tabular-nums relative z-10" style={{ color }}>
                                        {m.subValue}
                                    </p>
                                )}

                                {/* Subtle Bottom Light Streak */}
                                <div className="absolute bottom-0 left-1/4 right-1/4 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                                     style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
