"use client";

interface RobustnessProps {
    datasets: {
        trades_count: number;
        winrate: number;
        profit_factor: number;
        max_drawdown: number;
        edge: number;
    }[];
}

interface DiagItem {
    label: string;
    status: string;
    color: string;
    tooltip: string;
    score: number; // 0–10 partial
}

function analyze(datasets: RobustnessProps["datasets"]): { items: DiagItem[]; robustnessScore: number } {
    const n = datasets.length;
    const pfs = datasets.map((d) => Number(d.profit_factor));
    const dds = datasets.map((d) => Number(d.max_drawdown));
    const edges = datasets.map((d) => d.edge);

    const items: DiagItem[] = [];

    // 1) Dataset Count
    const dcScore = n >= 4 ? 10 : n === 3 ? 7 : n === 2 ? 4 : 1;
    items.push({
        label: "Dataset Coverage",
        tooltip: "More datasets improve statistical confidence.",
        score: dcScore,
        ...(n >= 4
            ? { status: "High", color: "#34d399" }
            : n === 3
                ? { status: "Moderate", color: "#818cf8" }
                : n === 2
                    ? { status: "Low", color: "#fbbf24" }
                    : { status: "Insufficient", color: "#f87171" }),
    });

    // 2) Profit Factor Stability
    const avgPF = pfs.reduce((a, b) => a + b, 0) / n;
    const pfVar = avgPF > 0 ? (Math.max(...pfs) - Math.min(...pfs)) / avgPF : 999;
    const pfScore = pfVar < 0.3 ? 10 : pfVar <= 0.6 ? 6 : 2;
    items.push({
        label: "PF Stability",
        tooltip: `Variation: ${pfVar.toFixed(2)}. Lower means more consistent profit factor.`,
        score: pfScore,
        ...(pfVar < 0.3
            ? { status: "Stable", color: "#34d399" }
            : pfVar <= 0.6
                ? { status: "Moderate", color: "#818cf8" }
                : { status: "Unstable", color: "#f87171" }),
    });

    // 3) Edge Consistency
    const positiveEdge = edges.filter((e) => e >= 5).length;
    const edgeRatio = n > 0 ? positiveEdge / n : 0;
    const ecScore = edgeRatio >= 0.75 ? 10 : edgeRatio >= 0.5 ? 6 : 2;
    items.push({
        label: "Edge Consistency",
        tooltip: `${positiveEdge}/${n} datasets with Edge Score ≥ 5.`,
        score: ecScore,
        ...(edgeRatio >= 0.75
            ? { status: "Consistent", color: "#34d399" }
            : edgeRatio >= 0.5
                ? { status: "Moderate", color: "#818cf8" }
                : { status: "Weak", color: "#f87171" }),
    });

    // 4) Drawdown Stability
    const ddSpread = Math.max(...dds) - Math.min(...dds);
    const ddScore = ddSpread < 15 ? 10 : ddSpread <= 30 ? 6 : 2;
    items.push({
        label: "DD Stability",
        tooltip: `Spread: ${ddSpread.toFixed(1)}%. Lower means more consistent drawdown.`,
        score: ddScore,
        ...(ddSpread < 15
            ? { status: "Stable", color: "#34d399" }
            : ddSpread <= 30
                ? { status: "Moderate", color: "#818cf8" }
                : { status: "Unstable", color: "#f87171" }),
    });

    // Robustness Score (weighted: EC 40%, PF 30%, DD 20%, DC 10%)
    const robustnessScore = Math.min(10, Math.max(0,
        ecScore * 0.4 + pfScore * 0.3 + ddScore * 0.2 + dcScore * 0.1
    ));

    return { items, robustnessScore };
}

function robustnessLabel(s: number) {
    if (s >= 8) return "Robust Strategy";
    if (s >= 6) return "Moderate Robustness";
    if (s >= 4) return "Unstable Strategy";
    return "Overfit Risk";
}

function robustnessColor(s: number) {
    if (s >= 8) return "#34d399";
    if (s >= 6) return "#818cf8";
    if (s >= 4) return "#fbbf24";
    return "#f87171";
}

export default function StrategyRobustnessPanel({ datasets }: RobustnessProps) {
    if (datasets.length < 2) {
        return (
            <div>
                <div className="mb-4">
                    <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Strategy Robustness</p>
                    <p className="text-xs text-gray-600 mt-0.5">Cross-dataset consistency analysis.</p>
                </div>
                <div className="rounded-xl p-6 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <p className="text-sm text-gray-500">Requires at least 2 public datasets to evaluate robustness.</p>
                </div>
            </div>
        );
    }

    const { items, robustnessScore } = analyze(datasets);
    const color = robustnessColor(robustnessScore);
    const label = robustnessLabel(robustnessScore);

    return (
        <div>
            <div className="mb-4">
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Strategy Robustness</p>
                <p className="text-xs text-gray-600 mt-0.5">Cross-dataset consistency analysis.</p>
            </div>

            {/* Score Hero */}
            <div className="flex items-center gap-4 mb-5 px-4 py-3 rounded-xl"
                style={{ background: `${color}08`, border: `1px solid ${color}25` }}>
                <div
                    className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}12`, border: `2px solid ${color}40` }}
                    title="Robustness Score: composite of dataset coverage, PF stability, edge consistency, and drawdown stability."
                >
                    <span className="text-lg font-extrabold tabular-nums" style={{ color }}>
                        {robustnessScore.toFixed(1)}
                    </span>
                </div>
                <div>
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="text-xs text-gray-500">Based on {datasets.length} public datasets</p>
                </div>
            </div>

            {/* Diagnostic Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map((item) => (
                    <div
                        key={item.label}
                        className="flex items-center justify-between rounded-xl px-4 py-3"
                        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                        title={item.tooltip}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400">{item.label}</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" className="opacity-50 cursor-help">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="16" x2="12" y2="12" />
                                <line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                        </div>
                        <span
                            className="text-xs font-bold px-2.5 py-1 rounded-full"
                            style={{
                                background: `${item.color}15`,
                                color: item.color,
                                border: `1px solid ${item.color}30`,
                            }}
                        >
                            {item.status}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
