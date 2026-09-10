import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const wizard = readFileSync("components/analyzer/AnalyzerWizard.tsx", "utf8");
const summary = readFileSync("components/analyzer/AnalyzerResultSummary.tsx", "utf8");
const reportSources = ["components/analyzer/FullReport.tsx", "components/analyzer/StrategyDiagnostics.tsx"].map((path) => readFileSync(path, "utf8")).join("\n");
const es = JSON.parse(readFileSync("messages/es.json", "utf8"));
const en = JSON.parse(readFileSync("messages/en.json", "utf8"));

describe("guided analyzer flow", () => {
    it.each([[es, ["Subir", "Revisar", "Resultado", "Reporte"]], [en, ["Upload", "Review", "Result", "Report"]]])("uses four real localized stages", (messages, labels) => {
        expect(Object.values(messages.analyzer.wizard.steps)).toEqual(labels);
    });

    it("keeps the full report out of the active result state", () => {
        const activeResult = wizard.slice(wizard.indexOf('{step === "result"'), wizard.indexOf('{step === "report"'));
        expect(activeResult).toContain("AnalyzerResultSummary");
        expect(activeResult).not.toContain("<FullReport");
    });

    it("enters report only through the result action and can return or reset", () => {
        expect(summary).toContain("onClick={onViewReport}");
        expect(wizard).toContain('setStep("report")');
        expect(wizard).toContain('setStep("result")');
        expect(wizard).toContain("onClick={resetAndRestart}");
        expect(wizard).toContain('setStep("source")');
    });

    it("has one primary current-report action and secondary restart action", () => {
        expect(summary.match(/onClick=\{onViewReport\}/g)).toHaveLength(1);
        expect(summary).toContain('className="btn-secondary w-full');
    });

    it("contains no technical Monte Carlo placeholder", () => {
        expect(reportSources).not.toContain("???");
    });

    it("has localized save outcomes and no legacy CTA copy", () => {
        for (const messages of [es, en]) {
            expect(Object.keys(messages.analyzer.wizard.completion.status)).toEqual(expect.arrayContaining(["saved", "duplicated", "beta_limit", "error"]));
        }
        expect(es.analyzer.wizard.viewReport).toBe("Ver reporte completo");
        expect(en.analyzer.wizard.viewReport).toBe("View full report");
        expect(JSON.stringify(es)).not.toContain("Ver reporte de la beta");
        expect(JSON.stringify(en)).not.toContain("Try another file (saved report stays)");
    });
});
