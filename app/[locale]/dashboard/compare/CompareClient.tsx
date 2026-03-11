"use client";

import { useState, useRef, useEffect } from "react";

interface Analysis {
    id: string;
    strategy_id: string | null;
    dataset_name: string | null;
    file_name: string | null;
    trades_count: number;
    winrate: number;
    profit_factor: number;
    max_drawdown: number;
    metrics_json: any;
    created_at: string;
    strategies: { name: string } | null;
}

// ── Edge Score v2 (same logic as public report) ──
function calcEdgeScore(wr: number, pf: number, dd: number, n: number): number {
    let s = 0;
    s += pf >= 2 ? 3.5 : pf >= 1.5 ? 3 : pf >= 1.2 ? 2 : pf >= 1 ? 1 : 0;
    s += wr > 60 ? 2 : wr >= 55 ? 1.5 : wr >= 50 ? 1 : wr >= 40 ? 0.5 : 0;
    s += dd < 10 ? 2.5 : dd <= 20 ? 2 : dd <= 30 ? 1.5 : dd <= 40 ? 1 : dd <= 50 ? 0.5 : 0;
    s += n > 300 ? 2 : n >= 100 ? 1.5 : n >= 60 ? 1 : n >= 30 ? 0.5 : 0;
    return Math.min(10, Math.max(0, s));
}

const COLORS = ["#818cf8", "#34d399", "#fbbf24", "#f87171"];

function edgeScoreColor(score: number): string {
    if (score >= 8) return "#34d399";
    if (score >= 6) return "#818cf8";
    if (score >= 4) return "#fbbf24";
    return "#f87171";
}

let _dsCounter = 0;
const _dsMap = new Map<string, number>();

function label(a: Analysis, index?: number) {
    const strat = a.strategies?.name || "Strategy Report";
    let ds = a.dataset_name || a.file_name;
    if (!ds) {
        if (!_dsMap.has(a.id)) {
            _dsCounter++;
            _dsMap.set(a.id, _dsCounter);
        }
        ds = `Dataset #${_dsMap.get(a.id)}`;
    }
    return { strat, ds, full: `${strat} — ${ds}` };
}

// ── Canvas overlay chart ──
function OverlayChart({ datasets, title, yLabel }: {
    datasets: { data: number[]; color: string; label: string }[];
    title: string;
    yLabel?: string;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        const W = rect.width;
        const H = rect.height;
        const PAD_L = 50, PAD_R = 16, PAD_T = 10, PAD_B = 24;

        ctx.clearRect(0, 0, W, H);

        // Find global min/max
        let allMin = Infinity, allMax = -Infinity;
        for (const ds of datasets) {
            for (const v of ds.data) {
                if (v < allMin) allMin = v;
                if (v > allMax) allMax = v;
            }
        }
        if (allMin === allMax) { allMin -= 1; allMax += 1; }
        const range = allMax - allMin;

        // Y axis grid
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.fillStyle = "#4b5563";
        ctx.font = "10px system-ui";
        ctx.textAlign = "right";
        for (let i = 0; i <= 4; i++) {
            const val = allMin + (range * i) / 4;
            const y = PAD_T + (H - PAD_T - PAD_B) * (1 - (val - allMin) / range);
            ctx.beginPath();
            ctx.moveTo(PAD_L, y);
            ctx.lineTo(W - PAD_R, y);
            ctx.stroke();
            ctx.fillText(val.toFixed(0), PAD_L - 6, y + 3);
        }

        // Draw lines
        for (const ds of datasets) {
            if (ds.data.length < 2) continue;
            const maxLen = ds.data.length;
            ctx.beginPath();
            ctx.strokeStyle = ds.color;
            ctx.lineWidth = 1.5;
            for (let i = 0; i < maxLen; i++) {
                const x = PAD_L + ((W - PAD_L - PAD_R) * i) / (maxLen - 1);
                const y = PAD_T + (H - PAD_T - PAD_B) * (1 - (ds.data[i] - allMin) / range);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
    }, [datasets]);

    return (
        <div>
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">{title}</p>
            <canvas
                ref={canvasRef}
                style={{ width: "100%", height: 200, display: "block" }}
            />
            <div className="flex flex-wrap gap-3 mt-2">
                {datasets.map((ds, i) => (
                    <span key={i} className="flex items-center gap-1.5 text-xs text-gray-400">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: ds.color }} />
                        {ds.label}
                    </span>
                ))}
            </div>
        </div>
    );
}

