"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    calcEdgeScore,
    edgeScoreColor,
    edgeScoreLabel,
    safeStrategyName,
    safeDatasetName,
    formatDate,
} from "@/lib/edgeScore";
import StrategyHealthPanel from "@/components/strategy/StrategyHealthPanel";
import StrategyRobustnessPanel from "@/components/strategy/StrategyRobustnessPanel";
import StrategyEvolutionPanel from "@/components/strategy/StrategyEvolutionPanel";
import QuantScoreCard from "@/components/strategy/QuantScoreCard";
import ConfidenceIndicator, { calcConfidence } from "@/components/strategy/ConfidenceIndicator";
import OverfittingRiskCard from "@/components/strategy/OverfittingRiskCard";
import StrategyDNACard from "@/components/strategy/StrategyDNACard";
import { calcHealthScore, calcRobustnessScore, calcEvolutionScore, calcQuantScore } from "@/lib/quantScore";
import { detectOverfitting } from "@/lib/overfittingRisk";
import { analyzeStrategyDNA } from "@/lib/strategyDNA";
import { useTranslations } from "next-intl";

interface Dataset {
    id: string;
    created_at: string;
    dataset_name: string | null;
    file_name: string | null;
    public_id: string | null;
    winrate: number;
    profit_factor: number;
    max_drawdown: number;
    trades_count: number;
    metrics_json: any;
}

interface Strategy {
    name: string | null;
    description: string | null;
    category: string | null;
    market?: string | null;
    asset?: string | null;
    timeframe?: string | null;
    strategy_style?: string | null;
}

interface Props {
    strategy: Strategy | null;
    datasets: Dataset[];
    slug: string;
}

// ── Mini Canvas Chart ──
function MiniChart({ data, color, label }: { data: number[]; color: string; label: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || data.length < 2) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        const W = rect.width, H = rect.height;
        const PAD = { l: 45, r: 12, t: 8, b: 20 };
        const cW = W - PAD.l - PAD.r, cH = H - PAD.t - PAD.b;

        ctx.clearRect(0, 0, W, H);

        let min = Infinity, max = -Infinity;
        for (const v of data) { if (v < min) min = v; if (v > max) max = v; }
        if (min === max) { min -= 1; max += 1; }
        const range = max - min;

        // Grid
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.fillStyle = "#4b5563";
        ctx.font = "9px system-ui";
        ctx.textAlign = "right";
        for (let i = 0; i <= 3; i++) {
            const val = min + (range * i) / 3;
            const y = PAD.t + cH * (1 - (val - min) / range);
            ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(W - PAD.r, y); ctx.stroke();
            ctx.fillText(val.toFixed(0), PAD.l - 4, y + 3);
        }

        // Line
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        for (let i = 0; i < data.length; i++) {
            const x = PAD.l + (cW * i) / (data.length - 1);
            const y = PAD.t + cH * (1 - (data[i] - min) / range);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
    }, [data, color]);

    if (!data || data.length < 2) {
        return (
            <div className="rounded-xl p-6 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p className="text-xs text-gray-600">{label}</p>
                <p className="text-xs text-gray-500 mt-1">No curve data available for this dataset.</p>
            </div>
        );
    }

    return (
        <div>
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-2">{label}</p>
            <canvas ref={canvasRef} style={{ width: "100%", height: 160, display: "block" }} />
        </div>
    );
}

