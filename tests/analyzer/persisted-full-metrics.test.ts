import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { FullMetrics } from "../../lib/analyzer/metrics";
import { metricsFingerprintProjection, serializeFullMetrics } from "../../lib/analyzer/persistedMetrics";
import { normalizePublicReportMetrics } from "../../lib/analyzer/publicReportMetrics";

const fullMetrics = {
    totalTrades: 140, winrate: 64.3, profitFactor: 2.49, maxDrawdown: 0.7,
    maxDrawdownAbs: 70, expectancy: 1.2, sumProfit: 168,
    equityCurve: [0, 1], drawdownCurve: [0, 0], tradeHistogram: [1],
    minProfit: -1, maxProfit: 2, longestLosingStreak: 2, recommendedRiskPct: 1,
    riskOfRuin: 0,
    riskAnalysis: { maxDrawdown: 0.7, avgDrawdown: 0.2, recoveryFactor: 3.4, profitToDrawdown: 4, sharpeRatio: 1.8, skewness: 0.4 },
    stabilityScore: 82,
    stabilityAnalysis: { segments: [], interpretation: "Estable" },
    evolution: { last100: { totalTrades: 100, winrate: 62, profitFactor: 2, maxDrawdown: 1, maxDrawdownAbs: 10, expectancy: 1, sumProfit: 100 }, last50: { totalTrades: 50 }, last30: { totalTrades: 30 } },
    monteCarlo: { iterations: 1000, worstCase: -4, averageCase: 12, bestCase: 30, riskOfRuin: 0, drawdownAt5Pct: 8, simulations: [[0, 1]], percentilePaths: { p5: [], p25: [], p50: [], p75: [], p95: [] }, horizon: 140 },
    propFirm: { passProb: 74, failDailyDDProb: 3, failMaxDDProb: 4, expectedTrades: 80, consistencyScore: 88, passTier: "good" },
    advanced: { sqn: 3, sqnLevel: "excellent", zScore: 1, zLevel: "mild", edgeConfidence: 99, robustnessLevel: "robust", expertTips: ["tip"], verdict: "strongEdge" },
    edgeDecay: { score: 90, signal: "stable", recentSQN: 3, baselineSQN: 2.8 },
    timeAnalysis: { byWeekday: [], byHour: [], bySession: { asian: 0, london: 0, ny: 0 } },
} as unknown as FullMetrics;

function report(metrics_json: unknown) {
    return { trades_count: 140, winrate: 64.3, profit_factor: 2.49, max_drawdown: 0.7, sum_profit: 168, metrics_json };
}

describe("rich persisted FullMetrics", () => {
    it("round-trips advanced, windows, Monte Carlo, Prop Firm and intelligence data", () => {
        const normalized = normalizePublicReportMetrics(report(serializeFullMetrics(fullMetrics)));
        expect(normalized.metrics.advanced?.edgeConfidence).toBe(99);
        expect(normalized.metrics.riskAnalysis?.sharpeRatio).toBe(1.8);
        expect(normalized.metrics.evolution?.last100?.totalTrades).toBe(100);
        expect(normalized.metrics.evolution?.last50?.totalTrades).toBe(50);
        expect(normalized.metrics.evolution?.last30?.totalTrades).toBe(30);
        expect(normalized.metrics.monteCarlo?.iterations).toBe(1000);
        expect(normalized.metrics.propFirm?.passProb).toBe(74);
        expect(normalized.metrics.edgeDecay?.signal).toBe("stable");
        expect(Object.values(normalized.availability).every(Boolean)).toBe(true);
    });

    it("preserves a real zero risk of ruin", () => {
        const normalized = normalizePublicReportMetrics(report(serializeFullMetrics(fullMetrics)));
        expect(normalized.metrics.riskOfRuin).toBe(0);
        expect(normalized.availability.riskOfRuin).toBe(true);
    });

    it("keeps absent historical advanced fields unavailable instead of zero", () => {
        const normalized = normalizePublicReportMetrics(report({ basic: fullMetrics, equity_curve: [0, 1] }));
        expect(normalized.metrics.riskOfRuin).toBeUndefined();
        expect(normalized.metrics.stabilityScore).toBeUndefined();
        expect(normalized.metrics.monteCarlo).toBeUndefined();
        expect(normalized.edgeConfidence).toBeNull();
        expect(normalized.availability.riskOfRuin).toBe(false);
        expect(normalized.availability.stability).toBe(false);
        expect(normalized.availability.monteCarlo).toBe(false);
    });

    it("keeps the legacy reduced fingerprint projection unchanged", () => {
        expect(metricsFingerprintProjection(serializeFullMetrics(fullMetrics))).toEqual({
            basic: expect.objectContaining({ totalTrades: 140, profitFactor: 2.49 }),
            equity_curve: [0, 1], drawdown_curve: [0, 0], trade_histogram: [1],
        });
    });

    it("keeps the legacy reduced envelope available to existing consumers", () => {
        const serialized = serializeFullMetrics(fullMetrics);
        expect(serialized.basic.totalTrades).toBe(140);
        expect(serialized.equity_curve).toEqual([0, 1]);
        expect(serialized.drawdown_curve).toEqual([0, 0]);
        expect(serialized.trade_histogram).toEqual([1]);
    });

    it("does not treat partial legacy intelligence or stability details as complete", () => {
        const normalized = normalizePublicReportMetrics(report({
            advanced: { verdict: "strongEdge", edgeConfidence: 0 },
            stabilityAnalysis: { interpretation: "Estable" },
        }));
        expect(normalized.edgeConfidence).toBe(0);
        expect(normalized.availability.edgeConfidence).toBe(true);
        expect(normalized.availability.intelligence).toBe(false);
        expect(normalized.availability.stability).toBe(false);
    });

    it("renders unavailable states rather than invented stability or empty Monte Carlo", () => {
        const source = readFileSync("components/analyzer/FullReport.tsx", "utf8");
        expect(source).toContain("hasStability ?");
        expect(source).not.toContain("Math.round(metrics.stabilityScore || 0)");
        expect(source).toContain("!hasMonteCarlo ?");
        expect(source).toContain('t("monteCarlo.savedUnavailable")');
        expect(source).not.toContain("(metrics.riskOfRuin || 0).toFixed");
    });

    it("keeps legacy Prop Firm data normalized while rendering Intelligence without zero fallbacks", () => {
        const source = readFileSync("components/report/PersistedAdvancedSections.tsx", "utf8");
        const normalized = normalizePublicReportMetrics(report(serializeFullMetrics(fullMetrics)));
        expect(normalized.metrics.propFirm?.passProb).toBe(74);
        expect(normalized.availability.propFirm).toBe(true);
        expect(source).not.toContain("metrics.propFirm");
        expect(source).toContain("availability.intelligence && metrics.advanced");
        expect(source).not.toContain("|| 0");
    });
});
