import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import es from "../../messages/es.json";
import en from "../../messages/en.json";
import { getCanonicalDiagnosis, isNegativeDiagnosis } from "../../lib/analyzer/diagnosis";
import { getPublicReportDiagnosis, normalizePublicReportMetrics } from "../../lib/analyzer/publicReportMetrics";

const strongReport = {
    trades_count: 140,
    winrate: 64.3,
    profit_factor: 2.49,
    max_drawdown: 0.7,
    sum_profit: 140,
    metrics_json: {
        basic: {
            totalTrades: 140,
            winrate: 64.3,
            profitFactor: 2.49,
            maxDrawdown: 0.7,
            maxDrawdownAbs: 0.7,
            expectancy: 1,
            sumProfit: 140,
        },
    },
};

describe("public report diagnosis", () => {
    it("keeps a reduced strong-edge payload positive and aligned with Analyzer", () => {
        const normalized = normalizePublicReportMetrics(strongReport);
        const publicVerdict = getPublicReportDiagnosis(strongReport);

        expect(publicVerdict).toBe("strongEdge");
        expect(publicVerdict).toBe(getCanonicalDiagnosis(normalized.metrics, normalized.metrics));
        expect(isNegativeDiagnosis(publicVerdict)).toBe(false);
        expect(normalized.edgeConfidence).toBeNull();
        expect(normalized.strategyScore).toBeNull();
    });

    it.each([
        ["noEdge", { ...strongReport, profit_factor: 0.8, sum_profit: -10, metrics_json: { basic: { expectancy: -1 } } }],
        ["unstableEdge", { ...strongReport, profit_factor: 1.05, sum_profit: 10, metrics_json: { basic: { expectancy: 0.1 } } }],
    ])("allows a negative warning for %s", (_label, report) => {
        expect(isNegativeDiagnosis(getPublicReportDiagnosis(report))).toBe(true);
    });

    it("honors a persisted advanced verdict before the deterministic fallback", () => {
        const report = { ...strongReport, metrics_json: { advanced: { verdict: "weakEdge" } } };
        expect(getPublicReportDiagnosis(report)).toBe("weakEdge");
    });

    it("uses one persisted Edge Confidence value without substituting Strategy Score", () => {
        const normalized = normalizePublicReportMetrics({
            ...strongReport,
            metrics_json: { advanced: { verdict: "strongEdge", edgeConfidence: 99 } },
        });

        expect(normalized.edgeConfidence).toBe(99);
        expect(normalized.strategyScore).toBeNull();
        expect(normalized.metrics.advanced?.edgeConfidence).toBe(99);
    });
});

describe("public report translations", () => {
    it.each([["es", es], ["en", en]])("defines every visible key for %s", (_locale, messages) => {
        const publicReport = messages.publicReport;
        const visibleValues = [
            publicReport.header.title,
            publicReport.header.subtitle,
            publicReport.diagnosis.positive,
            publicReport.diagnosis.negative,
            publicReport.diagnosis.insufficient,
            publicReport.ctaTitle,
            publicReport.ctaSubtitle,
            publicReport.ctaWarning,
            publicReport.ownerCta,
            publicReport.visitorCta,
            publicReport.urgency,
            publicReport.cta,
            publicReport.socialProof,
            publicReport.poweredBy,
        ];

        expect(visibleValues.every(value => typeof value === "string" && value.length > 0)).toBe(true);
        expect(visibleValues.some(value => value.includes("publicReport."))).toBe(false);
    });

    it("labels advanced edge confidence distinctly from Strategy Score", () => {
        expect(es.analyzer.report.diagnosis.scoreTitle).toBe("Confianza del edge");
        expect(en.analyzer.report.diagnosis.scoreTitle).toBe("Edge Confidence");
        expect(es.analyzer.report.diagnosis.scoreUnavailable).toBe("No disponible en este análisis guardado");
        expect(en.analyzer.report.diagnosis.scoreUnavailable).toBe("Not available in this saved analysis");
        expect(es.analyzer.funnel.incompleteResult).toBe("Resultado");
        expect(en.analyzer.funnel.incompleteResult).toBe("Result");
        expect(es.analyzer.report.diagnosis.scoreTitle).not.toMatch(/strategy score/i);
        expect(en.analyzer.report.diagnosis.scoreTitle).not.toMatch(/strategy score/i);
    });
});

describe("BasicResults missing Edge Confidence presentation", () => {
    it("renders saved-analysis absence as secondary copy, not as the large metric value", () => {
        const source = readFileSync("components/analyzer/BasicResults.tsx", "utf8");

        expect(source).toContain("unavailableText: edgeConfidence === null");
        expect(source).toContain("m.unavailableText ? (");
        expect(source).not.toContain('value: edgeConfidence === null ? (locale === "es" ? "No disponible"');
    });
});
