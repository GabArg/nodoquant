import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const es = JSON.parse(readFileSync(join(process.cwd(), "messages", "es.json"), "utf8"));
const en = JSON.parse(readFileSync(join(process.cwd(), "messages", "en.json"), "utf8"));

describe("dashboard beta UX", () => {
    it("localizes dashboard-only copy in both supported locales", () => {
        expect(es.dashboard.scoreBanner.title).toBe("Tu mejor Puntaje de estrategia");
        expect(es.dashboard.scoreBanner.cta).toBe("Analizar más trades");
        expect(es.analyzer.edgeAlerts.title).toBe("Alertas del edge");
        expect(en.dashboard.scoreBanner.title).toBe("Your best Strategy Score");
    });

    it("names trade_analysis history separately from Strategy Lab strategies", () => {
        expect(es.dashboard.stats.strategies).toBe("Estrategias");
        expect(es.dashboard.stats.totalAnalyses).toBe("Análisis guardados");
        expect(es.dashboard.history.title).toBe("Historial de análisis");
        expect(en.dashboard.history.title).toBe("Analysis history");
    });

    it("explains the exact data missing from each evolution view", () => {
        expect(es.dashboard.scoreChart.needsHistory).toContain("2 análisis guardados");
        expect(en.dashboard.scoreChart.needsHistory).toContain("2 saved analyses");
        expect(es.analyzer.report.evolution.savedBreakdownMissing).toContain("desglose");
        expect(en.analyzer.report.evolution.savedBreakdownMissing).toContain("trade-window breakdown");
    });
});
