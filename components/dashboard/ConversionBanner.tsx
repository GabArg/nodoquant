import Link from "next/link";

interface Props {
    bestScore: number | null;
    locale: string;
}

export default function ConversionBanner({ bestScore, locale }: Props) {
    if (bestScore === null) return null;

    let color = "#34d399";
    let bgStyle = "rgba(16,185,129,0.06)";
    let borderStyle = "rgba(16,185,129,0.2)";
    let label = "Strong Edge";

    if (bestScore < 40) {
        color = "#f87171";
        bgStyle = "rgba(239,68,68,0.06)";
        borderStyle = "rgba(239,68,68,0.2)";
        label = "Needs Improvement";
    } else if (bestScore < 70) {
        color = "#fbbf24";
        bgStyle = "rgba(251,191,36,0.06)";
        borderStyle = "rgba(251,191,36,0.2)";
        label = "Marginal Edge";
    }

    return (
        <div
            className="rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            style={{ background: bgStyle, border: `1px solid ${borderStyle}` }}
        >
            <div className="flex items-center gap-4">
                <div className="shrink-0 text-3xl font-black tabular-nums" style={{ color }}>
                    {Math.round(bestScore)}
                </div>
                <div>
                    <p className="text-sm font-bold text-white leading-tight">
                        Your best Strategy Score: <span style={{ color }}>{label}</span>
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>
                        Analyze more trades to refine your score and uncover statistical patterns.
                    </p>
                </div>
            </div>
            <Link
                href={`/${locale}/analyzer`}
                className="shrink-0 inline-flex items-center gap-2 text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition-all hover:scale-[1.02]"
                style={{
                    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                    boxShadow: "0 0 20px rgba(99,102,241,0.25)",
                }}
            >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                Analyze more trades
            </Link>
        </div>
    );
}
