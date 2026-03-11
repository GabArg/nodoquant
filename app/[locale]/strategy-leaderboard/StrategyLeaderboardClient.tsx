"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { quantScoreColor } from "@/lib/quantScore";

interface StrategyEntry {
    id: string;
    slug: string;
    name: string;
    market: string | null;
    asset: string | null;
    timeframe: string | null;
    strategy_style: string | null;
    category: string | null;
    quant_score: number;
    confidence: "Low" | "Moderate" | "High";
    overfitting_risk: "Low" | "Moderate" | "High" | "Insufficient Data";
    datasets_count: number;
    top_profit_factor: number;
    created_at: string;
}

const CATEGORIES = [
    { value: "all", label: "All" },
    { value: "forex", label: "Forex" },
    { value: "crypto", label: "Crypto" },
    { value: "indices", label: "Indices" },
    { value: "commodities", label: "Commodities" },
    { value: "stocks", label: "Stocks" },
    { value: "other", label: "Other" },
];

function confidenceColor(level: string) {
    if (level === "High") return "text-emerald-400";
    if (level === "Moderate") return "text-fbbf24";
    return "text-red-400";
}

function riskColor(level: string) {
    if (level === "Low") return "text-emerald-400";
    if (level === "Moderate") return "text-fbbf24";
    if (level === "High") return "text-red-400";
    return "text-gray-500";
}

export default function StrategyLeaderboardClient() {
    const router = useRouter();
    const [entries, setEntries] = useState<StrategyEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState("all");

    useEffect(() => {
        setLoading(true);
        fetch(`/api/strategy-leaderboard?category=${category}`)
            .then((r) => r.json())
            .then((d) => setEntries(d.data ?? []))
            .catch(() => setEntries([]))
            .finally(() => setLoading(false));
    }, [category]);

    return (
        <div className="min-h-screen pt-24 pb-20" style={{ background: "var(--bg)" }}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <header className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
                        style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        Top Trading Strategies
                    </div>
                    <h1 className="text-4xl font-extrabold text-white mb-3">Strategy Leaderboard</h1>
                    <p className="text-gray-400 max-w-xl mx-auto">
                        Ranked by Quant Score, capturing profitability, robustness, confidence, and curve-fitting risk across multiple datasets.
                    </p>
                </header>

                {/* Category Filter */}
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                    {CATEGORIES.map((c) => (
                        <button
                            key={c.value}
                            onClick={() => setCategory(c.value)}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                            style={{
                                background: category === c.value ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
                                color: category === c.value ? "#818cf8" : "#6b7280",
                                border: `1px solid ${category === c.value ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.05)"}`,
                            }}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="text-center py-16">
                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-sm text-gray-500">Loading strategy leaderboard...</p>
                    </div>
                ) : entries.length === 0 ? (
                    <div className="card rounded-2xl border border-white/5 bg-[#111118] p-12 text-center">
                        <h3 className="text-lg font-semibold text-white mb-2">No active strategies found</h3>
                        <p className="text-sm text-gray-500 mb-6">Analyze a strategy and mark its datasets as public to list it here.</p>
                        <Link href="/analyzer" className="btn-primary inline-flex">
                            Analyze your strategy →
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Leaderboard Table */}
                        <div className="card rounded-2xl border border-white/5 bg-[#111118] overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-300">
                                    <thead className="bg-black/20 text-xs uppercase font-medium text-gray-500 border-b border-white/5">
                                        <tr>
                                            <th className="px-4 py-4 w-12 text-center">#</th>
                                            <th className="px-4 py-4 min-w-[140px]">Strategy Name</th>
                                            <th className="px-4 py-4">Market</th>
                                            <th className="px-4 py-4">Asset</th>
                                            <th className="px-4 py-4">Timeframe</th>
                                            <th className="px-4 py-4 text-center">Datasets</th>
                                            <th className="px-4 py-4 text-center">Confidence</th>
                                            <th className="px-4 py-4 text-center">Overfitting Risk</th>
                                            <th className="px-4 py-4 text-right">Quant Score</th>
                                            <th className="px-4 py-4 text-right w-16"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {entries.map((e, i) => (
                                            <tr
                                                key={e.id}
                                                className="hover:bg-white/[0.04] transition-colors cursor-pointer"
                                                onClick={() => e.slug && router.push(`/strategy/${e.slug}`)}
                                            >
                                                <td className="px-4 py-3.5 text-center">
                                                    <span className="font-bold tabular-nums" style={{
                                                        color: i === 0 ? "#fbbf24" : i === 1 ? "#9ca3af" : i === 2 ? "#cd7f32" : "#4b5563",
                                                    }}>
                                                        {i + 1}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 font-bold text-white max-w-[200px] truncate" title={e.name}>
                                                    {e.name}
                                                </td>
                                                <td className="px-4 py-3.5 text-gray-400 capitalize">{e.market || "-"}</td>
                                                <td className="px-4 py-3.5 text-gray-400 uppercase">{e.asset || "-"}</td>
                                                <td className="px-4 py-3.5 text-gray-400 uppercase">{e.timeframe || "-"}</td>
                                                <td className="px-4 py-3.5 text-center tabular-nums text-gray-400">
                                                    {e.datasets_count}
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                    <span className={`font-medium ${confidenceColor(e.confidence)}`}>
                                                        {e.confidence}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                    <span className={`font-medium ${riskColor(e.overfitting_risk)}`}>
                                                        {e.overfitting_risk}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    <span
                                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tabular-nums"
                                                        style={{
                                                            background: `${quantScoreColor(e.quant_score)}15`,
                                                            color: quantScoreColor(e.quant_score),
                                                            border: `1px solid ${quantScoreColor(e.quant_score)}30`,
                                                        }}
                                                    >
                                                        {e.quant_score.toFixed(1)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    <span className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors whitespace-nowrap">
                                                        Analyze →
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="text-center mt-12 py-8 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                            <p className="text-sm text-gray-500 mb-4">Want to rank your strategy? Analyze your trades and publish your datasets.</p>
                            <Link href="/analyzer" className="btn-primary inline-flex">
                                Analyze your strategy →
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