// ── Main Component ──
export default function StrategyPublicClient({ strategy, datasets, slug }: Props) {
    const router = useRouter();
    const t = useTranslations("strategy");
    const stratName = safeStrategyName(strategy?.name);
    const [previewIdx, setPreviewIdx] = useState(0);
    const [copied, setCopied] = useState(false);

    // Compute edge scores
    const enriched = datasets.map((d, i) => ({
        ...d,
        edge: calcEdgeScore(Number(d.winrate), Number(d.profit_factor), Number(d.max_drawdown), d.trades_count),
        dsLabel: safeDatasetName(d.dataset_name || d.file_name, i),
    }));

    const latestPublicId = enriched[0]?.public_id || null;

    const handleShare = () => {
        const url = `${window.location.origin}/en/strategy/${slug}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Summary stats
    const bestEdge = enriched.reduce((a, b) => b.edge > a.edge ? b : a);
    const lowestDD = enriched.reduce((a, b) => Number(b.max_drawdown) < Number(a.max_drawdown) ? b : a);
    const highestPF = enriched.reduce((a, b) => Number(b.profit_factor) > Number(a.profit_factor) ? b : a);
    const avgEdge = enriched.reduce((s, d) => s + d.edge, 0) / enriched.length;

    // Best indices for table highlighting
    const bestEdgeIdx = enriched.indexOf(bestEdge);
    const lowestDDIdx = enriched.indexOf(lowestDD);
    const highestPFIdx = enriched.indexOf(highestPF);

    // Preview dataset
    const preview = enriched[previewIdx];

    // ── Quant Score computation ──
    const healthScore = preview
        ? calcHealthScore(Number(preview.winrate), Number(preview.profit_factor), Number(preview.max_drawdown), preview.trades_count, preview.edge)
        : 0;
    const robustnessScore = calcRobustnessScore(
        enriched.map((d) => ({ trades_count: d.trades_count, winrate: Number(d.winrate), profit_factor: Number(d.profit_factor), max_drawdown: Number(d.max_drawdown), edge: d.edge }))
    );
    const evolutionScore = calcEvolutionScore(
        enriched.map((d) => ({ created_at: d.created_at, winrate: Number(d.winrate), profit_factor: Number(d.profit_factor), max_drawdown: Number(d.max_drawdown), edge: d.edge }))
    );
    const quantResult = calcQuantScore(bestEdge.edge, robustnessScore, healthScore, evolutionScore,
        preview?.trades_count, preview ? Number(preview.max_drawdown) : undefined);

    // ── Auto Summary ──
    const confResult = calcConfidence({
        totalTrades: enriched.reduce((s, d) => s + d.trades_count, 0),
        datasetCount: enriched.length,
        oldestDate: enriched[enriched.length - 1].created_at,
        newestDate: enriched[0].created_at,
    });
    const overfitResult = detectOverfitting({
        profitFactor: preview ? Number(preview.profit_factor) : 0,
        maxDrawdown: preview ? Number(preview.max_drawdown) : 0,
        trades: preview?.trades_count ?? 0,
        datasetsCount: enriched.length,
        confidenceScore: confResult.score,
        edgeScores: enriched.map((d) => d.edge),
        expectancy: preview?.metrics_json?.expectancy != null ? Number(preview.metrics_json.expectancy) : undefined,
    });

    function autoSummary(): { text: string; color: string } {
        const q = quantResult.score;
        const c = confResult.level;
        const o = overfitResult.riskLevel;
        if (q >= 7 && c === "High" && o === "Low") return { text: "Robust strategy with strong statistical support.", color: "#34d399" };
        if (q >= 7 && c === "High") return { text: "Strong performance with solid evidence, but monitor overfitting signals.", color: "#818cf8" };
        if (q >= 7 && o === "High") return { text: "High performance but potential overfitting risk detected. Validate with more datasets.", color: "#fbbf24" };
        if (q >= 7) return { text: "Promising strategy but limited evidence. More datasets recommended.", color: "#818cf8" };
        if (q >= 5 && c === "High") return { text: "Moderate edge with solid data backing. Room for optimization.", color: "#818cf8" };
        if (q >= 5) return { text: "Moderate signal detected. Increase sample size to confirm edge.", color: "#fbbf24" };
        if (c === "High") return { text: "No clear edge despite strong data — consider reviewing strategy logic.", color: "#f87171" };
        return { text: "Insufficient data and weak signal. More testing required.", color: "#f87171" };
    }
    const summary = autoSummary();

    return (
        <div className="min-h-screen pt-20 pb-24" style={{ background: "var(--bg)" }}>
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* ── Header ── */}
                <header className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
                        style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
                            <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
                        </svg>
                        Strategy Analysis Report
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">{stratName}</h1>
                    {strategy?.description && (
                        <p className="text-sm text-gray-500 mb-3 max-w-md mx-auto">{strategy.description}</p>
                    )}
                    <div className="flex flex-wrap justify-center gap-2 mb-5">
                        <span className="px-2.5 py-1 rounded-md text-xs font-medium" style={{ background: "rgba(255,255,255,0.04)", color: "#9ca3af" }}>
                            {enriched.length} dataset{enriched.length !== 1 ? "s" : ""}
                        </span>
                        <span className="px-2.5 py-1 rounded-md text-xs font-medium" style={{ background: "rgba(255,255,255,0.04)", color: "#9ca3af" }}>
                            Last update: {formatDate(enriched[0].created_at)}
                        </span>
                        {strategy?.market && (
                            <span className="px-2.5 py-1 rounded-md text-xs font-medium" style={{ background: "rgba(99,102,241,0.08)", color: "#818cf8" }}>
                                {strategy.market}
                            </span>
                        )}
                        {strategy?.asset && (
                            <span className="px-2.5 py-1 rounded-md text-xs font-medium" style={{ background: "rgba(99,102,241,0.08)", color: "#818cf8" }}>
                                {strategy.asset}
                            </span>
                        )}
                        {strategy?.timeframe && (
                            <span className="px-2.5 py-1 rounded-md text-xs font-medium" style={{ background: "rgba(99,102,241,0.08)", color: "#818cf8" }}>
                                {strategy.timeframe}
                            </span>
                        )}
                        {strategy?.strategy_style && (
                            <span className="px-2.5 py-1 rounded-md text-xs font-medium" style={{ background: "rgba(99,102,241,0.08)", color: "#818cf8" }}>
                                {strategy.strategy_style}
                            </span>
                        )}
                    </div>
                    <div className="flex justify-center flex-wrap gap-3">
                        <button onClick={handleShare} className="btn-primary text-sm inline-flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                            {copied ? "Copied URL!" : "Share Strategy"}
                        </button>
                        {latestPublicId && (
                            <Link href={`/report/${latestPublicId}`} className="btn-secondary text-sm inline-flex">
                                View Latest Dataset
                            </Link>
                        )}
                        <Link href="/strategy-leaderboard" className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            style={{ background: "rgba(255,255,255,0.04)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.08)" }}>
                            Leaderboard
                        </Link>
                    </div>
                </header>

                {/* ════════════════════════════════════════ */}
                {/* SECTION 1 — STRATEGY VERDICT */}
                {/* ════════════════════════════════════════ */}
                <SectionHeader
                    title="Strategy Verdict"
                    desc="Overall evaluation based on statistical strength, evidence quality, and overfitting risk."
                    num="01"
                />

                <QuantScoreCard result={quantResult} />

                {/* Auto Summary */}
                <div className="rounded-xl px-4 py-3 mb-4 -mt-4"
                    style={{ background: `${summary.color}08`, border: `1px solid ${summary.color}20` }}>
                    <p className="text-xs font-medium" style={{ color: summary.color }}>
                        {summary.text}
                    </p>
                </div>

                <div className="flex flex-col gap-3 mb-12">
                    <ConfidenceIndicator
                        totalTrades={enriched.reduce((s, d) => s + d.trades_count, 0)}
                        datasetCount={enriched.length}
                        oldestDate={enriched[enriched.length - 1].created_at}
                        newestDate={enriched[0].created_at}
                        quantScore={quantResult.score}
                    />
                    <OverfittingRiskCard result={overfitResult} />
                </div>

                {/* ════════════════════════════════════════ */}
                {/* SECTION 2 — STRATEGY BEHAVIOR */}
                {/* ════════════════════════════════════════ */}
                <SectionHeader
                    title="Strategy Behavior"
                    desc="Behavioral fingerprint — trading style, risk structure, and distribution characteristics."
                    num="02"
                />

                {preview && (
                    <div className="mb-12">
                        <StrategyDNACard
                            dna={analyzeStrategyDNA({
                                trades: preview.trades_count,
                                pnl: preview.metrics_json?.pnl ?? preview.metrics_json?.equity_curve ?? [],
                                maxDrawdown: Number(preview.max_drawdown),
                                oldestDate: enriched[enriched.length - 1].created_at,
                                newestDate: enriched[0].created_at,
                                avgTradeDurationMin: preview.metrics_json?.avg_trade_duration_min ?? undefined,
                            })}
                        />
                    </div>
                )}

                {/* ════════════════════════════════════════ */}
                {/* SECTION 3 — STRATEGY STABILITY */}
                {/* ════════════════════════════════════════ */}
                <SectionHeader
                    title="Strategy Stability"
                    desc="Consistency and reliability across datasets and time."
                    num="03"
                />

                {preview && (
                    <div className="card rounded-2xl border border-white/5 bg-[#111118] p-5 mb-5">
                        <h2 className="sr-only">{t("performanceMetrics")}</h2>
                        <StrategyHealthPanel
                            winrate={Number(preview.winrate)}
                            profitFactor={Number(preview.profit_factor)}
                            drawdown={Number(preview.max_drawdown)}
                            trades={preview.trades_count}
                            edgeScore={preview.edge}
                        />
                    </div>
                )}

                <div className="card rounded-2xl border border-white/5 bg-[#111118] p-5 mb-5">
                    <h2 className="sr-only">{t("robustness")}</h2>
                    <StrategyRobustnessPanel
                        datasets={enriched.map((d) => ({
                            trades_count: d.trades_count,
                            winrate: Number(d.winrate),
                            profit_factor: Number(d.profit_factor),
                            max_drawdown: Number(d.max_drawdown),
                            edge: d.edge,
                        }))}
                    />
                </div>

                <div className="card rounded-2xl border border-white/5 bg-[#111118] p-5 mb-12">
                    <StrategyEvolutionPanel
                        datasets={enriched.map((d) => ({
                            created_at: d.created_at,
                            winrate: Number(d.winrate),
                            profit_factor: Number(d.profit_factor),
                            max_drawdown: Number(d.max_drawdown),
                            edge: d.edge,
                        }))}
                    />
                </div>

                {/* ════════════════════════════════════════ */}
                {/* SECTION 4 — DATASET ANALYSIS */}
                {/* ════════════════════════════════════════ */}
                <SectionHeader
                    title="Dataset Analysis"
                    desc="Performance breakdown of individual datasets."
                    num="04"
                />

                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    <SummaryCard title="Best Edge" value={bestEdge.edge.toFixed(1)} sub={bestEdge.dsLabel} color={edgeScoreColor(bestEdge.edge)} />
                    <SummaryCard title="Lowest DD" value={`${Number(lowestDD.max_drawdown).toFixed(1)}%`} sub={lowestDD.dsLabel} color="#34d399" />
                    <SummaryCard title="Highest PF" value={Number(highestPF.profit_factor).toFixed(2)} sub={highestPF.dsLabel} color="#34d399" />
                    <SummaryCard title="Avg Edge" value={avgEdge.toFixed(1)} sub={`${enriched.length} datasets`} color={edgeScoreColor(avgEdge)} />
                </div>

                {/* Datasets Table */}
                <div className="card rounded-2xl border border-white/5 bg-[#111118] overflow-hidden mb-5">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-300">
                            <thead className="bg-black/20 text-xs uppercase font-medium text-gray-500 border-b border-white/5">
                                <tr>
                                    <th className="px-4 py-3">Created</th>
                                    <th className="px-4 py-3">Dataset</th>
                                    <th className="px-4 py-3 text-right">Trades</th>
                                    <th className="px-4 py-3 text-right">WR</th>
                                    <th className="px-4 py-3 text-right">PF</th>
                                    <th className="px-4 py-3 text-right">Max DD</th>
                                    <th className="px-4 py-3 text-right">Edge</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {enriched.map((d, i) => {
                                    const href = d.public_id ? `/report/${d.public_id}` : null;
                                    return (
                                        <tr
                                            key={d.id}
                                            className="hover:bg-white/[0.04] transition-colors"
                                            style={{ cursor: href ? "pointer" : "default" }}
                                            onClick={() => href && router.push(href)}
                                        >
                                            <td className="px-4 py-3 tabular-nums text-gray-500">{formatDate(d.created_at)}</td>
                                            <td className="px-4 py-3 font-medium text-white">{d.dsLabel}</td>
                                            <td className="px-4 py-3 text-right tabular-nums">{d.trades_count}</td>
                                            <td className="px-4 py-3 text-right tabular-nums text-emerald-400">{Number(d.winrate).toFixed(1)}%</td>
                                            <td className="px-4 py-3 text-right tabular-nums" style={{ color: i === highestPFIdx ? "#34d399" : "#d1d5db", fontWeight: i === highestPFIdx ? 700 : 400 }}>
                                                {Number(d.profit_factor).toFixed(2)}{i === highestPFIdx && enriched.length > 1 ? " ★" : ""}
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums" style={{ color: i === lowestDDIdx ? "#34d399" : "#f87171", fontWeight: i === lowestDDIdx ? 700 : 400 }}>
                                                {Number(d.max_drawdown).toFixed(1)}%{i === lowestDDIdx && enriched.length > 1 ? " ★" : ""}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span
                                                    className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold tabular-nums"
                                                    style={{
                                                        background: `${edgeScoreColor(d.edge)}15`,
                                                        color: edgeScoreColor(d.edge),
                                                        border: `1px solid ${edgeScoreColor(d.edge)}30`,
                                                    }}
                                                >
                                                    {d.edge.toFixed(1)}{i === bestEdgeIdx && enriched.length > 1 ? " ★" : ""}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Dataset Performance Charts */}
                <div className="card rounded-2xl border border-white/5 bg-[#111118] p-5 mb-12">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Dataset Performance</p>
                        <select
                            value={previewIdx}
                            onChange={(e) => setPreviewIdx(Number(e.target.value))}
                            className="text-xs rounded-lg px-3 py-1.5 border border-white/10 bg-black/30 text-white focus:outline-none focus:border-indigo-500"
                        >
                            {enriched.map((d, i) => (
                                <option key={d.id} value={i}>{d.dsLabel}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <MiniChart
                            data={preview?.metrics_json?.equity_curve ?? []}
                            color="#818cf8"
                            label="Equity Curve"
                        />
                        <MiniChart
                            data={preview?.metrics_json?.drawdown_curve ?? []}
                            color="#f87171"
                            label="Drawdown Curve"
                        />
                    </div>
                </div>

                {/* Footer Branding */}
                <div className="text-center py-8 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    <p className="text-xs mb-1" style={{ color: "#4b5563" }}>Analyzed with</p>
                    <Link href="/" className="text-lg font-bold text-white hover:text-indigo-300 transition-colors">
                        NodoQuant
                    </Link>
                    <p className="text-xs mt-1 mb-4" style={{ color: "#6b7280" }}>Quant Strategy Lab</p>
                    <Link href="/analyzer" className="btn-primary text-sm inline-flex">
                        Analyze your strategy →
                    </Link>
                </div>
            </div>
        </div>
    );
}

function SummaryCard({ title, value, sub, color }: { title: string; value: string; sub: string; color: string }) {
    return (
        <div className="card rounded-xl p-4 border border-white/5 bg-[#111118]">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1">{title}</p>
            <p className="text-xl font-extrabold tabular-nums" style={{ color }}>{value}</p>
            <p className="text-xs text-gray-600 truncate mt-0.5">{sub}</p>
        </div>
    );
}

function SectionHeader({ title, desc, num }: { title: string; desc: string; num: string }) {
    return (
        <div className="mb-6 mt-2">
            <div className="flex items-center gap-3 mb-1">
                <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums"
                    style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8" }}
                >
                    {num}
                </span>
                <h2 className="text-lg font-bold text-white">{title}</h2>
            </div>
            <p className="text-xs text-gray-500 pl-10">{desc}</p>
        </div>
    );
}