// ── Main Compare Client ──
export default function CompareClient({ analyses }: { analyses: Analysis[] }) {
    const [selected, setSelected] = useState<string[]>([]);

    function toggle(id: string) {
        setSelected((prev) => {
            if (prev.includes(id)) return prev.filter((x) => x !== id);
            if (prev.length >= 4) return prev;
            return [...prev, id];
        });
    }

    const compared = analyses.filter((a) => selected.includes(a.id));

    // Metrics for comparison
    const metrics = compared.map((a) => ({
        ...a,
        edge: calcEdgeScore(Number(a.winrate), Number(a.profit_factor), Number(a.max_drawdown), a.trades_count),
        expectancy: a.metrics_json?.basic?.expectancy ?? a.metrics_json?.expectancy ?? 0,
    }));

    // Best value helpers
    function bestIdx(values: number[], lower = false) {
        if (values.length === 0) return -1;
        let best = 0;
        for (let i = 1; i < values.length; i++) {
            if (lower ? values[i] < values[best] : values[i] > values[best]) best = i;
        }
        return best;
    }

    const rows: { label: string; key: string; format: (v: number) => string; lower?: boolean }[] = [
        { label: "Trades", key: "trades_count", format: (v) => String(v) },
        { label: "Winrate", key: "winrate", format: (v) => `${Number(v).toFixed(1)}%` },
        { label: "Profit Factor", key: "profit_factor", format: (v) => Number(v).toFixed(2) },
        { label: "Expectancy", key: "expectancy", format: (v) => `$${Number(v).toFixed(2)}` },
        { label: "Max Drawdown", key: "max_drawdown", format: (v) => `${Number(v).toFixed(1)}%`, lower: true },
        { label: "Edge Score", key: "edge", format: (v) => v.toFixed(1) },
    ];

    // Rankings
    const rankings = metrics.length >= 2 ? [
        { title: "Best Edge Score", idx: bestIdx(metrics.map((m) => m.edge)), val: (m: any) => m.edge.toFixed(1) },
        { title: "Lowest Drawdown", idx: bestIdx(metrics.map((m) => Number(m.max_drawdown)), true), val: (m: any) => `${Number(m.max_drawdown).toFixed(1)}%` },
        { title: "Highest PF", idx: bestIdx(metrics.map((m) => Number(m.profit_factor))), val: (m: any) => Number(m.profit_factor).toFixed(2) },
    ] : [];

    return (
        <div className="space-y-8">
            {/* Selector */}
            <div className="card rounded-2xl p-5 border border-white/5 bg-[#111118]">
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">
                    Seleccionar análisis ({selected.length}/4)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                    {analyses.map((a) => {
                        const l = label(a);
                        const checked = selected.includes(a.id);
                        const edge = calcEdgeScore(Number(a.winrate), Number(a.profit_factor), Number(a.max_drawdown), a.trades_count);
                        return (
                            <label
                                key={a.id}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
                                style={{
                                    background: checked ? "rgba(99,102,241,0.08)" : "transparent",
                                    border: `1px solid ${checked ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.05)"}`,
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggle(a.id)}
                                    disabled={!checked && selected.length >= 4}
                                    className="form-checkbox"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white font-medium truncate">{l.strat}</p>
                                    <p className="text-xs text-gray-500 truncate">{l.ds} · {a.trades_count} trades</p>
                                </div>
                                <span className="text-xs font-bold tabular-nums" style={{ color: edgeScoreColor(edge) }}>
                                    {edge.toFixed(1)}
                                </span>
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* Comparison Results */}
            {compared.length >= 2 && (
                <>
                    {/* Rankings */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {rankings.map((r) => {
                            const m = metrics[r.idx];
                            if (!m) return null;
                            const l = label(m);
                            return (
                                <div key={r.title} className="card rounded-xl p-4 border border-white/5 bg-[#111118]">
                                    <p className="text-xs text-gray-500 mb-1">{r.title}</p>
                                    <p className="text-sm font-bold text-white">{l.strat}</p>
                                    <p className="text-lg font-extrabold text-indigo-400 tabular-nums">{r.val(m)}</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Table */}
                    <div className="card rounded-2xl border border-white/5 bg-[#111118] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-300">
                                <thead className="bg-black/20 text-xs uppercase font-medium text-gray-500 border-b border-white/5">
                                    <tr>
                                        <th className="px-5 py-4">Métrica</th>
                                        {metrics.map((m, i) => {
                                            const l = label(m);
                                            return (
                                                <th key={m.id} className="px-5 py-4 text-right">
                                                    <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: COLORS[i] }} />
                                                    <span className="text-white">{l.strat}</span>
                                                    <br />
                                                    <span className="text-gray-500 font-normal normal-case">{l.ds}</span>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {rows.map((row) => {
                                        const values = metrics.map((m: any) => Number(m[row.key]));
                                        const best = bestIdx(values, row.lower);
                                        return (
                                            <tr key={row.key}>
                                                <td className="px-5 py-3 text-gray-400">{row.label}</td>
                                                {values.map((v, i) => {
                                                    const isBest = i === best;
                                                    // Edge Score row uses dynamic color
                                                    const cellColor = row.key === "edge"
                                                        ? edgeScoreColor(v)
                                                        : isBest ? "#34d399" : "#d1d5db";
                                                    return (
                                                        <td
                                                            key={i}
                                                            className="px-5 py-3 text-right tabular-nums"
                                                            style={{
                                                                color: cellColor,
                                                                fontWeight: isBest ? 700 : 500,
                                                            }}
                                                        >
                                                            {row.format(v)}
                                                            {isBest && " ★"}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Equity Curve Overlay */}
                    <div className="card rounded-2xl p-5 border border-white/5 bg-[#111118]">
                        <OverlayChart
                            title="Equity Curve Comparison"
                            datasets={metrics.map((m, i) => {
                                const l = label(m);
                                return {
                                    data: m.metrics_json?.equity_curve ?? [],
                                    color: COLORS[i],
                                    label: `${l.strat} — ${l.ds}`,
                                };
                            })}
                        />
                    </div>

                    {/* Drawdown Curve Overlay */}
                    <div className="card rounded-2xl p-5 border border-white/5 bg-[#111118]">
                        <OverlayChart
                            title="Drawdown Curve Comparison"
                            datasets={metrics.map((m, i) => {
                                const l = label(m);
                                return {
                                    data: m.metrics_json?.drawdown_curve ?? [],
                                    color: COLORS[i],
                                    label: `${l.strat} — ${l.ds}`,
                                };
                            })}
                        />
                    </div>
                </>
            )}

            {compared.length === 1 && (
                <div className="card rounded-2xl p-8 border border-white/5 bg-[#111118] text-center">
                    <p className="text-gray-500">Seleccioná al menos un análisis más para comparar.</p>
                </div>
            )}
        </div>
    );
}
