"use client";

import { useEffect, useRef, useState } from "react";
import type { BasicMetrics } from "@/lib/analyzer/metrics";
import type { Trade } from "@/lib/analyzer/parser";
import { calcEdgeScore } from "@/lib/edgeScore";

interface Props {
    metrics: BasicMetrics;
    format: string;
    fileName?: string;
    trades?: Trade[];
    onViewFullReport?: () => void;
}

function scoreTier(s: number): { label: string; color: string; bg: string; border: string; ring: string } {
    if (s >= 75) return { label: "Strong Edge", color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)", ring: "#10b981" };
    if (s >= 50) return { label: "Positive Edge", color: "#818cf8", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.25)", ring: "#818cf8" };
    if (s >= 30) return { label: "Marginal Edge", color: "#fbbf24", bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.25)", ring: "#fbbf24" };
    return { label: "No Clear Edge", color: "#f87171", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", ring: "#f87171" };
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
function ScoreRing({ score, color, size = 160 }: { score: number; displayScore: number; color: string; size?: number }) {
    const radius = (size - 16) / 2;
    const circ = 2 * Math.PI * radius;
    const fill = (score / 100) * circ;
    return (
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <circle
                cx={size / 2} cy={size / 2} r={radius}
                fill="none" stroke={color} strokeWidth="8"
                strokeDasharray={`${fill} ${circ}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray 0.05s linear" }}
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
function buildNarrative(metrics: BasicMetrics, trades: Trade[]): string {
    const expR = computeExpectancyR(trades);
    if (expR !== null) {
        if (expR > 0) return `Your strategy earns +${expR}R per trade on average — that is a real statistical edge.`;
        if (expR === 0) return `Your strategy breaks even at 0.00R per trade. Edge needs improvement.`;
        return `Your strategy loses ${expR}R per trade on average — review entry/exit rules.`;
    }
    // Fallback: use profit factor (no currency — R-neutral)
    const pf = metrics.profitFactor;
    if (pf >= 1.5) return `Profit Factor ${pf.toFixed(2)} — your strategy returns ${pf.toFixed(2)} units for every 1 unit lost. A solid edge.`;
    if (pf >= 1.0) return `Profit Factor ${pf.toFixed(2)} is profitable but marginal. Small improvements to R:R or entry timing could significantly boost returns.`;
    return `Profit Factor below 1.0 means losses outweigh gains. Review entry timing and stop loss placement before trading live.`;
}

export default function BasicResults({ metrics, format, fileName, trades = [], onViewFullReport }: Props) {
    // Compute 0-100 score from calcEdgeScore (0-10) × 10
    const edgeRaw = calcEdgeScore(metrics.winrate, metrics.profitFactor, metrics.maxDrawdown, metrics.totalTrades);
    // Apply sample-size penalty consistent with leaderboard
    let rawScore = Math.round(edgeRaw * 10);
    if (metrics.totalTrades < 50) rawScore = Math.round(rawScore * 0.6);
    else if (metrics.totalTrades < 100) rawScore = Math.round(rawScore * 0.8);
    rawScore = Math.min(100, Math.max(0, rawScore));

    const tier = scoreTier(rawScore);
    const animatedScore = useCountUp(rawScore, 1200, 300);
    const narrative = buildNarrative(metrics, trades);
    const wr = metrics.winrate;

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6 animate-fade-in">

            {/* ── Score Hero ── */}
            <div className="flex flex-col items-center py-10 rounded-2xl"
                style={{ background: tier.bg, border: `1px solid ${tier.border}` }}>

                {/* Ring + number */}
                <div className="relative mb-4">
                    <ScoreRing score={animatedScore} displayScore={animatedScore} color={tier.ring} size={160} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-black tabular-nums leading-none" style={{ color: tier.color }}>
                            {animatedScore}
                        </span>
                        <span className="text-xs font-semibold mt-1" style={{ color: tier.color, opacity: 0.7 }}>/ 100</span>
                    </div>
                </div>

                {/* Tier label */}
                <div className="text-sm font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-3"
                    style={{ background: `${tier.color}18`, border: `1px solid ${tier.color}40`, color: tier.color }}>
                    {tier.label}
                </div>

                {/* Narrative */}
                <p className="text-sm text-center max-w-xs px-4 leading-relaxed" style={{ color: "#9ca3af" }}>
                    {narrative}
                </p>

                {/* Trade count */}
                <p className="text-xs mt-3" style={{ color: "#4b5563" }}>
                    Based on <span style={{ color: "#6b7280" }}>{metrics.totalTrades}</span> trades{fileName ? ` · ${fileName}` : ""}
                </p>
            </div>

            {/* ── 4 Key Metrics ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Win Rate", value: `${wr.toFixed(1)}%`, good: wr >= 50, neutral: wr >= 40 },
                    { label: "Profit Factor", value: metrics.profitFactor.toFixed(2), good: metrics.profitFactor >= 1.5, neutral: metrics.profitFactor >= 1 },
                    { label: "Max Drawdown", value: `${Math.abs(metrics.maxDrawdown).toFixed(1)}%`, good: false, neutral: metrics.maxDrawdown <= 20 },
                    { label: "Net P&L", value: `${metrics.sumProfit >= 0 ? "+" : ""}${metrics.sumProfit.toFixed(2)}`, good: metrics.sumProfit > 0, neutral: metrics.sumProfit >= 0 },
                ].map(m => {
                    const color = m.good ? "#34d399" : m.neutral ? "#fbbf24" : "#f87171";
                    return (
                        <div key={m.label} className="rounded-xl px-4 py-4 text-center"
                            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <p className="text-[11px] font-medium uppercase tracking-wider mb-1.5" style={{ color: "#6b7280" }}>
                                {m.label}
                            </p>
                            <p className="text-xl font-bold tabular-nums" style={{ color }}>
                                {m.value}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* ── File badge ── */}
            <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}>
                    {format === "mt5" ? "MT5 Export" : format === "mt4" ? "MT4 Export" : format === "binance" ? "Binance" : "CSV Import"}
                </span>
            </div>
        </div>
    );
}
