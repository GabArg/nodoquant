"use client";

import React from "react";

interface ReportData {
    winrate: number;
    profit_factor: number;
    max_drawdown: number;
    quant_score?: number; // Calculated elsewhere, but if passed down
}

interface Props {
    latest: ReportData | null;
    previous: ReportData | null;
}

function StatRow({ label, latestVal, prevVal, isHigherBetter, format }: {
    label: string; latestVal: number; prevVal: number; isHigherBetter: boolean;
    format: (v: number) => string;
}) {
    const diff = latestVal - prevVal;
    const isBetter = isHigherBetter ? diff > 0 : diff < 0;
    const isWorse = isHigherBetter ? diff < 0 : diff > 0;
    const isSame = diff === 0;

    let color = "#9ca3af";
    let arrow = "—";

    if (isBetter) { color = "#34d399"; arrow = "↑"; }
    else if (isWorse) { color = "#f87171"; arrow = "↓"; }

    return (
        <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
            <span className="text-sm text-gray-400">{label}</span>
            <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 line-through">{format(prevVal)}</span>
                <span className="text-xs text-gray-500">→</span>
                <span className="text-sm font-bold text-white">{format(latestVal)}</span>
                <span className="text-sm font-black w-4 text-center" style={{ color }}>{arrow}</span>
            </div>
        </div>
    );
}

export default function StrategyEvolution({ latest, previous }: Props) {
    if (!latest || !previous) {
        return (
            <div className="card rounded-2xl p-6 border border-white/5 bg-[#111118]">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Evolución de Estrategia</h3>
                <p className="text-sm text-gray-500 mt-4">Analiza al menos dos reportes para ver tu evolución aquí.</p>
            </div>
        );
    }

    return (
        <div className="card rounded-2xl p-6 border border-indigo-500/20 bg-indigo-500/5">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">📈</span>
                <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Evolución de Estrategia</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4">
                Comparando tu último análisis con el anterior.
            </p>

            <div className="space-y-1">
                {latest.quant_score !== undefined && previous.quant_score !== undefined && (
                    <StatRow
                        label="Strategy Score"
                        latestVal={latest.quant_score}
                        prevVal={previous.quant_score}
                        isHigherBetter={true}
                        format={v => Math.round(v).toString()}
                    />
                )}
                <StatRow
                    label="Profit Factor"
                    latestVal={latest.profit_factor}
                    prevVal={previous.profit_factor}
                    isHigherBetter={true}
                    format={v => v.toFixed(2)}
                />
                <StatRow
                    label="Win Rate"
                    latestVal={latest.winrate > 1 ? latest.winrate : latest.winrate * 100}
                    prevVal={previous.winrate > 1 ? previous.winrate : previous.winrate * 100}
                    isHigherBetter={true}
                    format={v => `${v.toFixed(1)}%`}
                />
                <StatRow
                    label="Max Drawdown"
                    latestVal={Math.abs(latest.max_drawdown)}
                    prevVal={Math.abs(previous.max_drawdown)}
                    isHigherBetter={false}
                    format={v => `${v.toFixed(1)}%`}
                />
            </div>
        </div>
    );
}
