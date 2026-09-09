"use client";

import React, { useEffect } from "react";
import BasicResults from "@/components/analyzer/BasicResults";
import FullReport from "@/components/analyzer/FullReport";
import type {
    BasicMetrics,
    DiagnosisVerdict,
    FullMetrics,
} from "@/lib/analyzer/metrics";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { trackEvent } from "@/lib/trackEvent";
import { getCanonicalDiagnosis, isNegativeDiagnosis } from "@/lib/analyzer/diagnosis";
import { normalizePublicReportMetrics } from "@/lib/analyzer/publicReportMetrics";

type PublicReportMetrics = FullMetrics & {
    score?: number;
    verdict?: DiagnosisVerdict;
};

interface PublicReportProps {
    id: string;
    file_name: string | null;
    trades_count: number;
    winrate: number;
    profit_factor: number;
    max_drawdown: number;
    sum_profit: number;
    metrics_json: PublicReportMetrics;
    created_at: string;
}

export default function PublicReportView({
    report,
}: {
    report: PublicReportProps;
}) {
    const t = useTranslations("publicReport");
    const locale = useLocale();
    const normalizedMetrics = normalizePublicReportMetrics(report);
    const reportScore = normalizedMetrics.advanced?.edgeConfidence ?? report.metrics_json?.score;
    const reportVerdict = getCanonicalDiagnosis(normalizedMetrics, normalizedMetrics);
    const showNegativeWarning = isNegativeDiagnosis(reportVerdict);

    useEffect(() => {
        const analyticsData = {
            report_id: report.id,
            score: reportScore,
            verdict: reportVerdict,
        };

        trackEvent("REPORT_VIEW", analyticsData);
    }, [report.id, reportScore, reportVerdict]);

    const basicMetrics: BasicMetrics = normalizedMetrics;

    return (
        <div className="w-full min-h-screen bg-[#050505] text-white pt-24 pb-32">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-16">
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-sm">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded bg-indigo-500/20 text-indigo-400">
                            👁️
                        </span>
                        <div>
                            <p className="font-semibold text-indigo-100">
                                {t("header.title")}
                            </p>
                            <p className="text-[10px] text-indigo-300">
                                {t("header.subtitle")}
                            </p>
                        </div>
                    </div>
                </div>

                <BasicResults
                    metrics={basicMetrics}
                    fullMetrics={normalizedMetrics}
                    format="ANALYSIS"
                    fileName={
                        report.file_name || t("defaultFileName")
                    }
                    trades={[]}
                    onViewFullReport={async () => {
                        await trackEvent(
                            "CTA_CLICK_BASIC_RESULTS",
                            {
                                report_id: report.id,
                                score: reportScore,
                                verdict: reportVerdict,
                            }
                        );
                        document.getElementById("beta-report-details")?.scrollIntoView({ behavior: "smooth" });
                    }}
                />

                <div className={`text-center p-4 rounded-xl relative overflow-hidden -mt-8 border ${showNegativeWarning ? "border-red-500/20 bg-red-500/5" : reportVerdict === "insufficientSample" ? "border-gray-500/20 bg-gray-500/5" : "border-emerald-500/20 bg-emerald-500/5"}`}>
                    <div className={`relative font-medium text-sm md:text-base ${showNegativeWarning ? "text-red-100" : "text-gray-100"}`}>
                        {t.rich(showNegativeWarning ? "diagnosis.negative" : reportVerdict === "insufficientSample" ? "diagnosis.insufficient" : "diagnosis.positive", {
                            bold: (chunks) => (
                                <strong className={showNegativeWarning ? "text-red-400 italic font-black" : "text-emerald-400 italic font-black"}>
                                    {chunks}
                                </strong>
                            ),
                        })}
                    </div>
                </div>

                <div id="beta-report-details" className="mt-16">
                    <FullReport
                        metrics={normalizedMetrics}
                        analysisId={report.id}
                        isPro={false}
                    />
                </div>

                <div className="mt-32 pt-16 border-t border-white/5 flex flex-col items-center text-center space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.3)] mb-2">
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2.5"
                        >
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" />
                        </svg>
                    </div>

                    <h2 className="text-2xl sm:text-4xl font-black italic tracking-tight text-white mb-2 leading-none uppercase">
                        {t("ctaTitle")}{" "}
                        <br className="hidden sm:block" />
                        <span className="text-indigo-400">
                            {t("ctaSubtitle")}
                        </span>
                    </h2>

                    <p className="text-sm text-gray-400 max-w-lg mx-auto leading-relaxed font-medium">
                        {t("urgency")}
                    </p>

                    <div className="pt-6 flex flex-col items-center gap-2 w-full sm:w-auto">
                        <Link
                            href={`/${locale}/analyzer`}
                            className="px-10 py-5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_10px_40px_-10px_rgba(99,102,241,0.6)] hover:scale-105 transition-all active:scale-95"
                        >
                            {t("cta")}
                        </Link>

                        <div className="flex flex-col items-center mt-6">
                            <span className="opacity-40 text-xs font-semibold text-gray-300 tracking-wider">
                                {t("socialProof")}
                            </span>
                            <Link
                                href="/"
                                className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600 hover:text-indigo-400 mt-3 transition-colors"
                            >
                                {t("poweredBy")}
                            </Link>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
