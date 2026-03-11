"use client";

interface HealthProps {
    winrate: number;
    profitFactor: number;
    drawdown: number;
    trades: number;
    edgeScore: number;
}

interface DiagItem {
    label: string;
    status: string;
    color: string;
    tooltip: string;
}

function diagnose({ winrate, profitFactor, drawdown, trades, edgeScore }: HealthProps): DiagItem[] {
    const items: DiagItem[] = [];

    // 1) Edge Strength
    items.push({
        label: "Edge Strength",
        tooltip: "Overall statistical edge based on composite score.",
        ...(edgeScore >= 8
            ? { status: "Strong", color: "#34d399" }
            : edgeScore >= 6
                ? { status: "Moderate", color: "#818cf8" }
                : edgeScore >= 4
                    ? { status: "Weak", color: "#fbbf24" }
                    : { status: "No Edge", color: "#f87171" }),
    });

    // 2) Sample Size
    items.push({
        label: "Sample Size",
        tooltip: "Number of trades determines statistical reliability.",
        ...(trades >= 300
            ? { status: "Large", color: "#34d399" }
            : trades >= 100
                ? { status: "Medium", color: "#818cf8" }
                : trades >= 50
                    ? { status: "Small", color: "#fbbf24" }
                    : { status: "Very Small", color: "#f87171" }),
    });

    // 3) Drawdown Risk
    items.push({
        label: "Drawdown Risk",
        tooltip: "Maximum equity decline risk assessment.",
        ...(drawdown < 20
            ? { status: "Low", color: "#34d399" }
            : drawdown <= 35
                ? { status: "Moderate", color: "#818cf8" }
                : drawdown <= 50
                    ? { status: "High", color: "#fbbf24" }
                    : { status: "Extreme", color: "#f87171" }),
    });

    // 4) Profit Quality
    items.push({
        label: "Profit Quality",
        tooltip: "Profit factor measures gross profit vs gross loss.",
        ...(profitFactor >= 2.5
            ? { status: "Excellent", color: "#34d399" }
            : profitFactor >= 2.0
                ? { status: "Strong", color: "#818cf8" }
                : profitFactor >= 1.5
                    ? { status: "Acceptable", color: "#fbbf24" }
                    : { status: profitFactor >= 1.2 ? "Weak" : "Poor", color: "#f87171" }),
    });

    // 5) Automation Suitability
    const highAuto = profitFactor >= 1.8 && trades >= 80 && drawdown < 50;
    const possAuto = profitFactor >= 1.4 && trades >= 50;
    items.push({
        label: "Automation Suitability",
        tooltip: "Estimates viability for algorithmic execution.",
        ...(highAuto
            ? { status: "High Potential", color: "#34d399" }
            : possAuto
                ? { status: "Possible", color: "#818cf8" }
                : { status: "Low Potential", color: "#fbbf24" }),
    });

    return items;
}

export default function StrategyHealthPanel(props: HealthProps) {
    const items = diagnose(props);

    return (
        <div>
            <div className="mb-4">
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Strategy Health</p>
                <p className="text-xs text-gray-600 mt-0.5">Automated statistical diagnosis of this strategy.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
