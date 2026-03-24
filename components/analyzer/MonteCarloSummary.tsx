"use client";

import { useTranslations } from "next-intl";

interface Props {
    worstCase: number;
    averageCase: number;
    bestCase: number;
    riskOfRuin: number;
}

function formatMoney(val: number) {
    const isNegative = val < 0;
    const abs = Math.abs(val).toFixed(2);
    return isNegative ? `-$${abs}` : `+$${abs}`;
}

export default function MonteCarloSummary({ worstCase, averageCase, bestCase, riskOfRuin }: Props) {
    const t = useTranslations("analyzer.report.monteCarlo.labels");

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="card rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "#6b7280" }}>
                    {t("worst")}
                </p>
                <p className="text-xl font-bold tabular-nums" style={{ color: worstCase < 0 ? "#f87171" : "#34d399" }}>
                    {formatMoney(worstCase)}
                </p>
            </div>

            <div className="card rounded-xl p-5" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "#818cf8" }}>
                    {t("average")}
                </p>
                <p className="text-xl font-bold tabular-nums text-white">
                    {formatMoney(averageCase)}
                </p>
            </div>

            <div className="card rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "#6b7280" }}>
                    {t("best")}
                </p>
                <p className="text-xl font-bold tabular-nums text-white">
                    {formatMoney(bestCase)}
                </p>
            </div>

            <div className="card rounded-xl p-5" style={{ background: riskOfRuin > 10 ? "rgba(239,68,68,0.08)" : "var(--bg-card)", border: riskOfRuin > 10 ? "1px solid rgba(239,68,68,0.2)" : "1px solid var(--border)" }}>
                <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: riskOfRuin > 10 ? "#fca5a5" : "#6b7280" }}>
                    {t("riskOfRuin")}
                </p>
                <p className="text-xl font-bold tabular-nums" style={{ color: riskOfRuin > 10 ? "#f87171" : "#e5e7eb" }}>
                    {riskOfRuin.toFixed(1)}%
                </p>
            </div>
        </div>
    );
}
