import type { BasicMetrics, DiagnosisVerdict, FullMetrics } from "./metrics";

export function getCanonicalDiagnosis(
    metrics: BasicMetrics,
    fullMetrics?: FullMetrics
): DiagnosisVerdict {
    if (fullMetrics?.advanced?.verdict) return fullMetrics.advanced.verdict;

    if (metrics.totalTrades < 30) return "insufficientSample";
    if (metrics.profitFactor < 1 || metrics.expectancy <= 0) return "noEdge";
    if (metrics.profitFactor >= 1.3 && metrics.totalTrades >= 100) return "strongEdge";
    if (metrics.profitFactor >= 1.1) return "weakEdge";
    return "unstableEdge";
}

export function isNegativeDiagnosis(verdict: DiagnosisVerdict): boolean {
    return verdict === "noEdge" || verdict === "unstableEdge";
}
