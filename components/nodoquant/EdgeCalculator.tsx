"use client";

import { useState, useEffect } from "react";

export default function EdgeCalculator() {
    const [winRate, setWinRate] = useState<number>(50);
    const [avgWin, setAvgWin] = useState<number>(2);
    const [avgLoss, setAvgLoss] = useState<number>(1);
    const [trades, setTrades] = useState<number>(100);

    const [results, setResults] = useState({
        expectancy: 0,
        profitFactor: 0,
        edgeScore: 0,
        totalNet: 0
    });

    useEffect(() => {
        const wr = winRate / 100;
        const lossRate = 1 - wr;

        // Expectancy = (Win% * AvgWin) - (Loss% * AvgLoss)
        const expectancy = (wr * avgWin) - (lossRate * avgLoss);

        // Profit Factor = (Win% * AvgWin) / (Loss% * AvgLoss)
        const totalWins = wr * trades * avgWin;
        const totalLosses = lossRate * trades * avgLoss;
        const profitFactor = totalLosses === 0 ? totalWins : totalWins / totalLosses;

        // Edge Score (NodoQuant style)
        // 0-100 score based on expectancy and profit factor
        let score = (expectancy / avgLoss) * 20 + (profitFactor * 10);
        score = Math.min(100, Math.max(0, score));

        setResults({
            expectancy: Number(expectancy.toFixed(2)),
            profitFactor: Number(profitFactor.toFixed(2)),
            edgeScore: Math.round(score),
            totalNet: Number((expectancy * trades).toFixed(2))
        });
    }, [winRate, avgWin, avgLoss, trades]);

    return (
        <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-2xl text-gray-900 max-w-4xl mx-auto my-12 border border-indigo-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Inputs */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Win Rate (%)</label>
                        <input
                            type="range" min="0" max="100" value={winRate}
                            onChange={(e) => setWinRate(Number(e.target.value))}
                            className="w-full h-2 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between mt-2 font-mono font-bold text-indigo-600">
                            <span>0%</span>
                            <span>{winRate}%</span>
                            <span>100%</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Avg Win ($ or R)</label>
                            <input
                                type="number" value={avgWin}
                                onChange={(e) => setAvgWin(Number(e.target.value))}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Avg Loss ($ or R)</label>
                            <input
                                type="number" value={avgLoss}
                                onChange={(e) => setAvgLoss(Number(e.target.value))}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Sample Size (Trades)</label>
                        <input
                            type="number" value={trades}
                            onChange={(e) => setTrades(Number(e.target.value))}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>

                {/* Results Overlay */}
                <div className="bg-indigo-600 rounded-2xl p-8 text-white flex flex-col justify-center shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                    </div>

                    <div className="relative z-10 text-center">
                        <span className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2 block">Expectancy per Trade</span>
                        <div className="text-5xl font-black mb-6">
                            {results.expectancy > 0 ? "+" : ""}{results.expectancy}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                                <span className="text-[10px] font-bold uppercase block opacity-70">Profit Factor</span>
                                <span className="text-xl font-black">{results.profitFactor}</span>
                            </div>
                            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                                <span className="text-[10px] font-bold uppercase block opacity-70">Edge Score</span>
                                <span className="text-xl font-black">{results.edgeScore}/100</span>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/20">
                            <p className="text-sm font-medium opacity-90 leading-relaxed mb-4">
                                {results.expectancy > 0
                                    ? `This system has a positive edge. You expect to earn ${results.expectancy} units for every unit of risk.`
                                    : "This system has a negative edge. Long term, this strategy will lose money regardless of luck."}
                            </p>
                            <a href="/analyzer" className="inline-block bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors shadow-lg">
                                Analyze Your Data →
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
