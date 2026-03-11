"use client";

interface ConfidenceProps {
    totalTrades: number;
    datasetCount: number;
    oldestDate: string;
    newestDate: string;
}

function monthSpan(oldest: string, newest: string): number {
    const a = new Date(oldest);
    const b = new Date(newest);
    return Math.max(0, (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()));
}

export function calcConfidence(props: ConfidenceProps): { level: "High" | "Medium" | "Low"; color: string; score: number; details: string[] } {
    const { totalTrades, datasetCount, oldestDate, newestDate } = props;
    const span = monthSpan(oldestDate, newestDate);

    let score = 0;
    const details: string[] = [];

    // Trades component (0–4)
    if (totalTrades >= 500) { score += 4; details.push(`${totalTrades} trades`); }
    else if (totalTrades >= 200) { score += 3; details.push(`${totalTrades} trades`); }
    else if (totalTrades >= 100) { score += 2; details.push(`${totalTrades} trades`); }
    else if (totalTrades >= 50) { score += 1; details.push(`${totalTrades} trades (small)`); }
    else { details.push(`${totalTrades} trades (very low)`); }

    // Datasets component (0–3)
    if (datasetCount >= 4) { score += 3; details.push(`${datasetCount} datasets`); }
    else if (datasetCount >= 2) { score += 2; details.push(`${datasetCount} datasets`); }
    else { score += 1; details.push(`${datasetCount} dataset`); }

    // Time span component (0–3)
    if (span >= 12) { score += 3; details.push(`${span} month span`); }
    else if (span >= 6) { score += 2; details.push(`${span} month span`); }
    else { score += 1; details.push(`${span || "<1"} month span`); }

    // Market regime bonus: +1 if data spans multiple cycles (≥12 months)
    if (span >= 12) { score += 1; details.push("multi-cycle bonus"); }

    // Total: 3–10
    const level = score >= 8 ? "High" : score >= 5 ? "Medium" : "Low";
    const color = score >= 8 ? "#34d399" : score >= 5 ? "#818cf8" : "#fbbf24";

    return { level, color, score, details };
}

export interface ConfidenceResult {
    level: "High" | "Medium" | "Low";
    color: string;
    score: number;
    maxScore: number;
    details: string[];
}

// Cross-reference Quant × Confidence
function interpret(quantScore: number, confLevel: "High" | "Medium" | "Low"): { text: string; color: string } {
    if (quantScore >= 7 && confLevel === "High") return { text: "Strong edge, well validated", color: "#34d399" };
    if (quantScore >= 7 && confLevel === "Medium") return { text: "Promising edge, needs more data", color: "#818cf8" };
    if (quantScore >= 7 && confLevel === "Low") return { text: "High score but possible overfit", color: "#fbbf24" };
    if (quantScore >= 5 && confLevel === "High") return { text: "Moderate edge, solid evidence", color: "#818cf8" };
    if (quantScore >= 5 && confLevel === "Medium") return { text: "Moderate signal, more data recommended", color: "#fbbf24" };
    if (quantScore >= 5) return { text: "Weak signal, insufficient evidence", color: "#f87171" };
    if (confLevel === "High") return { text: "No edge despite strong data — review strategy", color: "#f87171" };
    return { text: "Insufficient data and weak signal", color: "#f87171" };
}

export default function ConfidenceIndicator(props: ConfidenceProps & { quantScore?: number }) {
    const MAX = 11;
    const { level, color, score, details } = calcConfidence(props);
    const pct = Math.min(100, (score / MAX) * 100);
    const interp = props.quantScore !== undefined ? interpret(props.quantScore, level) : null;

    return (
        <div
            className="rounded-xl px-4 py-3"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
            title={details.join(" · ")}
        >
            <div className="flex items-center gap-3 mb-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold flex-1">Confidence</p>
                <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{
                        background: `${color}15`,
                        color,
                        border: `1px solid ${color}30`,
                    }}
                >
                    {level}
                </span>
            </div>
            {/* Progress bar */}
            <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                </div>
                <span className="text-xs tabular-nums text-gray-600">{score}/{MAX}</span>
            </div>
            {/* Quant × Confidence interpretation */}
            {interp && (
                <p className="text-xs mt-2" style={{ color: interp.color }}>
                    {interp.text}
                </p>
            )}
            <p className="text-[10px] text-gray-600 mt-2">
                Statistical confidence derived from number of trades, datasets and time span, essential for trading strategy evaluation.
            </p>
        </div>
    );
}
