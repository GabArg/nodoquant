"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { FullMetrics } from "@/lib/analyzer/metrics";
import EquityChart from "./EquityChart";
import DrawdownChart from "./DrawdownChart";
import TradeHistogram from "./TradeHistogram";
import type { Trade } from "@/lib/analyzer/parser";
import MonteCarloChart from "./MonteCarloChart";
import MonteCarloSummary from "./MonteCarloSummary";
import StrategyEvolution from "./Dashboard/StrategyEvolution";
import UnlockPro from "@/components/paywall/UnlockPro";

interface Props {
    metrics: FullMetrics;
    trades: Trade[];
    email: string;
    analysisId?: string | null;
    onSimulate?: () => void;
    onAddToComparison?: () => void;
    isInComparison?: boolean;
    isPro?: boolean;
}

function PrimaryCTA({ onClick }: { onClick: () => void }) {
    const tFunnel = useTranslations("analyzer.funnel");
    return (
        <div className="flex flex-col items-center gap-6 w-full py-8">
            <button
                onClick={onClick}
                className="group relative px-10 py-6 rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 text-white text-[15px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_20px_50px_rgba(79,70,229,0.5)] hover:shadow-[0_25px_60px_rgba(79,70,229,0.7)] active:scale-95 border border-white/20 ring-4 ring-indigo-500/10 overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-shimmer" />
                <span className="relative z-10">{tFunnel("unlockFull")}</span>
            </button>
            <div className="flex flex-col items-center gap-2 text-center">
                <p className="text-[12px] text-indigo-300 font-black uppercase tracking-[0.15em] drop-shadow-sm">
                    {tFunnel("unlockSubtext")}
                </p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.1em] opacity-60">
                    {tFunnel("basedOnTrades")}
                </p>
            </div>
        </div>
    );
}

