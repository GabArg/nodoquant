"use client";

import { useTranslations } from "next-intl";
import type { FullMetrics } from "@/lib/analyzer/metrics";
import type { ReportMetricAvailability } from "@/lib/analyzer/publicReportMetrics";

export default function PersistedAdvancedSections({ metrics, availability }: { metrics: FullMetrics; availability: ReportMetricAvailability }) {
    const t = useTranslations("analyzer.report.persisted");
    const unavailable = t("unavailable");

    return (
        <div className="space-y-8">
            <section className="rounded-3xl border border-white/5 bg-white/[0.01] p-6 sm:p-8">
                <h2 className="text-xs font-black uppercase tracking-[0.25em] text-indigo-400">{t("intelligenceTitle")}</h2>
                {availability.intelligence && metrics.advanced ? (
                    <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <Metric label="SQN" value={formatNumber(metrics.advanced.sqn, unavailable)} />
                        <Metric label="Z-Score" value={formatNumber(metrics.advanced.zScore, unavailable)} />
                        <Metric label={t("robustness")} value={metrics.advanced.robustnessLevel ?? unavailable} />
                        {metrics.edgeDecay && <Metric label={t("edgeHealth")} value={formatPercent(metrics.edgeDecay.score, unavailable)} />}
                    </dl>
                ) : <p className="mt-4 text-sm text-gray-400">{unavailable}</p>}
            </section>
        </div>
    );
}

function formatNumber(value: unknown, unavailable: string) {
    return typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : unavailable;
}

function formatPercent(value: unknown, unavailable: string) {
    return typeof value === "number" && Number.isFinite(value) ? `${value}%` : unavailable;
}

function Metric({ label, value }: { label: string; value: string }) {
    return <div><dt className="text-[10px] uppercase tracking-wide text-gray-500">{label}</dt><dd className="mt-1 text-xl font-black text-white">{value}</dd></div>;
}
