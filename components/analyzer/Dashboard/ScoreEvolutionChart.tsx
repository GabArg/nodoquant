"use client";

import React from "react";

interface Props {
    data: { date: string; score: number }[];
}

export default function ScoreEvolutionChart({ data }: Props) {
    if (!data || data.length < 2) {
        return (
            <div className="card rounded-2xl p-6 border border-white/5 bg-[#111118] h-64 flex flex-col items-center justify-center">
                <span className="text-3xl mb-3">📊</span>
                <p className="text-sm text-gray-500">Not enough data to display chart.</p>
            </div>
        );
    }

    // A simple SVG line chart (no heavy libraries needed for a basic line)
    const padding = 40;
    const width = 600;
    const height = 240;

    const minScore = Math.min(...data.map(d => d.score), 0);
    const maxScore = Math.max(...data.map(d => d.score), 100);

    const rangeY = maxScore - minScore || 1;
    const rangeX = data.length > 1 ? data.length - 1 : 1;

    const points = data.map((d, i) => {
        const x = padding + (i / rangeX) * (width - 2 * padding);
        const y = height - padding - ((d.score - minScore) / rangeY) * (height - 2 * padding);
        return `${x},${y}`;
    }).join(" ");

    return (
        <div className="card rounded-2xl p-6 border border-white/5 bg-[#111118]">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Evolución del Score</h3>
            <div className="w-full overflow-x-auto">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[500px] h-auto text-indigo-500 drop-shadow-lg">
                    {/* Grid lines */}
                    {[0, 0.5, 1].map(r => {
                        const y = height - padding - r * (height - 2 * padding);
                        return (
                            <g key={r}>
                                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                <text x={padding - 10} y={y + 4} fill="#6b7280" fontSize="10" textAnchor="end">
                                    {Math.round(minScore + r * rangeY)}
                                </text>
                            </g>
                        );
                    })}

                    {/* The Line */}
                    <polyline points={points} fill="none" stroke="url(#lineGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Area fill */}
                    <polygon points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`} fill="url(#areaGradient)" opacity="0.3" />

                    {/* Data Points */}
                    {data.map((d, i) => {
                        const x = padding + (i / rangeX) * (width - 2 * padding);
                        const y = height - padding - ((d.score - minScore) / rangeY) * (height - 2 * padding);
                        return (
                            <g key={i}>
                                <circle cx={x} cy={y} r="4" fill="#111118" stroke="#818cf8" strokeWidth="2" />
                                <text x={x} y={y - 12} fill="#9ca3af" fontSize="10" textAnchor="middle" fontWeight="bold">
                                    {Math.round(d.score)}
                                </text>
                                <text x={x} y={height - padding + 16} fill="#6b7280" fontSize="9" textAnchor="middle">
                                    {new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </text>
                            </g>
                        );
                    })}

                    <defs>
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#818cf8" />
                            <stop offset="100%" stopColor="#34d399" />
                        </linearGradient>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
        </div>
    );
}