function StrategyDiagnosis({ metrics, isPro }: { metrics: FullMetrics; isPro?: boolean }) {
    const t = useTranslations("analyzer.report.diagnosis");
    const tSignals = useTranslations("analyzer.report.keySignals");
    const tFunnel = useTranslations("analyzer.funnel");
    
    // Global noEdge enforcement: force red/risk if verdict is noEdge
    const isNoEdge = metrics.advanced?.verdict === "noEdge";
    const verdictKey = isNoEdge ? "noEdge" : (metrics.advanced?.verdict || "unstableEdge");

    const config = {
        strongEdge: {
            desc: "strongDesc",
            color: "text-emerald-400",
            bg: "bg-emerald-400/10",
            border: "border-emerald-400/20",
            icon: "✅"
        },
        weakEdge: {
            desc: "weakDesc",
            color: isNoEdge ? "text-red-500" : "text-indigo-400",
            bg: isNoEdge ? "bg-red-500/10" : "bg-indigo-400/10",
            border: isNoEdge ? "border-red-500/20" : "border-indigo-400/20",
            icon: isNoEdge ? "❌" : "📈"
        },
        unstableEdge: {
            desc: "unstableDesc",
            color: isNoEdge ? "text-red-500" : "text-yellow-500",
            bg: isNoEdge ? "bg-red-500/10" : "bg-yellow-500/10",
            border: isNoEdge ? "border-red-500/20" : "border-yellow-500/20",
            icon: isNoEdge ? "❌" : "⚠️"
        },
        noEdge: {
            desc: "noDesc",
            color: "text-red-500",
            bg: "bg-red-500/10",
            border: "border-red-500/20",
            icon: "❌"
        },
        insufficientSample: {
            desc: "insufficientDesc",
            color: "text-gray-400",
            bg: "bg-gray-400/10",
            border: "border-gray-400/20",
            icon: "📊"
        }
    };

    const verdict = config[verdictKey as keyof typeof config] || config.unstableEdge;
    const score = metrics.advanced?.edgeConfidence ?? 0;
    
    // Credible reinterpretation labels
    const getReinterpretedValue = (label: string, value: string) => {
        if (!isNoEdge || isPro) return value;
        if (label === tSignals("winRate") && metrics.winrate > 55) return tFunnel("shortTermHighWinrate");
        if (label === tSignals("maxDrawdown") && metrics.maxDrawdown < 10) return tFunnel("shortTermLowDrawdown");
        if (label === tSignals("profitFactor") && metrics.profitFactor > 1.2) return tFunnel("shortTermProfitability");
        return value;
    };

    return (
        <div className="space-y-6">
            <div className={`p-8 rounded-3xl border ${verdict.border} ${verdict.bg} relative overflow-hidden`}>
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                    <span className="text-[120px] leading-none font-black italic">{score}</span>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                    <div className="space-y-4 max-w-xl">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 block">
                                {t("title")}
                            </span>
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{verdict.icon}</span>
                                <h3 className={`text-2xl font-black uppercase tracking-tight ${verdict.color}`}>
                                    {t(verdictKey)}
                                </h3>
                            </div>
                        </div>
                        <p className="text-sm font-medium text-gray-300 leading-relaxed">
                            {t(verdict.desc)}
                        </p>
                    </div>

                    <div className="flex flex-col items-center md:items-end text-center md:text-right">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600">
                            {tFunnel(`diagnostic${verdictKey.charAt(0).toUpperCase() + verdictKey.slice(1)}`)}
                        </span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-6xl font-black text-white italic tracking-tighter">{(score || 0).toFixed(0)}</span>
                            <span className="text-xl font-bold text-gray-600">/100</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5">
                    <p className="text-[11px] font-medium text-gray-400 italic">
                        {t("scoreSubtitle")}
                    </p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <SignalCard 
                    label={tSignals("expectancy")} 
                    value={getReinterpretedValue(tSignals("expectancy"), `$${(metrics.expectancy || 0).toFixed(1)}`)} 
                    icon="💰" 
                    tooltip={tSignals("tooltips.expectancy")}
                    isNoEdge={isNoEdge && !isPro}
                />
                <SignalCard 
                    label={tSignals("profitFactor")} 
                    value={getReinterpretedValue(tSignals("profitFactor"), (metrics.profitFactor || 0).toFixed(2))} 
                    icon="⚖️" 
                    tooltip={tSignals("tooltips.profitFactor")}
                    isNoEdge={isNoEdge && !isPro}
                />
                <SignalCard 
                    label={tSignals("winRate")} 
                    value={getReinterpretedValue(tSignals("winRate"), `${(metrics.winrate || 0).toFixed(1)}%`)} 
                    icon="🎯" 
                    tooltip={tSignals("tooltips.winRate")}
                    isNoEdge={isNoEdge && !isPro}
                />
                <SignalCard 
                    label={tSignals("maxDrawdown")} 
                    value={getReinterpretedValue(tSignals("maxDrawdown"), `${(metrics.maxDrawdown || 0).toFixed(1)}%`)} 
                    icon="📉" 
                    tooltip={tSignals("tooltips.maxDrawdown")}
                    isNoEdge={isNoEdge && !isPro}
                />
                <SignalCard 
                    label={tSignals("sampleSize")} 
                    value={String(metrics.totalTrades || 0)} 
                    icon="📄" 
                    tooltip={tSignals("tooltips.sampleSize")}
                />
            </div>
        </div>
    );
}

function SignalCard({ label, value, icon, tooltip, isNoEdge = false }: { label: string; value: string; icon: string; tooltip?: string; isNoEdge?: boolean }) {
    return (
        <div className="group relative card rounded-2xl p-4 border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all hover:border-white/10">
            <div className="flex items-center justify-between mb-2">
                <span className="text-lg opacity-80 group-hover:scale-110 transition-transform">{icon}</span>
                {tooltip && (
                    <div className="relative group/tooltip">
                        <span className="text-[10px] cursor-help text-gray-600 hover:text-gray-400 transition-colors">ⓘ</span>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-[10px] text-gray-300 rounded-lg border border-white/10 opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity z-50 shadow-2xl">
                            {tooltip}
                        </div>
                    </div>
                )}
            </div>
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">{label}</span>
            <span className={`text-lg font-black italic transition-colors ${isNoEdge ? "text-red-400 block leading-tight text-xs" : "text-white"}`}>
                {value}
            </span>
        </div>
    );
}

