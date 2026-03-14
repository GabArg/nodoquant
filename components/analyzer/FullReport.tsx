"use client";

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
    isPro?: boolean;
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

function LockedSection({ title, children, cta, isPro = false }: { title: string; children: React.ReactNode; cta: string; isPro?: boolean }) {
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
                        <h4 className="text-sm font-black text-white mb-1 uppercase tracking-tight">{t("lockedTitle")}</h4>
                        <p className="text-[10px] text-gray-400 font-medium leading-relaxed">{t("lockedDesc")}</p>
                    </div>
                    <a href="/pricing" className="mt-2 px-6 py-2.5 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest hover:scale-[1.05] transition-all shadow-xl shadow-white/5 text-center">
                        {t("upgradeCta")}
                    </a>
                </div>
            </div>
        </div>
    );
}

export default function FullReport({ metrics, trades, email, analysisId, onSimulate, isPro = false }: Props) {
    const t = useTranslations("analyzer.report");
    const { monteCarlo } = metrics;


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

            {/* Performance Metrics grid (Expectancy) */}
            <div className="card rounded-xl p-5 space-y-1">
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">
                    {t("performance.title")}
                </p>
                <MetricRow 
                    label={t("performance.expectancy")} 
                    value={`$${metrics.expectancy.toFixed(2)} ${t("performance.perTrade")}`} 
                    tooltip={t("performance.expectancyTip")}
                    highlight 
                />
                <MetricRow label={t("performance.trades")} value={String(metrics.totalTrades)} />
                <MetricRow label={t("performance.winRate")} value={`${metrics.winrate.toFixed(1)}%`} />
                <MetricRow label={t("performance.profitFactor")} value={metrics.profitFactor.toFixed(2)} />
            </div>

            {/* Strategy Evolution Samples */}
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

            {/* Risk metrics (Partially locked) */}
            <div className="card rounded-xl p-5 space-y-1 relative overflow-hidden">
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">
                    {t("risk.title")}
                </p>
                <MetricRow
                    label={t("risk.riskOfRuin")}
                    value={`${metrics.riskOfRuin.toFixed(1)}%`}
                    tooltip={t("risk.riskOfRuinTip")}
                />
                <MetricRow
                    label={t("risk.maxLosingStreak")}
                    value={`${metrics.longestLosingStreak} ${t("risk.trades")}`}
                />
                <MetricRow
                    label={t("risk.avgDrawdown")}
                    value={`${metrics.riskAnalysis.avgDrawdown.toFixed(1)}%`}
                    tooltip={t("risk.avgDrawdownTip")}
                />
                
                {/* Advanced locked risk metrics */}
                <MetricRow label={t("risk.recoveryFactor")} value={metrics.riskAnalysis.recoveryFactor.toFixed(2)} locked={!isPro} />
                <MetricRow label={t("risk.profitToDrawdown")} value={metrics.riskAnalysis.profitToDrawdown.toFixed(2)} locked={!isPro} />
                
                <MetricRow
                    label={t("risk.recommendedRisk")}
                    value={`${metrics.recommendedRiskPct.toFixed(1)}%`}
                    highlight
                />
            </div>

            {/* Monte Carlo (Fully Locked) */}
            <div className="card rounded-xl p-0 overflow-hidden">
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
                <LockedSection title={t("monteCarlo.title")} cta={t("pro.upgradeCta")} isPro={isPro}>
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

            {/* Charts */}
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

                    <button className="btn-primary w-full justify-center opacity-50 cursor-not-allowed" disabled
                        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#4b5563" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {t("actions.compare")}
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

            {/* Disclaimer */}
            <p className="text-xs text-center leading-relaxed" style={{ color: "#374151" }}>
                {t("disclaimer")}
            </p>
        </div>
    );
}
