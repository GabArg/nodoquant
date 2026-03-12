"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { FullMetrics } from "@/lib/analyzer/metrics";
import BasicResults from "@/components/analyzer/BasicResults";
import MonteCarloSummary from "@/components/analyzer/MonteCarloSummary";
import PropFirmSimulator from "@/components/analyzer/PropFirmSimulator";
import StrategyInsight from "@/components/analyzer/StrategyInsight";
import EquityChart from "@/components/analyzer/EquityChart";
import DrawdownChart from "@/components/analyzer/DrawdownChart";
import TradeHistogram from "@/components/analyzer/TradeHistogram";
import FullReport from "@/components/analyzer/FullReport";
import MonteCarloChart from "@/components/analyzer/MonteCarloChart";
import ReportAccessGuard from "@/components/report/ReportAccessGuard";
import UpgradeBanner from "@/components/report/UpgradeBanner";
import MiniBarChart from "@/components/report/MiniBarChart";
import type { Trade } from "@/lib/analyzer/parser";

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => `${i}h`);

export default function ReportPage() {
    const params = useParams();
    const reportId = params.reportId as string;
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPro, setIsPro] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch report data
                const res = await fetch(`/api/analyzer/report/${reportId}`);
                const data = await res.json();
                if (!data.ok) throw new Error(data.error || "Error al cargar el reporte");
                setReport(data.report);

                // Fetch user plan for access control
                const planRes = await fetch("/api/user/plan");
                const planData = await planRes.json();
                setIsPro(planData.isPro === true);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        if (reportId) fetchData();
    }, [reportId]);

    if (loading) {
        return (
            <div className="min-h-screen pt-32 text-center">
                <div className="inline-block animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
                <p className="text-gray-400">Generando informe completo...</p>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="min-h-screen pt-32 text-center px-4">
                <div className="max-w-md mx-auto card p-8 rounded-2xl border border-red-500/20 bg-red-500/5">
                    <h2 className="text-xl font-bold text-white mb-2">Error</h2>
                    <p className="text-gray-400 mb-6">{error || "No pudimos encontrar este análisis."}</p>
                    <a href="/analyzer" className="btn-primary">Volver al Analizador</a>
                </div>
            </div>
        );
    }

    const metrics = report.metrics_json as FullMetrics;

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white pt-24 pb-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Scroll Navigation */}
                <div className="sticky top-20 z-40 py-4 mb-10 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/5 scrollbar-hide overflow-x-auto">
                    <div className="flex gap-6 min-w-max">
                        {[
                            { id: "overview", label: "Resumen" },
                            { id: "metrics", label: "Métricas" },
                            { id: "equity", label: "Curva & Drawdown" },
                            { id: "distribution", label: "Distribución" },
                            { id: "time", label: "Análisis Temporal" },
                            { id: "risk", label: "Riesgo" },
                            { id: "stability", label: "Estabilidad" },
                            { id: "insights", label: "Insights" },
                            { id: "montecarlo", label: "Monte Carlo" }
                        ].map((s) => (
                            <button
                                key={s.id}
                                onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "center" })}
                                className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-indigo-400 transition-colors"
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left content */}
                    <div className="lg:col-span-8 space-y-16">
                        
                        <section id="overview" className="scroll-mt-32">
                            <BasicResults 
                                metrics={metrics} 
                                format={report.file_name?.includes(".htm") ? "mt5" : "csv-generic"} 
                                fileName={report.file_name} 
                            />
                        </section>

                        <section id="metrics" className="scroll-mt-32">
                            <h2 className="text-xl font-bold text-white mb-6">Métricas de Performance</h2>
                            <FullReport 
                                metrics={metrics} 
                                trades={[]} 
                                email={report.user_email || ""} 
                                analysisId={report.id}
                            />
                        </section>

                        <section id="equity" className="scroll-mt-32 space-y-8">
                            <h2 className="text-xl font-bold text-white mb-6">Equidad y Drawdown</h2>
                            <div className="card p-6 space-y-10">
                                <div className="space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Curva de Equidad</p>
                                    <EquityChart data={metrics.equityCurve} />
                                </div>
                                <div className="pt-8 border-t border-white/5 space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Curva de Drawdown (%)</p>
                                    <DrawdownChart data={metrics.drawdownCurve} />
                                </div>
                            </div>
                        </section>

                        {!isPro && <UpgradeBanner />}

                        <section id="distribution" className="scroll-mt-32">
                            <h2 className="text-xl font-bold text-white mb-6">Distribución de Trades</h2>
                            <ReportAccessGuard isPro={isPro} featureName="Distribución">
                                <div className="card p-6">
                                    <TradeHistogram 
                                        histogram={metrics.tradeHistogram} 
                                        minProfit={metrics.minProfit} 
                                        maxProfit={metrics.maxProfit} 
                                    />
                                </div>
                            </ReportAccessGuard>
                        </section>

                        <section id="time" className="scroll-mt-32">
                            <h2 className="text-xl font-bold text-white mb-6">Análisis Temporal</h2>
                            <ReportAccessGuard isPro={isPro} featureName="Análisis Temporal">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="card p-6">
                                        <MiniBarChart 
                                            title="Performance por día" 
                                            data={metrics.timeAnalysis.byWeekday} 
                                            labels={DAY_LABELS} 
                                        />
                                    </div>
                                    <div className="card p-6">
                                        <MiniBarChart 
                                            title="Performance por hora (UTC)" 
                                            data={metrics.timeAnalysis.byHour} 
                                            labels={HOUR_LABELS} 
                                        />
                                    </div>
                                    <div className="card p-6 md:col-span-2">
                                        <div className="flex justify-between items-center mb-4">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Sesiones de Trading</p>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            {[
                                                { label: "Asiática", val: metrics.timeAnalysis.bySession.asian },
                                                { label: "Londres", val: metrics.timeAnalysis.bySession.london },
                                                { label: "Nueva York", val: metrics.timeAnalysis.bySession.ny }
                                            ].map(s => (
                                                <div key={s.label} className="p-4 rounded-xl bg-white/5">
                                                    <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                                                    <p className={`text-sm font-bold ${s.val >= 0 ? "text-green-400" : "text-red-400"}`}>
                                                        {s.val >= 0 ? "+" : ""}{s.val.toFixed(1)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </ReportAccessGuard>
                        </section>

                        <section id="risk" className="scroll-mt-32">
                            <h2 className="text-xl font-bold text-white mb-6">Análisis de Riesgo</h2>
                            <ReportAccessGuard isPro={isPro} featureName="Análisis de Riesgo">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {[
                                        { label: "Max DD", val: `${metrics.riskAnalysis.maxDrawdown}%` },
                                        { label: "Avg DD", val: `${metrics.riskAnalysis.avgDrawdown}%` },
                                        { label: "Rec. Factor", val: metrics.riskAnalysis.recoveryFactor },
                                        { label: "P/DD Ratio", val: metrics.riskAnalysis.profitToDrawdown }
                                    ].map(m => (
                                        <div key={m.label} className="card p-4 text-center">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{m.label}</p>
                                            <p className="text-lg font-bold text-indigo-300">{m.val}</p>
                                        </div>
                                    ))}
                                </div>
                            </ReportAccessGuard>
                        </section>

                        <section id="stability" className="scroll-mt-32">
                            <h2 className="text-xl font-bold text-white mb-6">Estabilidad de la Estrategia</h2>
                            <ReportAccessGuard isPro={isPro} featureName="Estabilidad">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="card p-6">
                                            <MiniBarChart 
                                                title="Profit Factor por Segmento" 
                                                data={metrics.stabilityAnalysis.segments.map(s => s.profitFactor)} 
                                                labels={metrics.stabilityAnalysis.segments.map(s => s.segment)} 
                                            />
                                        </div>
                                        <div className="card p-6">
                                            <MiniBarChart 
                                                title="Win Rate (%) por Segmento" 
                                                data={metrics.stabilityAnalysis.segments.map(s => s.winrate)} 
                                                labels={metrics.stabilityAnalysis.segments.map(s => s.segment)} 
                                                color="#fbbf24"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="card p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Puntaje de Estabilidad</p>
                                                <div className="relative group/tip">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-600 cursor-help hover:text-indigo-400 transition-colors">
                                                        <circle cx="12" cy="12" r="10" />
                                                        <path d="M12 16v-4" />
                                                        <path d="M12 8h.01" />
                                                    </svg>
                                                    <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-gray-900 border border-white/10 rounded-lg text-[10px] text-gray-300 opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-opacity z-50 shadow-2xl">
                                                        Mide qué tan consistente se mantiene el rendimiento de la estrategia a lo largo de la muestra dividida en segmentos.
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-end gap-3">
                                                <span className="text-5xl font-black text-indigo-400">{metrics.stabilityScore}</span>
                                                <span className="text-sm font-bold text-gray-500 mb-2">/ 100</span>
                                            </div>
                                            <p className="text-xs text-gray-400 max-w-xs">
                                                Mide qué tan consistente se mantiene el rendimiento de la estrategia a lo largo del tiempo.
                                            </p>
                                        </div>
                                        
                                        <div className="text-center md:text-right space-y-2">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Interpretación</p>
                                            <div className={`text-xl font-bold ${
                                                metrics.stabilityAnalysis.interpretation === "Mejorando" ? "text-green-400" :
                                                metrics.stabilityAnalysis.interpretation === "Degradando" ? "text-red-400" :
                                                "text-indigo-300"
                                            }`}>
                                                Estrategia {metrics.stabilityAnalysis.interpretation}
                                            </div>
                                            <p className="text-xs text-gray-500 italic">
                                                Basado en la tendencia del Net P&L entre la primera y segunda mitad de la muestra.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </ReportAccessGuard>
                        </section>

                        <section id="insights" className="scroll-mt-32 space-y-6">
                            <h2 className="text-xl font-bold text-white mb-6">Estrategia Insights</h2>
                            <StrategyInsight 
                                profitFactor={metrics.profitFactor}
                                winrate={metrics.winrate}
                                maxDrawdown={metrics.maxDrawdown}
                                totalTrades={metrics.totalTrades}
                            />
                        </section>

                        <section id="montecarlo" className="scroll-mt-32">
                            <h2 className="text-xl font-bold text-white mb-6">Simulación Monte Carlo</h2>
                            <ReportAccessGuard isPro={isPro} featureName="Monte Carlo">
                                <div className="card p-6 space-y-8">
                                    <MonteCarloChart 
                                        simulations={metrics.monteCarlo.simulations} 
                                        averageCaseReturn={metrics.monteCarlo.averageCase}
                                    />
                                    <MonteCarloSummary 
                                        worstCase={metrics.monteCarlo.worstCase} 
                                        averageCase={metrics.monteCarlo.averageCase} 
                                        bestCase={metrics.monteCarlo.bestCase} 
                                        riskOfRuin={metrics.monteCarlo.riskOfRuin} 
                                    />
                                </div>
                            </ReportAccessGuard>
                        </section>
                        
                    </div>

                    {/* Right sidebar / Actions */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Summary side card or quick actions */}
                        <div className="sticky top-40 space-y-6">
                             {/* CTA to automate or something else */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
