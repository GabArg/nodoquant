"use client";

import type { FullMetrics } from "@/lib/analyzer/metrics";
import EquityChart from "./EquityChart";
import DrawdownChart from "./DrawdownChart";
import TradeHistogram from "./TradeHistogram";
import type { Trade } from "@/lib/analyzer/parser";

interface Props {
    metrics: FullMetrics;
    trades: Trade[];
    email: string;
}

function MetricRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className="flex justify-between items-center py-3"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <span className="text-sm" style={{ color: "#9ca3af" }}>{label}</span>
            <span className={`text-sm font-semibold tabular-nums ${highlight ? "text-indigo-300" : "text-white"}`}>
                {value}
            </span>
        </div>
    );
}

export default function FullReport({ metrics, trades, email }: Props) {
    const { monteCarlo } = metrics;


    return (
        <div className="w-full max-w-2xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <div className="section-label">Informe completo</div>
                <h2 className="text-xl font-bold text-white mb-1">Análisis cuantitativo</h2>
                <p className="text-sm" style={{ color: "#6b7280" }}>
                    Informe enviado a <span className="text-indigo-400">{email}</span>
                </p>
            </div>

            {/* Monte Carlo */}
            <div className="card rounded-xl p-5 space-y-1">
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">
                    Monte Carlo (1.000 simulaciones)
                </p>
                <MetricRow label="Peor caso (5° percentil)" value={`$${monteCarlo.worstCase.toFixed(2)}`} />
                <MetricRow label="Caso promedio (mediana)" value={`$${monteCarlo.averageCase.toFixed(2)}`} highlight />
                <MetricRow label="Mejor caso (95° percentil)" value={`$${monteCarlo.bestCase.toFixed(2)}`} />
                <MetricRow
                    label="Max. Drawdown (5° percentil)"
                    value={`${monteCarlo.drawdownAt5Pct.toFixed(1)}%`}
                />
            </div>

            {/* Risk metrics */}
            <div className="card rounded-xl p-5 space-y-1">
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">
                    Métricas de riesgo
                </p>
                <MetricRow
                    label="Risk of Ruin"
                    value={`${metrics.riskOfRuin.toFixed(1)}%`}
                />
                <MetricRow
                    label="Racha perdedora máxima"
                    value={`${metrics.longestLosingStreak} trades`}
                />
                <MetricRow
                    label="Riesgo recomendado / operación"
                    value={`${metrics.recommendedRiskPct.toFixed(1)}%`}
                    highlight
                />
            </div>

            {/* Charts */}
            <div className="card rounded-xl p-5 space-y-6">
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">
                    Visualizaciones
                </p>
                <EquityChart data={metrics.equityCurve} />
                <DrawdownChart data={metrics.drawdownCurve} />
                <TradeHistogram
                    histogram={metrics.tradeHistogram}
                    minProfit={metrics.minProfit}
                    maxProfit={metrics.maxProfit}
                />
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-center leading-relaxed" style={{ color: "#374151" }}>
                Los resultados del análisis son históricos y no garantizan performance futura.
                El backtesting tiene limitaciones inherentes. Siempre operá con capital que podés permitirte perder.
            </p>
        </div>
    );
}
