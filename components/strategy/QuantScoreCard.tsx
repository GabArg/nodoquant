"use client";

import { quantScoreLabel, quantScoreColor, type QuantScoreResult } from "@/lib/quantScore";

interface Props {
    result: QuantScoreResult;
}

export default function QuantScoreCard({ result }: Props) {
    const { score, baseScore, penalties } = result;
    const color = quantScoreColor(score);
    const label = quantScoreLabel(score);
    const hasPenalty = penalties.lowSample || penalties.extremeDrawdown;

    return (
        <div className="card rounded-2xl border border-white/5 bg-[#111118] p-6 mb-8 mt-4">
            <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-5 text-center">
                Quantitative Strategy Score
            </h2>
            <div className="flex flex-col items-center">
                <div
                    className="w-24 h-24 rounded-full flex items-center justify-center mb-3"
                    title="Composite score: Edge Score (40%) + Robustness (30%) + Health (20%) + Evolution (10%)"
                    style={{
                        background: `${color}10`,
                        border: `3px solid ${color}50`,
                        cursor: "help",
                    }}
                >
                    <span className="text-3xl font-extrabold tabular-nums" style={{ color }}>
                        {score.toFixed(1)}
                    </span>
                </div>
                <p className="text-sm font-semibold uppercase tracking-wider mb-1" style={{ color }}>
                    {label}
                </p>
                <p className="text-xs text-gray-600 text-center max-w-xs mt-2">
                    Quant Score evaluates the robustness of a trading strategy based on win rate, drawdown, profit factor and consistency across simulations.
                </p>
                {hasPenalty && (
                    <div className="mt-3 flex flex-col gap-1 items-center">
                        {penalties.lowSample && (
                            <span className="text-xs" style={{ color: "#fbbf24" }}>
                                ⚠ Low sample size (&lt;100 trades)
                            </span>
                        )}
                        {penalties.extremeDrawdown && (
                            <span className="text-xs" style={{ color: "#fbbf24" }}>
                                ⚠ High drawdown (&gt;60%)
                            </span>
                        )}
                        {baseScore !== score && (
                            <span className="text-xs text-gray-600 mt-0.5">
                                Base score: {baseScore.toFixed(1)} → Adjusted: {score.toFixed(1)}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
