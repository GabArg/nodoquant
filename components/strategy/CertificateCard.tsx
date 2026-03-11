"use client";

import React from "react";

interface CertificateCardProps {
    data: {
        strategy_name: string;
        score: number;
        market: string;
        symbol: string;
        win_rate: number;
        profit_factor: number;
        trades: number;
        published_at?: string;
    };
}

export default function CertificateCard({ data }: CertificateCardProps) {
    const { strategy_name, score, market, symbol, win_rate, profit_factor, trades } = data;

    const wr = win_rate > 1 ? win_rate : win_rate * 100;

    let tier = "Weak Edge";
    let tierColor = "text-red-400";
    let tierBg = "bg-red-500/10";
    let tierBorder = "border-red-500/20";

    if (score >= 90) {
        tier = "Elite";
        tierColor = "text-indigo-400";
        tierBg = "bg-indigo-500/15";
        tierBorder = "border-indigo-500/30";
    } else if (score >= 75) {
        tier = "Strong Edge";
        tierColor = "text-emerald-400";
        tierBg = "bg-emerald-500/10";
        tierBorder = "border-emerald-500/20";
    } else if (score >= 60) {
        tier = "Moderate Edge";
        tierColor = "text-amber-400";
        tierBg = "bg-amber-500/10";
        tierBorder = "border-amber-500/20";
    }

    return (
        <div
            id="certificate-content"
            className="relative w-[1200px] h-[630px] bg-[#07090F] overflow-hidden flex flex-col justify-between p-16 font-sans text-white border-[12px] border-[#10141D]"
            style={{
                backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(79, 70, 229, 0.1) 0%, transparent 40%), radial-gradient(circle at 0% 100%, rgba(79, 70, 229, 0.05) 0%, transparent 40%)'
            }}
        >
            {/* Background Texture/Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

            {/* Header Branding */}
            <div className="relative z-10 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center rotate-3 shadow-lg shadow-indigo-600/40">
                        <span className="text-2xl font-black text-white px-1 italic leading-none">N</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter leading-none mb-1">NodoQuant</h2>
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.3em] opacity-80 letter-spacing-widest">Quantitative Analysis Engine</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="px-5 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Strategy Score Certified</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="relative z-10 flex flex-col items-center justify-center flex-1 py-4">
                <div className="text-center mb-8">
                    <h1 className="text-6xl font-black text-white/90 uppercase tracking-tight mb-2 max-w-[900px] truncate leading-tight">
                        {strategy_name}
                    </h1>
                    <div className="flex items-center justify-center gap-3">
                        <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${tierBg} ${tierColor} ${tierBorder}`}>
                            {tier}
                        </span>
                        <span className="text-gray-600 font-bold">•</span>
                        <span className="text-xs font-black uppercase tracking-widest text-gray-500">
                            {market} / {symbol}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-16">
                    {/* The Score Big Circle */}
                    <div className="relative w-56 h-56 flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle
                                cx="50%"
                                cy="50%"
                                r="46%"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                className="text-white/5"
                            />
                            <circle
                                cx="50%"
                                cy="50%"
                                r="46%"
                                stroke="currentColor"
                                strokeWidth="8"
                                strokeDasharray={`${score * 2.89}, 289`}
                                strokeLinecap="round"
                                fill="transparent"
                                className={tierColor}
                            />
                        </svg>
                        <div className="text-center">
                            <span className="block text-7xl font-black leading-none">{Math.round(score)}</span>
                            <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mt-2">Quantitative Score</span>
                        </div>
                    </div>

                    {/* Meta Info Grid */}
                    <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                        <div>
                            <span className="block text-[10px] font-black uppercase tracking-widest text-gray-600 mb-1">Win Rate</span>
                            <span className="text-3xl font-black text-white tabular-nums">{wr.toFixed(1)}%</span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-black uppercase tracking-widest text-gray-600 mb-1">Profit Factor</span>
                            <span className="text-3xl font-black text-white tabular-nums">{profit_factor.toFixed(2)}</span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-black uppercase tracking-widest text-gray-600 mb-1">Trades Analyzed</span>
                            <span className="text-3xl font-black text-white tabular-nums">{trades}</span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-black uppercase tracking-widest text-gray-600 mb-1">Authenticity</span>
                            <span className="text-xs font-black text-indigo-400 tracking-tighter uppercase mt-2 block">Verified by Engine</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Seal & Info */}
            <div className="relative z-10 flex justify-between items-end">
                <div className="text-gray-600 text-[10px] font-medium max-w-xl leading-relaxed">
                    This certificate represents a statistical performance evaluation performed by the NodoQuant analyzer.
                    It follows robustness, over-optimization and consistency checks designed for professional traders.
                    No investment advice. Past performance is not indicative of future results.
                </div>
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 border-2 border-white/5 rounded-full flex items-center justify-center p-2">
                        <div className="w-full h-full border border-white/5 rounded-full flex items-center justify-center p-3 relative">
                            <div className="absolute inset-0 bg-indigo-500/5 rounded-full animate-pulse" />
                            <div className="text-center z-10">
                                <span className="block text-[8px] font-black uppercase tracking-tighter text-indigo-400">NodoQuant</span>
                                <span className="block text-[6px] font-bold uppercase tracking-widest text-white/40">Seal</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Accent Line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-600/40 to-transparent" />
        </div>
    );
}
