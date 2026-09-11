"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import FullReport from "@/components/analyzer/FullReport";
import type { FullMetrics } from "@/lib/analyzer/metrics";
import type { ReportMetricAvailability } from "@/lib/analyzer/publicReportMetrics";
import PersistedAdvancedSections from "@/components/report/PersistedAdvancedSections";

interface Props {
    reportId: string;
    metrics: FullMetrics;
    edgeConfidence: number | null;
    isPro: boolean;
    availability: ReportMetricAvailability;
}

export default function OwnerReportView({ reportId, metrics, edgeConfidence, isPro, availability }: Props) {
    const locale = useLocale();
    const t = useTranslations("analyzer.wizard");

    return (
        <main className="min-h-screen bg-[#050505] px-4 pb-24 pt-24 text-white">
            <article className="mx-auto max-w-4xl space-y-8" aria-labelledby="owner-report-title">
                <header className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-7">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-indigo-300">{t("report.eyebrow")}</p>
                    <h1 id="owner-report-title" className="mt-2 text-2xl font-black sm:text-3xl">{t("report.title")}</h1>
                    <p className="mt-2 text-sm text-gray-400">{t("report.subtitle")}</p>
                    <nav aria-label={t("report.navigationLabel")} className="mt-5 flex flex-col gap-3 sm:flex-row">
                        <Link href={`/${locale}/report/${reportId}`} className="btn-secondary w-full justify-center px-5 py-2.5 sm:w-auto">
                            {t("report.backToSummary")}
                        </Link>
                        <Link href={`/${locale}/analyzer`} className="btn-secondary w-full justify-center px-5 py-2.5 sm:w-auto">
                            {t("completion.analyzeAnother")}
                        </Link>
                    </nav>
                </header>
                <FullReport metrics={metrics} analysisId={reportId} isPro={isPro} edgeConfidenceOverride={edgeConfidence} savedDataAvailability={availability} />
                {isPro && <PersistedAdvancedSections metrics={metrics} availability={availability} />}
            </article>
        </main>
    );
}
