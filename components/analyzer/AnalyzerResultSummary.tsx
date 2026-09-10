"use client";

import type { BasicMetrics, DiagnosisVerdict, FullMetrics } from "@/lib/analyzer/metrics";
import type { AnalysisSaveOutcome } from "@/lib/analyzer/completion";
import { useTranslations } from "next-intl";

interface Props {
    metrics: BasicMetrics;
    fullMetrics: FullMetrics;
    diagnosis: DiagnosisVerdict;
    saveOutcome: AnalysisSaveOutcome;
    onViewReport: () => void;
    onAnalyzeAnother: () => void;
    onViewSavedReport: () => void;
}

export default function AnalyzerResultSummary({ metrics, fullMetrics, diagnosis, saveOutcome, onViewReport, onAnalyzeAnother, onViewSavedReport }: Props) {
    const t = useTranslations("analyzer.wizard.completion");
    const edgeConfidence = fullMetrics.advanced?.edgeConfidence;
    const isPositive = diagnosis === "strongEdge" || diagnosis === "weakEdge";
    const canOpenCurrentReport = saveOutcome.status === "saved" || saveOutcome.status === "duplicated";
    const canOpenSavedReport = saveOutcome.status === "beta_limit" && Boolean(saveOutcome.existingReportId);

    const metricsToShow = [
        { label: t("profitFactor"), value: metrics.profitFactor.toFixed(2) },
        ...(edgeConfidence == null ? [] : [{ label: t("edgeConfidence"), value: `${Math.round(edgeConfidence)}/100` }]),
        { label: t("maxDrawdown"), value: `${Math.abs(metrics.maxDrawdown).toFixed(1)}%` },
        { label: t("winRate"), value: `${metrics.winrate.toFixed(1)}%` },
        { label: t("trades"), value: String(metrics.totalTrades) },
    ];

    return (
        <section aria-labelledby="analysis-result-title" className="min-h-[calc(100vh-13rem)] flex items-start sm:items-center animate-fade-in">
            <div className="w-full rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.055] to-white/[0.02] p-5 sm:p-8 shadow-2xl shadow-black/20">
                <header className="mb-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-indigo-300">{t("eyebrow")}</p>
                    <h2 id="analysis-result-title" className="mt-2 text-2xl sm:text-3xl font-black text-white">{t("title")}</h2>
                    <p className="mt-2 text-sm text-gray-400">{t("processed", { count: metrics.totalTrades })}</p>
                </header>

                <div className={`rounded-2xl border p-5 sm:p-6 ${isPositive ? "border-emerald-500/25 bg-emerald-500/[0.07]" : "border-amber-500/25 bg-amber-500/[0.06]"}`}>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">{t("diagnosis")}</p>
                    <p className={`mt-2 text-2xl sm:text-4xl font-black uppercase tracking-tight ${isPositive ? "text-emerald-300" : "text-amber-300"}`}>
                        {t(`verdicts.${diagnosis}`)}
                    </p>
                    <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
                        {metricsToShow.map((metric) => (
                            <div key={metric.label} className="rounded-xl bg-black/20 px-3 py-3">
                                <dt className="text-[10px] uppercase tracking-wide text-gray-500">{metric.label}</dt>
                                <dd className="mt-1 text-lg font-black text-white">{metric.value}</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                <div role="status" className={`mt-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${saveOutcome.status === "saved" || saveOutcome.status === "duplicated" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-100" : "border-amber-500/20 bg-amber-500/5 text-amber-100"}`}>
                    <span aria-hidden="true" className="font-black">{saveOutcome.status === "saved" || saveOutcome.status === "duplicated" ? "✓" : "!"}</span>
                    <span>{t(`status.${saveOutcome.status}`)}</span>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    {canOpenCurrentReport && (
                        <button type="button" onClick={onViewReport} className="btn-primary w-full sm:w-auto justify-center px-7 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400">
                            {t("viewReport")}
                        </button>
                    )}
                    {canOpenSavedReport && (
                        <button type="button" onClick={onViewSavedReport} className="btn-primary w-full sm:w-auto justify-center px-7 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400">
                            {t("viewSaved")}
                        </button>
                    )}
                    <button type="button" onClick={onAnalyzeAnother} className="btn-secondary w-full sm:w-auto justify-center px-7 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                        {t("analyzeAnother")}
                    </button>
                </div>
            </div>
        </section>
    );
}
