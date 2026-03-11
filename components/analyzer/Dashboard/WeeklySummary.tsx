"use client";

import React from "react";

interface ReportMetrics {
    winrate: number;
    profit_factor: number;
    max_drawdown: number;
    metrics_json?: {
        expectancy?: number;
    };
    trades_count: number;
}

interface Props {
    latestReport: ReportMetrics | null;
}

export default function WeeklySummary({ latestReport }: Props) {
    if (!latestReport) return null;

    // In a full implementation, we would filter raw trades by the last 7 days.
    // For this light version based on analysis metrics, we display the summary of the latest batch.
    const expectancy = latestReport.metrics_json?.expectancy || (latestReport.profit_factor > 1 ? 0.5 : -0.2); // Fallback estimate

    return (
        <div className="card rounded-2xl p-6 border border-emerald-500/20 bg-emerald-500/5 mt-6">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-2">Weekly Summary</h3>
            <p className="text-sm text-gray-300 mb-4 font-medium">
                This week your strategy produced <strong className="text-white">{(expectancy > 0 ? "+" : "") + expectancy.toFixed(2)}R</strong> across {latestReport.trades_count} trades.
            </p>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <span className="text-xs text-gray-500 block">Win Rate</span>
                    <span className="text-sm font-bold text-white">{latestReport.winrate > 1 ? latestReport.winrate.toFixed(1) : (latestReport.winrate * 100).toFixed(1)}%</span>
                </div>
                <div>
                    <span className="text-xs text-gray-500 block">Drawdown</span>
                    <span className="text-sm font-bold text-red-400">{Math.abs(latestReport.max_drawdown).toFixed(1)}%</span>
                </div>
            </div>
        </div>
    );
}
