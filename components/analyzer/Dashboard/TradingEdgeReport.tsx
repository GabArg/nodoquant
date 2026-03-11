"use client";

import { useEffect, useState } from "react";
import StrategyScoreCard from "./StrategyScoreCard";
import MetricsGrid from "./MetricsGrid";
import EquityCurveChart from "./EquityCurveChart";
import PerformanceBreakdown from "./PerformanceBreakdown";
import ReportSuccessState from "./ReportSuccessState";
import ShareReportButton from "./ShareReportButton";

interface TradingEdgeReportProps {
    reportId: string;
}

export default function TradingEdgeReport({ reportId }: TradingEdgeReportProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchReport() {
            try {
                const res = await fetch(`/api/analyzer/report/${reportId}`);
                if (!res.ok) {
                    throw new Error("No se pudo cargar el reporte. Verifica el enlace o ID.");
                }
                const json = await res.json();
                setData(json.data);
            } catch (err: any) {
                setError(err.message || "Error cargando el dashboard.");
            } finally {
                setLoading(false);
            }
        }

        if (reportId) {
            fetchReport();
        }
    }, [reportId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-6 bg-red-900/20 border border-red-500/50 rounded-xl text-red-400 text-center">
                {error || "Reporte no encontrado."}
            </div>
        );
    }

    const { metrics, equityCurve, breakdowns } = data;

    return (
        <div className="space-y-8 animate-fade-in w-full max-w-6xl mx-auto">
            {/* Header / Share CTA */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                <h2 className="text-2xl font-bold text-white tracking-tight">Strategy Analytics</h2>
                <ShareReportButton reportId={reportId} />
            </div>

            {/* Validations */}
            {metrics.total_trades < 30 && (
                <div className="p-4 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
                    <strong>Aviso de Fiabilidad Estadística:</strong> Este análisis se basa en {metrics.total_trades} trades. Estadísticamente, se requieren al menos 30 trades para que las métricas (como el Expectancy) dejen de ser ruido aleatorio puro.
                </div>
            )}
            {metrics.total_trades >= 30 && metrics.total_trades < 100 && (
                <div className="p-4 rounded-xl text-sm" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "#fcd34d" }}>
                    <strong>Aviso de Confianza Limitada:</strong> Analizando {metrics.total_trades} trades. Aunque supera el mínimo matemático, la industria cuantitativa recomienda una muestra mayor a 100 operaciones para confirmar una ventaja real.
                </div>
            )}

            <ReportSuccessState score={metrics.strategy_score} />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                    <StrategyScoreCard score={metrics.strategy_score} />
                </div>
                <div className="lg:col-span-3">
                    <MetricsGrid metrics={metrics} />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <EquityCurveChart data={equityCurve || []} />
            </div>

            <div className="grid grid-cols-1 gap-6">
                <PerformanceBreakdown
                    symbolData={breakdowns?.symbol}
                    sessionData={breakdowns?.session}
                    weekdayData={breakdowns?.weekday}
                />
            </div>
        </div>
    );
}
