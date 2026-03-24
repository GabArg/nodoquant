"use client";

import { useEffect, useRef, useState } from "react";
import type { BasicMetrics, FullMetrics } from "@/lib/analyzer/metrics";
import type { Trade } from "@/lib/analyzer/parser";
import { calcEdgeScore } from "@/lib/edgeScore";
import { useTranslations } from "next-intl";

interface Props {
    metrics: BasicMetrics;
    fullMetrics?: FullMetrics;
    format: string;
    fileName?: string;
    trades?: Trade[];
    onViewFullReport?: () => void;
    onReset?: () => void;
    hideScore?: boolean;
    hideMetrics?: boolean;
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

function getDiagnosisState(metrics: BasicMetrics, fullMetrics?: FullMetrics, rawScore?: number): string {
    if (fullMetrics?.advanced?.verdict) {
        return fullMetrics.advanced.verdict;
    }

    const pf = metrics.profitFactor;
    const exp = metrics.expectancy;
    const n = metrics.totalTrades;
    
    if (n < 30) return "insufficientSample";
    if (pf < 1 || exp <= 0) return "noEdge";
    if (pf >= 1.3 && n >= 100) return "strongEdge";
    if (pf >= 1.1 && n >= 50) return "weakEdge";
    
    return "unstableEdge";
}

export default function BasicResults({ metrics, fullMetrics, format, fileName, trades = [], onViewFullReport, onReset, hideScore, hideMetrics }: Props) {
    const t = useTranslations("analyzer.results");
    const diagT = useTranslations("analyzer.results.diagnosis");
    const interpT = useTranslations("analyzer.results.interpretation");
    const nextT = useTranslations("analyzer.results.nextSteps");
    const stabT = useTranslations("analyzer.results.stability");
    const ttT = useTranslations("analyzer.results.tooltips");
    const wizT = useTranslations("analyzer.wizard");
    const confT = useTranslations("analyzer.edgeConfidence");
    const robustT = useTranslations("analyzer.robustness");
    
    const [copied, setCopied] = useState(false);
    
    // Compute 0-100 score: use advanced edgeConfidence if available, else basic calc
    let rawScore = 0;
    if (fullMetrics?.advanced?.edgeConfidence !== undefined) {
        rawScore = fullMetrics.advanced.edgeConfidence;
    } else {
        const edgeRaw = calcEdgeScore(metrics.winrate, metrics.profitFactor, metrics.maxDrawdown, metrics.totalTrades);
        rawScore = Math.round(edgeRaw * 10);
        if (metrics.totalTrades < 50) rawScore = Math.round(rawScore * 0.6);
        else if (metrics.totalTrades < 100) rawScore = Math.round(rawScore * 0.8);
    }
    rawScore = Math.min(100, Math.max(0, rawScore));

    const diagState = getDiagnosisState(metrics, fullMetrics, rawScore);
    const animatedScore = useCountUp(rawScore, 1200, 300);
    const animatedConfidence = useCountUp(fullMetrics?.advanced?.edgeConfidence ?? 0, 1500, 500);
    
    const copySummary = () => {
        const text = `${t("summaryLabels.score")}: ${rawScore}
${t("summaryLabels.trades")}: ${metrics.totalTrades}
${t("summaryLabels.winRate")}: ${metrics.winrate.toFixed(1)}%
${t("summaryLabels.pf")}: ${metrics.profitFactor.toFixed(2)}
${t("summaryLabels.dd")}: ${Math.abs(metrics.maxDrawdown).toFixed(1)}%
${t("summaryLabels.pnl")}: ${metrics.sumProfit >= 0 ? "+" : ""}${metrics.sumProfit.toFixed(2)}`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const metricCards = [
        { id: "score", label: t("metrics.score") || "Strategy Score", value: animatedScore, color: "#818cf8", tip: ttT("score") },
        { id: "conf", label: confT("title"), value: animatedConfidence, color: (fullMetrics?.advanced?.edgeConfidence ?? 0) >= 70 ? "#10b981" : (fullMetrics?.advanced?.edgeConfidence ?? 0) >= 30 ? "#fb923c" : "#f87171", tip: confT("tooltip") },
        { id: "pf", label: t("metrics.profitFactor"), value: metrics.profitFactor.toFixed(2), color: metrics.profitFactor >= 1.5 ? "#10b981" : metrics.profitFactor >= 1 ? "#fb923c" : "#f87171", tip: ttT("pf") },
        { id: "exp", label: t("metrics.expectancy") || "Expectancy", value: metrics.expectancy.toFixed(2), color: metrics.expectancy > 0 ? "#10b981" : "#f87171", tip: ttT("expectancy") },
        { id: "dd", label: t("metrics.maxDrawdown"), value: `${Math.abs(metrics.maxDrawdown).toFixed(1)}%`, color: Math.abs(metrics.maxDrawdown) <= 15 ? "#10b981" : "#fb923c", tip: ttT("maxDrawdown") },
    ];

    const stateInfo = diagT.raw(diagState);

    return (
        <div className="w-full max-w-4xl mx-auto space-y-12 animate-fade-in px-4 sm:px-6">
            
            {/* ── Section 1: Strategy Diagnosis Header (Shown if !hideScore) ── */}
            {!hideScore && (
                <div className="flex flex-col items-center text-center space-y-6">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-500">
                        {diagT("title")}
                    </h2>
                    
                    <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full border border-white/10 backdrop-blur-md shadow-xl transition-all duration-500`}
                         style={{ background: `rgba(255,255,255,0.02)` }}>
                        <span className="text-xl">{stateInfo.icon}</span>
                        <span className="text-xs font-black uppercase tracking-widest text-white whitespace-nowrap">
                            {stateInfo.label}
                        </span>
                        <div className={`w-2 h-2 rounded-full animate-pulse`} 
                             style={{ 
                                 backgroundColor: 
                                    diagState === "strongEdge" ? "#10b981" : 
                                    diagState === "weakEdge" ? "#34d399" :
                                    diagState === "unstableEdge" ? "#fb923c" :
                                    diagState === "noEdge" ? "#f87171" : "#94a3b8" 
                             }} />
                        {fullMetrics?.advanced?.robustnessLevel && (
                             <div className="flex items-center gap-2 pl-2 ml-2 border-l border-white/10">
                                 <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{robustT("title")}:</span>
                                 <span className={`text-[10px] font-black uppercase tracking-widest ${
                                     fullMetrics.advanced.robustnessLevel === "elite" ? "text-indigo-400" :
                                     fullMetrics.advanced.robustnessLevel === "robust" ? "text-emerald-400" :
                                     fullMetrics.advanced.robustnessLevel === "moderate" ? "text-amber-400" : "text-red-400"
                                 }`}>
                                     {robustT(`levels.${fullMetrics.advanced.robustnessLevel}`)}
                                 </span>
                             </div>
                        )}
                    </div>

                    <p className="text-sm text-gray-400 font-medium max-w-md italic leading-relaxed">
                        "{stateInfo.explanation}"
                    </p>
                </div>
            )}

            {/* ── Sections 2-5: Key Metrics Panel (Shown if !hideMetrics) ── */}
            {!hideMetrics && (
                <>
                    {/* ── Section 2: Key Metrics Panel (2x2 Grid) ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        {metricCards.map((m) => (
                            <div key={m.id} className="group relative flex flex-col p-6 rounded-[32px] bg-white/[0.01] border border-white/[0.05] hover:bg-white/[0.03] hover:border-white/10 transition-all duration-500 overflow-visible shadow-lg shadow-black/10">
                                <div className="flex items-start gap-2 mb-4 relative group-hover:z-50 min-h-[32px]">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-400 transition-colors uppercase leading-tight">{m.label}</span>
                                    <div className="relative group/tip cursor-help ml-auto mt-0.5">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/10 transition-colors group-hover/tip:text-white/40">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M12 16v-4M12 8h.01" />
                                        </svg>
                                        <div className="opacity-0 translate-y-2 group-hover/tip:opacity-100 group-hover/tip:translate-y-0 transition-all duration-300 absolute left-1/2 -translate-x-1/2 bottom-full mb-4 w-60 p-5 bg-gray-950/95 border border-white/10 rounded-[28px] text-[11px] leading-relaxed text-gray-400 font-medium z-[100] pointer-events-none shadow-2xl backdrop-blur-3xl text-center whitespace-normal">
                                            <div className="absolute inset-0 bg-indigo-500/5 rounded-[28px] -z-10" />
                                            {m.tip}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 flex flex-col justify-end">
                                    <p className="text-3xl md:text-2xl xl:text-4xl font-black tabular-nums transition-transform duration-700 group-hover:scale-105"
                                       style={{ color: m.color, textShadow: `0 10px 30px ${m.color}20` }}>
                                        {m.value}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── Section 3: Monte Carlo Stability ── */}
                    {fullMetrics?.monteCarlo && (
                        <div className="rounded-[40px] p-8 md:p-10 bg-white/[0.02] border border-white/[0.06] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] pointer-events-none" />
                            
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                                <div className="space-y-4">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-500">
                                        {stabT("title")}
                                    </h3>
                                    <div className="space-y-2">
                                        <p className="text-4xl font-black text-white italic">
                                            {stabT("confidence", { val: Math.round(100 - (fullMetrics.monteCarlo.riskOfRuin || 0)) })}
                                        </p>
                                        <p className="text-xs text-gray-400 font-medium">
                                            {stabT("microcopy")}
                                        </p>
                                    </div>
                                    
                                    {/* Monte Carlo Comparison Insight */}
                                    <div className="flex items-center gap-6 pt-4 mt-4 border-t border-white/5">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Historical DD</p>
                                            <p className="text-lg font-black text-white">{Math.abs(metrics.maxDrawdown).toFixed(1)}%</p>
                                        </div>
                                        <div className="w-px h-8 bg-white/5" />
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">MC Worst case</p>
                                            <p className="text-lg font-black text-red-500">{fullMetrics.monteCarlo.drawdownAt5Pct.toFixed(1)}%</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="hidden md:block w-48 h-16 opacity-50">
                                    <svg viewBox="0 0 200 60" className="w-full h-full text-indigo-500/30">
                                        <path d="M0 40 Q 50 10, 100 35 T 200 15" fill="none" stroke="currentColor" strokeWidth="4" />
                                        <path d="M0 45 Q 60 20, 110 40 T 200 25" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                                        <path d="M0 35 Q 40 5, 90 30 T 200 10" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Section 4: Interpretation Panel ── */}
                    <div className="space-y-6">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-500 px-1">
                            {interpT("title")}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {(() => {
                                const rawItems = interpT.raw(diagState);
                                const items = Array.isArray(rawItems) ? rawItems : Object.values(rawItems || {});
                                return items.map((item: any, i: number) => (
                                    <div key={i} className="flex gap-4 p-5 rounded-3xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-colors group">
                                        <span className="text-indigo-500 font-black text-xs mt-0.5 group-hover:scale-110 transition-transform">•</span>
                                        <p className="text-xs text-gray-400 font-medium leading-relaxed">
                                            {String(item)}
                                        </p>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>

                    {/* ── Section 5: Suggested Next Step ── */}
                    <div className="pt-12 border-t border-white/5">
                        <div className="rounded-[40px] p-8 md:p-10 bg-gradient-to-br from-indigo-500/[0.08] to-transparent border border-indigo-500/20 shadow-2xl shadow-indigo-500/10">
                            <div className="flex flex-col md:flex-row items-center gap-8 justify-between">
                                <div className="space-y-4 text-center md:text-left">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">
                                        {nextT("title")}
                                    </h3>
                                    <p className="text-lg font-black text-white leading-tight italic max-w-sm">
                                        {nextT(diagState)}
                                    </p>
                                </div>
                                
                                <div className="flex flex-wrap justify-center gap-4">
                                    <button onClick={onViewFullReport} 
                                            className="px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/30 active:scale-95">
                                        {wizT("viewReport") || "Unlock Full Report"}
                                    </button>
                                    {onReset && (
                                        <button onClick={onReset}
                                                className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-gray-400 text-[11px] font-black uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all active:scale-95">
                                            {wizT("importAnother")}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ── Footer Info (Shown always) ── */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 opacity-40 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                        {format.toUpperCase()} ANALYSIS
                    </span>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                        {t("basedOn", { count: metrics.totalTrades })}{fileName ? ` · ${fileName}` : ""}
                    </p>
                </div>
                
                <button onClick={copySummary} className="flex items-center gap-2 group text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                    </svg>
                    {copied ? t("copied") : t("copySummary")}
                </button>
            </div>
        </div>
    );
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
