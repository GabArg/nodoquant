export type AnalysisSaveOutcome =
    | { status: "saved"; reportId: string }
    | { status: "duplicated"; reportId: string }
    | { status: "beta_limit"; existingReportId: string | null };

export function completionReportId(outcome: AnalysisSaveOutcome): string | null {
    return outcome.status === "beta_limit" ? outcome.existingReportId : outcome.reportId;
}

export function completionReportHref(outcome: AnalysisSaveOutcome, locale: string): string | null {
    const reportId = completionReportId(outcome);
    return reportId ? `/${locale}/report/${reportId}` : null;
}
