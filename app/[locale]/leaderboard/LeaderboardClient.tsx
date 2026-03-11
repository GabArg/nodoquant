"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { quantScoreColor } from "@/lib/quantScore";

interface Entry {
    id: string;
    public_id: string;
    strategy_name: string;
    dataset_name: string;
    category: string;
    trades_count: number;
    winrate: number;
    profit_factor: number;
    max_drawdown: number;
    edge_score: number;
    quant_score: number;
    created_at: string;
}

type SortKey = "quant_score" | "profit_factor" | "winrate" | "max_drawdown" | "trades_count" | "edge_score";
type SortDir = "desc" | "asc";

const CATEGORIES = [
    { value: "all", label: "All Markets", icon: "🌍", color: "#818cf8" },
    { value: "forex", label: "Forex", icon: "💱", color: "#34d399" },
    { value: "crypto", label: "Crypto", icon: "₿", color: "#f59e0b" },
    { value: "futures", label: "Futures", icon: "📈", color: "#60a5fa" },
    { value: "stocks", label: "Stocks", icon: "📊", color: "#a78bfa" },
    { value: "indices", label: "Indices", icon: "🏦", color: "#f472b6" },
    { value: "other", label: "Other", icon: "💡", color: "#9ca3af" },
];

function scoreTier(s: number) {
    if (s >= 80) return { label: "Strong Edge", color: "#34d399", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" };
    if (s >= 60) return { label: "Positive Edge", color: "#818cf8", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.2)" };
    if (s >= 40) return { label: "Marginal Edge", color: "#fbbf24", bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.2)" };
    return { label: "No Clear Edge", color: "#f87171", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)" };
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
    if (!active) return <span className="ml-1 opacity-20">↕</span>;
    return <span className="ml-1">{dir === "desc" ? "↓" : "↑"}</span>;
}

function SortableTh({ label, sortKey, current, dir, onSort, className = "" }: {
    label: string; sortKey: SortKey; current: SortKey; dir: SortDir;
    onSort: (k: SortKey) => void; className?: string;
}) {
    return (
        <th className={`px-4 py-4 cursor-pointer select-none hover:text-indigo-400 transition-colors ${className}`}
            onClick={() => onSort(sortKey)} title={`Sort by ${label}`}>
            {label}<SortIcon active={current === sortKey} dir={dir} />
        </th>
    );
}

function RankBadge({ rank }: { rank: number }) {
    if (rank === 1) return <span className="text-lg">🥇</span>;
    if (rank === 2) return <span className="text-lg">🥈</span>;
    if (rank === 3) return <span className="text-lg">🥉</span>;
    return <span className="tabular-nums text-sm font-bold" style={{ color: "#4b5563" }}>#{rank}</span>;
}

function ScorePill({ score }: { score: number }) {
    const tier = scoreTier(score);
    return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tabular-nums"
            style={{ background: tier.bg, color: tier.color, border: `1px solid ${tier.border}` }}>
            {score.toFixed(0)}
        </span>
    );
}

/** Top Strategy Spotlight — featured card for the #1 ranked entry */
function SpotlightCard({ entry, locale }: { entry: Entry; locale?: string }) {
    const tier = scoreTier(entry.quant_score);
    const wr = entry.winrate > 1 ? entry.winrate : entry.winrate * 100;
    const href = entry.public_id ? `/${locale ?? "en"}/report/${entry.public_id}` : null;
    return (
        <div className="relative overflow-hidden rounded-2xl p-6 mb-8"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(16,185,129,0.05) 100%)", border: "1px solid rgba(99,102,241,0.2)" }}>

            {/* Background glow */}
            <div style={{
                position: "absolute", top: "-40px", right: "-40px", width: "200px", height: "200px",
                borderRadius: "50%", background: `${tier.color}08`, filter: "blur(40px)", pointerEvents: "none"
            }} />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl shrink-0"
                        style={{ background: tier.bg, border: `2px solid ${tier.border}` }}>
                        <span className="text-3xl font-black tabular-nums" style={{ color: tier.color }}>
                            {Math.round(entry.quant_score)}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: tier.color }}>
                            Score
                        </span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                                style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" }}>
                                🏆 #1 Ranked Strategy
                            </span>
                        </div>
                        <h2 className="text-lg font-extrabold text-white">{entry.strategy_name || "Strategy Report"}</h2>
                        <p className="text-sm mt-0.5" style={{ color: "#9ca3af" }}>{entry.dataset_name} · {entry.category}</p>
                    </div>
                </div>

                {/* Key metrics row */}
                <div className="flex gap-4 flex-wrap">
                    {[
                        { label: "Win Rate", value: `${wr.toFixed(1)}%`, color: "#34d399" },
                        { label: "Profit Factor", value: entry.profit_factor.toFixed(2), color: "#818cf8" },
                        { label: "Max DD", value: `${Math.abs(entry.max_drawdown).toFixed(1)}%`, color: "#f87171" },
                        { label: "Trades", value: entry.trades_count.toString(), color: "#9ca3af" },
                    ].map(m => (
                        <div key={m.label} className="text-center">
                            <p className="text-[11px] uppercase tracking-wider font-medium mb-0.5" style={{ color: "#4b5563" }}>{m.label}</p>
                            <p className="text-lg font-extrabold tabular-nums" style={{ color: m.color }}>{m.value}</p>
                        </div>
                    ))}
                </div>

                {href && (
                    <Link href={href}
                        className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02]"
                        style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", boxShadow: "0 0 20px rgba(99,102,241,0.3)" }}>
                        Full report →
                    </Link>
                )}
            </div>
        </div>
    );
}

