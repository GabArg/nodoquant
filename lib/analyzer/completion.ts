export type AnalysisSaveOutcome =
    | { status: "saved"; reportId: string }
    | { status: "duplicated"; reportId: string }
    | { status: "beta_limit"; existingReportId: string | null }
    | { status: "error" };

export function completionReportId(outcome: AnalysisSaveOutcome): string | null {
    if (outcome.status === "beta_limit") return outcome.existingReportId;
    if (outcome.status === "error") return null;
    return outcome.reportId;
}

export function completionReportHref(outcome: AnalysisSaveOutcome, locale: string): string | null {
    const reportId = completionReportId(outcome);
    return reportId ? `/${locale}/report/${reportId}` : null;
}