function MetricRow({ label, value, tooltip, highlight = false, locked = false }: { label: string; value: string; tooltip?: string; highlight?: boolean; locked?: boolean }) {
    return (
        <div className="flex justify-between items-center py-3 group/row transition-all"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: locked ? "#4b5563" : "#9ca3af" }}>{label}</span>
                {tooltip && !locked && (
                    <div className="relative group/tip">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-600 cursor-help hover:text-indigo-400 transition-colors">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4" />
                            <path d="M12 8h.01" />
                        </svg>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 border border-white/10 rounded-lg text-[10px] text-gray-300 opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-opacity z-50 shadow-2xl">
                            {tooltip}
                        </div>
                    </div>
                )}
            </div>
            {locked ? (
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-gray-700 blur-[2px] select-none">$88.88</span>
                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-600 uppercase tracking-widest">Locked</span>
                </div>
            ) : (
                <span className={`text-sm font-semibold tabular-nums ${highlight ? "text-indigo-300" : "text-white"}`}>
                    {value}
                </span>
            )}
        </div>
    );
}

function LockedSection({ title, desc, children, isPro = false, onUnlockClick }: { title: string; desc: string; children: React.ReactNode; isPro?: boolean; onUnlockClick?: () => void }) {
    const t = useTranslations("analyzer.report.pro");
    const tFunnel = useTranslations("analyzer.funnel");
    if (isPro) return <div className="animate-fade-in">{children}</div>;

    return (
        <div className="relative group">
            <div className="blur-sm pointer-events-none select-none opacity-60 transition-all duration-700">
                {children}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-black/5 rounded-xl backdrop-blur-[1px] z-20">
                <div className="flex flex-col items-center gap-3 text-center max-w-[280px]">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl shadow-inner mb-2 flex-shrink-0">💎</div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] block">{t("label")}</span>
                        <h4 className="text-base font-black text-white uppercase tracking-tight leading-tight">{title}</h4>
                        <p className="text-[11px] text-gray-400 font-medium leading-relaxed">{desc}</p>
                    </div>
                    
                    {/* CTA 2: Over Monte Carlo blur */}
                    <div className="mt-8">
                        <PrimaryCTA onClick={onUnlockClick || (() => {})} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function FullReport({ metrics, trades, email, analysisId, onSimulate, onAddToComparison, isInComparison, isPro }: Props) {
    const t = useTranslations("analyzer.report");
    const tSummary = useTranslations("analyzer.report.summaryBlock");
    const tDiagnosis = useTranslations("analyzer.report.diagnosis");
    const tFunnel = useTranslations("analyzer.funnel");
    const locale = useLocale();
    const [copying, setCopying] = React.useState(false);
    const [linkCopied, setLinkCopied] = React.useState(false);
    const [showPaywall, setShowPaywall] = React.useState(false);
    
    const handleUnlockClick = () => {
        console.log("PRO_UNLOCK_CLICK");
        setShowPaywall(true);
    };
    
    const copyPublicLink = () => {
        if (!analysisId) return;
        console.log("SHARE_COPY_LINK");
        const url = `${window.location.origin}/${locale}/report/${analysisId}`;
        navigator.clipboard.writeText(url);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 3500);
    };

    const shareWhatsApp = () => {
        if (!analysisId) return;
        console.log("SHARE_WHATSAPP");
        const url = `${window.location.origin}/${locale}/report/${analysisId}`;
        const text = `Estoy analizando mi estrategia. No sé si tengo ventaja real… ¿y vos? ${url}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
    };

    const shareTwitter = () => {
        if (!analysisId) return;
        console.log("SHARE_TWITTER");
        const url = `${window.location.origin}/${locale}/report/${analysisId}`;
        const text = "El mercado no perdona estrategias sin ventaja estadística. Estoy verificando la mía en NodoQuant.";
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(twitterUrl, '_blank');
    };
    
    const monteCarlo = metrics.monteCarlo;
    const verdictKey = metrics.advanced?.verdict || "unstableEdge";

    const riskLevelColor = metrics.riskOfRuin < 1 ? "text-emerald-400" : metrics.riskOfRuin < 10 ? "text-yellow-500" : "text-red-500";
    const riskLevelLabel = metrics.riskOfRuin < 1 ? tSummary("riskLow") : metrics.riskOfRuin < 10 ? tSummary("riskModerate") : tSummary("riskHigh");

    const copyStrategySummary = () => {
        setCopying(true);
        const score = (metrics.advanced?.edgeConfidence ?? 0).toFixed(0);
        const diagnosis = tDiagnosis(verdictKey);
        const summaryText = `
NodoQuant Strategy Analysis

Strategy Score: ${score} / 100
Diagnosis: ${diagnosis}
Expectancy: $${(metrics.expectancy || 0).toFixed(2)}
Profit Factor: ${(metrics.profitFactor || 0).toFixed(2)}
Max Drawdown: ${(metrics.maxDrawdown || 0).toFixed(2)}%
Trades analyzed: ${metrics.totalTrades || 0}
        `.trim();

        navigator.clipboard.writeText(summaryText);
        setTimeout(() => setCopying(false), 2000);
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="space-y-2">
                <div className="section-label">{t("title")}</div>
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">{t("subtitle")}</h2>
                <p className="text-sm font-medium text-gray-500">
                    {t("sentTo")} <span className="text-indigo-400/80 font-bold">{email}</span>
                </p>
            </div>

            {/* PAIN BLOCK (RED WARNING) - Top Priority */}
            {!isPro && (
                <div className="bg-red-500/10 border-2 border-red-500/30 rounded-3xl p-8 relative overflow-hidden animate-pulse-subtle">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent"></div>
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-3xl shadow-inner">⚠️</div>
                            <h3 className="text-2xl font-black text-white italic tracking-tight uppercase leading-tight">
                                {tFunnel("painTitle")}
                                <br />
                                <span className="text-red-400">{tFunnel("painSubtitle")}</span>
                            </h3>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4 pt-4">
                            <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                                <span className="text-indigo-400 font-black mt-0.5">▶</span>
                                <p className="text-sm font-bold text-gray-300 leading-snug">{tFunnel("benefit1")}</p>
                            </div>
                            <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                                <span className="text-indigo-400 font-black mt-0.5">▶</span>
                                <p className="text-sm font-bold text-gray-300 leading-snug">{tFunnel("benefit2")}</p>
                            </div>
                        </div>

                        {/* CTA 1: After Red Warning Block */}
                        <PrimaryCTA onClick={handleUnlockClick} />
                        
                        <p className="text-[10px] text-red-300/40 font-bold uppercase tracking-widest text-center pt-4 border-t border-red-500/10">
                            {tFunnel("credibilityFooter")}
                        </p>
                    </div>
                </div>
            )}

            {/* 1. Strategy Diagnosis & Key Signals */}
            <StrategyDiagnosis metrics={metrics} isPro={isPro} />

            {/* 3. Risk Overview (Blurred for Free Users) */}
            <div className="relative group">
                <div className={!isPro ? "blur-sm pointer-events-none opacity-60" : ""}>
                    <div className="card rounded-3xl p-8 border border-white/5 bg-white/[0.01] space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em]">{t("riskOverview.title")}</h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest block">{t("riskOverview.maxDrawdown")}</span>
                                <span className="text-2xl font-black text-white italic">{(metrics.maxDrawdown || 0).toFixed(1)}%</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest block">{t("riskOverview.sharpe")}</span>
                                <span className="text-2xl font-black text-white italic">{(metrics.riskAnalysis?.sharpeRatio || 0).toFixed(2)}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest block">{t("riskOverview.riskOfRuin")}</span>
                                <span className="text-2xl font-black text-white italic">{(metrics.riskOfRuin || 0).toFixed(1)}%</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest block">{t("riskOverview.skewness")}</span>
                                <span className="text-2xl font-black text-white italic">{(metrics.riskAnalysis?.skewness || 0).toFixed(2)}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest block">{t("riskOverview.recoveryFactor")}</span>
                                <span className="text-2xl font-black text-white italic">{(metrics.riskAnalysis?.recoveryFactor || 0).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Visualizations (Blurred for Free Users) */}
            <div className="relative group">
                <div className={!isPro ? "blur-sm pointer-events-none opacity-60" : "animate-fade-in"}>
                    <div className="card rounded-3xl p-8 space-y-8 border border-white/5 bg-white/[0.01]">
                        <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em]">
                            {t("visualizations.title")}
                        </p>
                        {metrics.equityCurve && <EquityChart data={metrics.equityCurve} />}
                        {metrics.drawdownCurve && <DrawdownChart data={metrics.drawdownCurve} />}
                        {metrics.tradeHistogram && (
                            <TradeHistogram
                                histogram={metrics.tradeHistogram}
                                minProfit={metrics.minProfit || 0}
                                maxProfit={metrics.maxProfit || 0}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* 5. Edge Stability (Evolution + Health) (Blurred for Free Users) */}
            <div className="relative group">
                <div className={!isPro ? "blur-sm pointer-events-none opacity-60" : "animate-fade-in"}>
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-px flex-1 bg-white/5"></div>
                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">{t("stability.title")}</h4>
                            <div className="h-px flex-1 bg-white/5"></div>
                        </div>
                        
                        <StrategyEvolution evolution={metrics.evolution || {}} />

                        <div className="card rounded-3xl p-8 border border-white/5 bg-white/[0.01]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">{t("health.title")}</h4>
                                    <div className="flex items-center gap-3">
                                        {Number(metrics.stabilityScore) >= 70 ? (
                                            <>
                                                <span className="text-xl">✅</span>
                                                <span className="text-sm font-black text-green-400 uppercase tracking-snug">{t("health.stable")}</span>
                                            </>
                                        ) : Number(metrics.stabilityScore) >= 40 ? (
                                            <>
                                                <span className="text-xl">⚠️</span>
                                                <span className="text-sm font-black text-yellow-500 uppercase tracking-snug">{t("health.moderate")}</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-xl">❌</span>
                                                <span className="text-sm font-black text-red-500 uppercase tracking-snug">{t("health.drift")}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black text-gray-600 block mb-1 uppercase tracking-widest">{t("health.score")}</span>
                                    <span className="text-3xl font-black text-white italic tracking-tighter">{Math.round(metrics.stabilityScore || 0)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 6. Monte Carlo (Fully Locked) */}
            <div className="card rounded-xl p-0 overflow-hidden relative">
                <div className="p-5 border-b border-white/[0.05]">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">
                            {t("monteCarlo.title")}
                        </p>
                        {!isPro && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 uppercase tracking-widest">
                                PRO
                            </span>
                        )}
                    </div>
                </div>
                
                {/* Fear Copy & Partial View for free users */}
                {!isPro && (
                    <div className="p-5 pb-0">
                        <p className="text-xs font-bold text-red-400 mb-4 text-center uppercase tracking-widest italic drop-shadow-[0_0_10px_rgba(248,113,113,0.3)]">
                            {tFunnel("fearMessage")}
                        </p>
                        <div className="bg-white/[0.02] border border-red-500/10 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2 pointer-events-none">
                            <div className="text-center space-y-1">
                                <span className="text-[9px] uppercase text-gray-500 font-black tracking-widest">{tFunnel("ruinProbLabel")}</span>
                                <div className="text-red-500 font-black text-xl blur-[1px]">??? {tFunnel("mcPlaceholder")}</div>
                            </div>
                            <div className="text-center space-y-1">
                                <span className="text-[9px] uppercase text-gray-500 font-black tracking-widest">{tFunnel("expectedDdLabel")}</span>
                                <div className="text-red-500 font-black text-xl blur-[1px]">???%</div>
                            </div>
                            <div className="text-center space-y-1">
                                <span className="text-[9px] uppercase text-gray-500 font-black tracking-widest">{tFunnel("timeToBreakLabel")}</span>
                                <div className="text-red-500 font-black text-xl blur-[1px]">??? trades</div>
                            </div>
                        </div>
                    </div>
                )}

                <LockedSection title={t("monteCarlo.title")} desc={t("monteCarlo.desc")} isPro={isPro} onUnlockClick={handleUnlockClick}>
                    <div className="p-5 space-y-6">
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                            {monteCarlo && (
                                <MonteCarloChart
                                    simulations={monteCarlo.simulations || []}
                                    averageCaseReturn={monteCarlo.averageCase || 0}
                                />
                            )}
                        </div>
                        
                        {monteCarlo && (
                            <MonteCarloSummary
                                worstCase={monteCarlo.worstCase || 0}
                                averageCase={monteCarlo.averageCase || 0}
                                bestCase={monteCarlo.bestCase || 0}
                                riskOfRuin={monteCarlo.riskOfRuin || 0}
                            />
                        )}
                    </div>
                </LockedSection>
            </div>

            {/* CTA 3: Before Share Block */}
            {!isPro && (
                <div className="py-12 border-t border-white/5 space-y-8">
                    <div className="text-center">
                        <p className="text-2xl font-black text-white italic uppercase tracking-tighter leading-snug">
                            {tFunnel("closingLine")}
                        </p>
                    </div>
                    <PrimaryCTA onClick={handleUnlockClick} />
                </div>
            )}

            {/* ── Shareable Card (Absolute Bottom) ── */}
            <div className="card rounded-3xl p-8 border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center text-xs font-black shadow-lg">N</div>
                        <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">{t("share.title")}</span>
                    </div>
                </div>
                
                <div className="bg-black/40 rounded-2xl p-6 grid grid-cols-3 gap-6 border border-white/5 shadow-inner">
                    <div className="text-center space-y-1">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">{t("diagnosis.scoreTitle")}</span>
                        <span className="text-xl font-black text-indigo-400 italic">{(metrics.advanced?.edgeConfidence ?? 0).toFixed(0)}</span>
                    </div>
                    <div className="text-center space-y-1">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">{t("keySignals.profitFactor")}</span>
                        <span className="text-xl font-black text-white italic">{(metrics.profitFactor || 0).toFixed(2)}</span>
                    </div>
                    <div className="text-center space-y-1">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">{t("keySignals.sampleSize")}</span>
                        <span className="text-xl font-black text-white italic">{metrics.totalTrades || 0}</span>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    {analysisId && (
                        <div className="space-y-4">
                            <button 
                                onClick={copyPublicLink}
                                className={`w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl ${
                                    linkCopied
                                    ? "bg-emerald-500 text-white shadow-emerald-500/20"
                                    : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20"
                                }`}
                            >
                                {linkCopied ? t("share.linkCopied") : t("share.copyLink")}
                            </button>
                            
                            <div className="flex gap-4">
                                <button 
                                    onClick={shareWhatsApp} 
                                    className="flex-1 py-4 rounded-2xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/20 text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    {t("share.whatsapp")}
                                </button>
                                <button 
                                    onClick={shareTwitter} 
                                    className="flex-1 py-4 rounded-2xl bg-black border border-white/20 text-white hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    {t("share.twitter")}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Disclaimer */}
            <p className="text-[10px] text-center leading-relaxed font-bold opacity-20 select-none max-w-sm mx-auto uppercase tracking-widest" style={{ color: "#4b5563" }}>
                {t("disclaimer")}
            </p>

            {/* Simulated Paywall Modal */}
            {showPaywall && !isPro && (
                <UnlockPro onClose={() => setShowPaywall(false)} />
            )}
        </div>
    );
}
