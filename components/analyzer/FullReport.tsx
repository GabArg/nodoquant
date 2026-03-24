"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import type { FullMetrics } from "@/lib/analyzer/metrics";
import EquityChart from "./EquityChart";
import DrawdownChart from "./DrawdownChart";
import TradeHistogram from "./TradeHistogram";
import type { Trade } from "@/lib/analyzer/parser";
import SaveStrategyAction from "./SaveStrategyAction";
import MonteCarloChart from "./MonteCarloChart";
import MonteCarloSummary from "./MonteCarloSummary";
import StrategyEvolution from "./Dashboard/StrategyEvolution";

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

function StrategyDiagnosis({ metrics }: { metrics: FullMetrics }) {
    const t = useTranslations("analyzer.report.diagnosis");
    const tSignals = useTranslations("analyzer.report.keySignals");
    const verdictKey = metrics.advanced?.verdict || "unstableEdge";

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
            color: "text-indigo-400",
            bg: "bg-indigo-400/10",
            border: "border-indigo-400/20",
            icon: "📈"
        },
        unstableEdge: {
            desc: "unstableDesc",
            color: "text-yellow-500",
            bg: "bg-yellow-500/10",
            border: "border-yellow-500/20",
            icon: "⚠️"
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
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 block mb-1">
                            {t("scoreTitle")}
                        </span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-6xl font-black text-white italic tracking-tighter">{score.toFixed(0)}</span>
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
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <SignalCard 
                    label={tSignals("expectancy")} 
                    value={`$${metrics.expectancy.toFixed(1)}`} 
                    icon="💰" 
                    tooltip={tSignals("tooltips.expectancy")}
                />
                <SignalCard 
                    label={tSignals("profitFactor")} 
                    value={metrics.profitFactor.toFixed(2)} 
                    icon="⚖️" 
                    tooltip={tSignals("tooltips.profitFactor")}
                />
                <SignalCard 
                    label={tSignals("winRate")} 
                    value={`${metrics.winrate.toFixed(1)}%`} 
                    icon="🎯" 
                    tooltip={tSignals("tooltips.winRate")}
                />
                <SignalCard 
                    label={tSignals("maxDrawdown")} 
                    value={`${metrics.maxDrawdown.toFixed(1)}%`} 
                    icon="📉" 
                    tooltip={tSignals("tooltips.maxDrawdown")}
                />
                <SignalCard 
                    label={tSignals("sampleSize")} 
                    value={String(metrics.totalTrades)} 
                    icon="📄" 
                    tooltip={tSignals("tooltips.sampleSize")}
                />
            </div>
        </div>
    );
}