export default function LeaderboardClient() {
    const router = useRouter();
    const [entries, setEntries] = useState<Entry[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState("all");
    const [sortKey, setSortKey] = useState<SortKey>("quant_score");
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    const [locale, setLocale] = useState("en");

    useEffect(() => {
        const pathLocale = window.location.pathname.split("/")[1];
        if (pathLocale === "es" || pathLocale === "en") setLocale(pathLocale);
    }, []);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/leaderboard?category=${category}`)
            .then(r => r.json())
            .then(d => setEntries(d.data ?? []))
            .catch(() => setEntries([]))
            .finally(() => setLoading(false));
    }, [category]);

    function handleSort(key: SortKey) {
        if (key === sortKey) setSortDir(d => d === "desc" ? "asc" : "desc");
        else { setSortKey(key); setSortDir("desc"); }
    }

    const sorted = useMemo(() =>
        [...entries].sort((a, b) => {
            const av = a[sortKey] as number, bv = b[sortKey] as number;
            return sortDir === "desc" ? bv - av : av - bv;
        }), [entries, sortKey, sortDir]);

    const topByScore = sorted[0] ?? null;

    const activeCat = CATEGORIES.find(c => c.value === category);

    return (
        <div className="min-h-screen pt-24 pb-20" style={{ background: "var(--bg)" }}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* ── Header ── */}
                <header className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
                        style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        Public Ranking
                    </div>
                    <h1 className="text-4xl font-extrabold text-white mb-3">Strategy Leaderboard</h1>
                    <p className="text-gray-400 max-w-lg mx-auto">
                        Top trading strategies ranked by Strategy Score — measuring profitability, robustness and statistical confidence.
                        Click any column to sort.
                    </p>
                </header>

                {/* ── Market Category Pills ── */}
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                    {CATEGORIES.map(c => {
                        const active = category === c.value;
                        return (
                            <button
                                key={c.value}
                                onClick={() => setCategory(c.value)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all"
                                style={{
                                    background: active ? `${c.color}15` : "rgba(255,255,255,0.03)",
                                    color: active ? c.color : "#6b7280",
                                    border: `1.5px solid ${active ? `${c.color}40` : "rgba(255,255,255,0.05)"}`,
                                    transform: active ? "scale(1.04)" : "scale(1)",
                                }}
                            >
                                <span>{c.icon}</span>
                                {c.label}
                            </button>
                        );
                    })}
                </div>

                {loading ? (
                    <div className="text-center py-16">
                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-sm text-gray-500">Loading leaderboard…</p>
                    </div>
                ) : entries.length === 0 ? (

                    /* ── Rich Empty State ── */
                    <div className="rounded-2xl p-12 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="text-5xl mb-4">{activeCat?.icon ?? "🌍"}</div>
                        <h3 className="text-xl font-bold text-white mb-2">
                            No {activeCat?.label ?? ""} strategies yet
                        </h3>
                        <p className="text-sm text-gray-500 mb-2 max-w-sm mx-auto">
                            No one has shared a public {activeCat?.value !== "all" ? activeCat?.label : ""} strategy analysis yet.
                        </p>
                        <p className="text-sm mb-6" style={{ color: "#818cf8" }}>
                            Be the first — analyze your strategy and share your report to appear here.
                        </p>
                        <Link href={`/${locale}/analyzer`} className="btn-primary inline-flex">
                            Analyze your strategy →
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* ── Top Strategy Spotlight ── */}
                        {topByScore && <SpotlightCard entry={topByScore} locale={locale} />}

                        {/* ── Leaderboard Table ── */}
                        <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-300">
                                    <thead className="text-xs uppercase font-medium text-gray-500 border-b"
                                        style={{ background: "rgba(0,0,0,0.2)", borderColor: "rgba(255,255,255,0.05)" }}>
                                        <tr>
                                            <th className="px-4 py-4 w-12 text-center">Rank</th>
                                            <th className="px-4 py-4">Strategy</th>
                                            <th className="px-4 py-4">Market</th>
                                            <SortableTh label="Score" sortKey="quant_score" current={sortKey} dir={sortDir} onSort={handleSort} className="text-right" />
                                            <SortableTh label="Profit Factor" sortKey="profit_factor" current={sortKey} dir={sortDir} onSort={handleSort} className="text-right" />
                                            <SortableTh label="Win Rate" sortKey="winrate" current={sortKey} dir={sortDir} onSort={handleSort} className="text-right" />
                                            <SortableTh label="Max DD" sortKey="max_drawdown" current={sortKey} dir={sortDir} onSort={handleSort} className="text-right" />
                                            <SortableTh label="Trades" sortKey="trades_count" current={sortKey} dir={sortDir} onSort={handleSort} className="text-right" />
                                            <th className="px-4 py-4 w-16" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                                        {sorted.map((e, i) => {
                                            const href = e.public_id ? `/${locale}/report/${e.public_id}` : null;
                                            const wr = e.winrate > 1 ? e.winrate : e.winrate * 100;
                                            return (
                                                <tr
                                                    key={e.id}
                                                    className="transition-colors"
                                                    style={{
                                                        cursor: href ? "pointer" : "default",
                                                        background: i === 0 ? "rgba(251,191,36,0.02)" : "transparent",
                                                    }}
                                                    onMouseEnter={el => (el.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                                                    onMouseLeave={el => (el.currentTarget.style.background = i === 0 ? "rgba(251,191,36,0.02)" : "transparent")}
                                                    onClick={() => href && router.push(href)}
                                                >
                                                    <td className="px-4 py-3.5 text-center">
                                                        <RankBadge rank={i + 1} />
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="font-semibold text-white">{e.strategy_name || "Strategy Report"}</div>
                                                        <div className="text-xs truncate max-w-[140px]" style={{ color: "#4b5563" }}>{e.dataset_name}</div>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span className="capitalize text-xs font-medium px-2 py-0.5 rounded-full"
                                                            style={{
                                                                background: `${CATEGORIES.find(c => c.value === e.category)?.color ?? "#9ca3af"}12`,
                                                                color: CATEGORIES.find(c => c.value === e.category)?.color ?? "#9ca3af",
                                                                border: `1px solid ${CATEGORIES.find(c => c.value === e.category)?.color ?? "#9ca3af"}25`,
                                                            }}>
                                                            {CATEGORIES.find(c => c.value === e.category)?.icon ?? "💡"} {e.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right">
                                                        <ScorePill score={e.quant_score} />
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right tabular-nums font-medium text-white">{e.profit_factor.toFixed(2)}</td>
                                                    <td className="px-4 py-3.5 text-right tabular-nums" style={{ color: "#34d399" }}>{wr.toFixed(1)}%</td>
                                                    <td className="px-4 py-3.5 text-right tabular-nums" style={{ color: "#f87171" }}>{Math.abs(e.max_drawdown).toFixed(1)}%</td>
                                                    <td className="px-4 py-3.5 text-right tabular-nums text-gray-400">{e.trades_count}</td>
                                                    <td className="px-4 py-3.5 text-right">
                                                        {e.public_id && (
                                                            <span className="text-xs font-semibold" style={{ color: "#818cf8" }}>View →</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* ── CTA ── */}
                        <div className="text-center mt-12 py-8 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                            <p className="text-sm text-gray-500 mb-4">Want to rank your strategy? Share your analysis publicly.</p>
                            <Link href={`/${locale}/analyzer`} className="btn-primary inline-flex">Analyze your strategy →</Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
