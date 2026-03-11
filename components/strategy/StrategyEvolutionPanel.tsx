"use client";

interface EvolutionDataset {
    created_at: string;
    winrate: number;
    profit_factor: number;
    max_drawdown: number;
    edge: number;
}

interface EvolutionProps {
    datasets: EvolutionDataset[];
}

interface TrendItem {
    label: string;
    status: string;
    color: string;
    arrow: string;
    tooltip: string;
}

function analyzeTrends(datasets: EvolutionDataset[]): TrendItem[] {
    // Sort by created_at ASC
    const sorted = [...datasets].sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const mid = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, mid);
    const lastHalf = sorted.slice(mid);

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

    const firstEdge = avg(firstHalf.map((d) => d.edge));
    const lastEdge = avg(lastHalf.map((d) => d.edge));
    const firstPF = avg(firstHalf.map((d) => Number(d.profit_factor)));
    const lastPF = avg(lastHalf.map((d) => Number(d.profit_factor)));
    const firstDD = avg(firstHalf.map((d) => Number(d.max_drawdown)));
    const lastDD = avg(lastHalf.map((d) => Number(d.max_drawdown)));
    const firstWR = avg(firstHalf.map((d) => Number(d.winrate)));
    const lastWR = avg(lastHalf.map((d) => Number(d.winrate)));

    const items: TrendItem[] = [];

    // Edge Trend
    const edgeDiff = lastEdge - firstEdge;
    items.push({
        label: "Edge Trend",
        tooltip: `Early avg: ${firstEdge.toFixed(1)} → Recent avg: ${lastEdge.toFixed(1)}`,
        ...(edgeDiff > 0.5
            ? { status: "Improving", color: "#34d399", arrow: "↑" }
            : edgeDiff < -0.5
                ? { status: "Degrading", color: "#f87171", arrow: "↓" }
                : { status: "Stable", color: "#818cf8", arrow: "→" }),
    });

    // Profit Factor Trend
    const pfDiff = lastPF - firstPF;
    items.push({
        label: "Profit Factor Trend",
        tooltip: `Early avg: ${firstPF.toFixed(2)} → Recent avg: ${lastPF.toFixed(2)}`,
        ...(pfDiff > 0.2
            ? { status: "Improving", color: "#34d399", arrow: "↑" }
            : pfDiff < -0.2
                ? { status: "Degrading", color: "#f87171", arrow: "↓" }
                : { status: "Stable", color: "#818cf8", arrow: "→" }),
    });

    // Drawdown Trend (lower is better)
    const ddDiff = lastDD - firstDD;
    items.push({
        label: "Risk Trend",
        tooltip: `Early avg DD: ${firstDD.toFixed(1)}% → Recent avg DD: ${lastDD.toFixed(1)}%`,
        ...(ddDiff < -5
            ? { status: "Improving", color: "#34d399", arrow: "↓" }
            : ddDiff > 5
                ? { status: "Worsening", color: "#f87171", arrow: "↑" }
                : { status: "Stable", color: "#818cf8", arrow: "→" }),
    });

    // Winrate Trend
    const wrDiff = lastWR - firstWR;
    items.push({
        label: "Winrate Trend",
        tooltip: `Early avg: ${firstWR.toFixed(1)}% → Recent avg: ${lastWR.toFixed(1)}%`,
        ...(wrDiff > 3
            ? { status: "Improving", color: "#34d399", arrow: "↑" }
            : wrDiff < -3
                ? { status: "Degrading", color: "#f87171", arrow: "↓" }
                : { status: "Stable", color: "#818cf8", arrow: "→" }),
    });

    return items;
}

export default function StrategyEvolutionPanel({ datasets }: EvolutionProps) {
    if (datasets.length < 2) {
        return (
            <div>
                <div className="mb-4">
                    <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Strategy Evolution</p>
                    <p className="text-xs text-gray-600 mt-0.5">Temporal trend analysis across datasets.</p>
                </div>
                <div className="rounded-xl p-6 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <p className="text-sm text-gray-500">Not enough datasets to evaluate strategy evolution.</p>
                </div>
            </div>
        );
    }

    const items = analyzeTrends(datasets);

    return (
        <div>
            <div className="mb-4">
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Strategy Evolution</p>
                <p className="text-xs text-gray-600 mt-0.5">Temporal trend analysis across datasets.</p>
            </div>
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
                            className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                            style={{
                                background: `${item.color}15`,
                                color: item.color,
                                border: `1px solid ${item.color}30`,
                            }}
                        >
                            {item.arrow} {item.status}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