function SignalCard({ label, value, icon, tooltip }: { label: string; value: string; icon: string; tooltip?: string }) {
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
            <span className="text-lg font-black text-white italic">{value}</span>
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

function LockedSection({ title, desc, cta, children, isPro = false }: { title: string; desc: string; cta: string; children: React.ReactNode; isPro?: boolean }) {
    const t = useTranslations("analyzer.report.pro");
    if (isPro) return <div className="animate-fade-in">{children}</div>;

    return (
        <div className="relative group">
            <div className="blur-md pointer-events-none select-none opacity-40 transition-all duration-700 group-hover:opacity-60">
                {children}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-black/20 rounded-xl border border-white/5 backdrop-blur-[2px]">
                <div className="flex flex-col items-center gap-3 text-center max-w-[240px]">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xl shadow-inner">💎</div>
                    <div>
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1 block">{t("label")}</span>
                        <h4 className="text-sm font-black text-white mb-2 uppercase tracking-tight">{title}</h4>
                        <p className="text-[10px] text-gray-400 font-medium leading-relaxed">{desc}</p>
                    </div>
                    <div className="flex flex-col items-center gap-2 mt-2">
                        <a href="/pricing" className="px-6 py-2.5 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest hover:scale-[1.05] transition-all shadow-xl shadow-white/5 text-center">
                            {cta}
                        </a>
                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em]">{t("upgradeSubtitle")}</span>
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
    const [copying, setCopying] = React.useState(false);
    
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
Expectancy: $${metrics.expectancy.toFixed(2)}
Profit Factor: ${metrics.profitFactor.toFixed(2)}
Max Drawdown: ${metrics.maxDrawdown.toFixed(2)}%
Trades analyzed: ${metrics.totalTrades}
        `.trim();

        navigator.clipboard.writeText(summaryText);
        setTimeout(() => setCopying(false), 2000);
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <div className="section-label">{t("title")}</div>
                <h2 className="text-xl font-bold text-white mb-1">{t("subtitle")}</h2>
                <p className="text-sm" style={{ color: "#6b7280" }}>
                    {t("sentTo")} <span className="text-indigo-400">{email}</span>
                </p>
            </div>

            {/* 1. Strategy Diagnosis & Key Signals */}
            <StrategyDiagnosis metrics={metrics} />

            {/* 3. Risk Overview */}
            <div className="card rounded-2xl p-6 border border-white/5 bg-white/[0.01] space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{t("riskOverview.title")}</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    <div className="space-y-1">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">{t("riskOverview.maxDrawdown")}</span>
                        <span className="text-xl font-black text-white italic">{metrics.maxDrawdown.toFixed(1)}%</span>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">{t("riskOverview.sharpe")}</span>
                        <span className="text-xl font-black text-white italic">{metrics.riskAnalysis.sharpeRatio.toFixed(2)}</span>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">{t("riskOverview.riskOfRuin")}</span>
                        <span className="text-xl font-black text-white italic">{metrics.riskOfRuin.toFixed(1)}%</span>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">{t("riskOverview.skewness")}</span>
                        <span className="text-xl font-black text-white italic">{metrics.riskAnalysis.skewness.toFixed(2)}</span>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">{t("riskOverview.recoveryFactor")}</span>
                        <span className="text-xl font-black text-white italic">{metrics.riskAnalysis.recoveryFactor.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* 4. Visualizations */}
            <div className="card rounded-xl p-5 space-y-6">
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">
                    {t("visualizations")}
                </p>
                <EquityChart data={metrics.equityCurve} />
                <DrawdownChart data={metrics.drawdownCurve} />
                <TradeHistogram
                    histogram={metrics.tradeHistogram}
                    minProfit={metrics.minProfit}
                    maxProfit={metrics.maxProfit}
                />
            </div>

            {/* 5. Edge Stability (Evolution + Health) */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/5"></div>
                    <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">{t("stability.title")}</h4>
                    <div className="h-px flex-1 bg-white/5"></div>
                </div>
                <p className="text-[10px] text-gray-500 text-center uppercase tracking-tight font-medium">{t("stability.subtitle")}</p>
                
                <StrategyEvolution evolution={metrics.evolution} />

                {/* Edge Health Status */}
                <div className="card rounded-2xl p-6 border border-white/5 bg-white/[0.01]">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{t("health.title")}</h4>
                            <div className="flex items-center gap-3">
                                {metrics.stabilityScore >= 70 ? (
                                    <>
                                        <span className="text-xl">✅</span>
                                        <span className="text-sm font-black text-green-400 uppercase tracking-tight">{t("health.stable")}</span>
                                    </>
                                ) : metrics.stabilityScore >= 40 ? (
                                    <>
                                        <span className="text-xl">⚠️</span>
                                        <span className="text-sm font-black text-yellow-500 uppercase tracking-tight">{t("health.moderate")}</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-xl">❌</span>
                                        <span className="text-sm font-black text-red-500 uppercase tracking-tight">{t("health.drift")}</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-bold text-gray-600 block mb-1">{t("health.score")}</span>
                            <span className="text-2xl font-black text-white italic">{Math.round(metrics.stabilityScore)}%</span>
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
                <LockedSection title={t("monteCarlo.title")} desc={t("monteCarlo.desc")} cta={t("pro.upgradeCta")} isPro={isPro}>
                    <div className="p-5 space-y-6">
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                            <MonteCarloChart
                                simulations={monteCarlo.simulations}
                                averageCaseReturn={monteCarlo.averageCase}
                            />
                        </div>
                        
                        <MonteCarloSummary
                            worstCase={monteCarlo.worstCase}
                            averageCase={monteCarlo.averageCase}
                            bestCase={monteCarlo.bestCase}
                            riskOfRuin={monteCarlo.riskOfRuin}
                        />
                    </div>
                </LockedSection>
            </div>

            {/* 7. Prop Firm Simulator (PRO Locked) */}
            <div className="card rounded-xl p-0 overflow-hidden relative">
                <div className="p-5 border-b border-white/[0.05]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">
                                {t("propFirm.title")}
                            </p>
                            <p className="text-[10px] text-gray-500 font-medium mt-1">{t("propFirm.subtitle")}</p>
                        </div>
                        {!isPro && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 uppercase tracking-widest">
                                PRO
                            </span>
                        )}
                    </div>
                </div>
                <LockedSection title={t("propFirm.title")} desc={t("propFirm.subtitle")} cta={t("pro.upgradeCta")} isPro={isPro}>
                    <div className="p-8 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto text-3xl">🏛️</div>
                        <h4 className="text-lg font-black text-white italic uppercase tracking-tight">{t("propFirm.title")}</h4>
                        <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                            Simulate your strategy under strict prop firm rules: maximum drawdown, daily limits, and profit targets.
                        </p>
                        <button onClick={onSimulate} className="btn-primary mx-auto animate-pulse">
                            Run Challenge Simulation
                        </button>
                    </div>
                </LockedSection>
            </div>

            {/* ── Report Actions ── */}
            <div className="pt-8 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                <div className="section-label mb-4">{t("actions.title")}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SaveStrategyAction analysisId={analysisId ?? null} />
                    
                    <button className="btn-primary w-full justify-center opacity-50 cursor-not-allowed" disabled
                        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#4b5563" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 12V4a2 2 0 0 1 2-2h10l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4" />
                            <polyline points="14 2 14 6 20 6" />
                            <path d="M3 15h12" />
                            <path d="M12 11l3 4-3 4" />
                        </svg>
                        {t("actions.downloadCert")}
                    </button>

                    <button onClick={onSimulate} className="btn-primary w-full justify-center"
                        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#9ca3af" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        </svg>
                        {t("actions.propFirmSim")}
                    </button>

                    <button 
                        onClick={onAddToComparison}
                        disabled={isInComparison || !onAddToComparison}
                        className={`btn-primary w-full justify-center transition-all ${
                            isInComparison 
                            ? "opacity-50 cursor-not-allowed bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                            : "bg-white/[0.02] border-white/[0.06] text-[#9ca3af] hover:bg-white/[0.05]"
                        }`}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                        </svg>
                        {isInComparison ? "Agregado a Comparativa" : t("actions.compare")}
                    </button>

                    <button className="btn-primary w-full justify-center"
                        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#9ca3af" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                        {t("actions.publish")}
                    </button>
                </div>
            </div>

            {/* ── Unlock PRO Features ── */}
            <div className="card rounded-2xl p-8 border border-indigo-500/20 bg-indigo-500/[0.02] flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center text-3xl shadow-lg border border-indigo-500/20 animate-pulse">💎</div>
                <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">{t("proBenefits.title")}</h3>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 pt-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                            <span className="text-indigo-400">✓</span> {t("proBenefits.monteCarlo")}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                            <span className="text-indigo-400">✓</span> {t("proBenefits.propFirm")}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                            <span className="text-indigo-400">✓</span> {t("proBenefits.comparison")}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                            <span className="text-indigo-400">✓</span> {t("proBenefits.storage")}
                        </div>
                    </div>
                </div>
                {!isPro && (
                    <a href="/pricing" className="px-10 py-4 rounded-full bg-white text-black text-xs font-black uppercase tracking-[0.2em] hover:scale-[1.05] transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                        {t("pro.upgradeCta")}
                    </a>
                )}
            </div>

            {/* ── Shareable Card ── */}
            <div className="card rounded-2xl p-6 border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-indigo-500 flex items-center justify-center text-[10px] font-black">N</div>
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{t("share.title")}</span>
                    </div>
                    <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Share analysis</span>
                </div>
                
                <div className="bg-black/40 rounded-xl p-4 grid grid-cols-3 gap-4 border border-white/5">
                    <div className="text-center">
                        <span className="text-[8px] font-black text-gray-500 uppercase block mb-1">{t("diagnosis.scoreTitle")}</span>
                        <span className="text-sm font-black text-indigo-400 italic">{(metrics.advanced?.edgeConfidence ?? 0).toFixed(0)}</span>
                    </div>
                    <div className="text-center">
                        <span className="text-[8px] font-black text-gray-500 uppercase block mb-1">{t("keySignals.profitFactor")}</span>
                        <span className="text-sm font-black text-white italic">{metrics.profitFactor.toFixed(2)}</span>
                    </div>
                    <div className="text-center">
                        <span className="text-[8px] font-black text-gray-500 uppercase block mb-1">{t("keySignals.sampleSize")}</span>
                        <span className="text-sm font-black text-white italic">{metrics.totalTrades}</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={copyStrategySummary}
                        className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                            copying 
                            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" 
                            : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                        }`}
                    >
                        {copying ? t("actions.copySuccess") : t("actions.copySummary")}
                    </button>
                    <button className="flex-1 py-3 rounded-xl bg-indigo-500 text-[10px] font-black text-white uppercase tracking-widest hover:bg-indigo-600 transition-shadow shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                        {t("sharing.shareX")}
                    </button>
                </div>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-center leading-relaxed" style={{ color: "#374151" }}>
                {t("disclaimer")}
            </p>
        </div>
    );
}
