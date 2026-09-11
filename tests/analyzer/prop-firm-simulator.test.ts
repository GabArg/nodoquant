import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { FullMetrics } from "../../lib/analyzer/metrics";
import {
    CUSTOM_PROP_FIRM_CONFIG,
    runPropFirmMonteCarlo,
    strategyDataFromMetrics,
    validatePropFirmConfig,
    type PropFirmConfig,
    type StrategySimulationData,
} from "../../lib/analyzer/propFirm";
import { normalizePublicReportMetrics } from "../../lib/analyzer/publicReportMetrics";

const strategy: StrategySimulationData = { outcomes: [-1, 2], source: "exact" };
const config = (overrides: Partial<PropFirmConfig> = {}): PropFirmConfig => ({
    ...CUSTOM_PROP_FIRM_CONFIG,
    phases: [{ id: "p1", name: "Phase 1", profitTargetPct: 10, maxTradingDays: 2 }],
    ...overrides,
});

describe("Prop Firm challenge Monte Carlo", () => {
    it("accepts a valid custom configuration and rejects invalid rules", () => {
        expect(validatePropFirmConfig(config())).toEqual([]);
        expect(validatePropFirmConfig(config({ accountSize: 0, phases: [] }))).toEqual(expect.arrayContaining(["accountSize", "phases"]));
    });

    it("receives challenge-specific config and detects a target pass", () => {
        const result = runPropFirmMonteCarlo(strategy, config({ phases: [{ id: "p1", name: "Phase 1", profitTargetPct: 1, maxTradingDays: 1 }] }), 5, () => 0.99);
        expect(result.passed).toBe(5);
        expect(result.totalPassProbability).toBe(100);
        expect(result.failureCounts.targetNotReached).toBe(0);
    });

    it("detects daily loss violations", () => {
        const result = runPropFirmMonteCarlo(strategy, config({ dailyLossLimitPct: 0.5, maxLossLimitPct: 50 }), 4, () => 0);
        expect(result.failureCounts.dailyLoss).toBe(4);
        expect(result.dailyLossViolationProbability).toBe(100);
    });

    it("detects max loss violations independently", () => {
        const result = runPropFirmMonteCarlo(strategy, config({ dailyLossLimitPct: 50, maxLossLimitPct: 0.5 }), 4, () => 0);
        expect(result.failureCounts.maxLoss).toBe(4);
        expect(result.maxLossViolationProbability).toBe(100);
    });

    it("counts target not reached when limits survive but the phase expires", () => {
        const result = runPropFirmMonteCarlo({ outcomes: [-0.1, 0], source: "exact" }, config({ dailyLossLimitPct: 99, maxLossLimitPct: 99 }), 3, () => 0.99);
        expect(result.failureCounts.targetNotReached).toBe(3);
        expect(result.targetNotReachedProbability).toBe(100);
    });

    it("models multiple phases instead of assuming a single phase", () => {
        const result = runPropFirmMonteCarlo(strategy, config({ phases: [
            { id: "p1", name: "Phase 1", profitTargetPct: 1, maxTradingDays: 1 },
            { id: "p2", name: "Phase 2", profitTargetPct: 1, maxTradingDays: 1 },
        ] }), 3, () => 0.99);
        expect(result.phasePassProbabilities).toEqual([100, 100]);
        expect(result.totalPassProbability).toBe(100);
    });

    it("keeps real zero distinct from unavailable", () => {
        const completed = runPropFirmMonteCarlo(strategy, config({ phases: [{ id: "p1", name: "Phase 1", profitTargetPct: 1, maxTradingDays: 1 }] }), 2, () => 0.99);
        const unavailable = runPropFirmMonteCarlo({ outcomes: [], source: "exact" }, config(), 2);
        expect(completed.dailyLossViolationProbability).toBe(0);
        expect(unavailable.dailyLossViolationProbability).toBeNull();
        expect(unavailable.totalPassProbability).toBeNull();
    });

    it("does not mutate intrinsic strategy metrics", () => {
        const metrics = { tradeHistogram: [1, 1], minProfit: -1, maxProfit: 2 } as FullMetrics;
        const before = JSON.stringify(metrics);
        const data = strategyDataFromMetrics(metrics);
        if (data) runPropFirmMonteCarlo(data, config(), 2, () => 0.99);
        expect(JSON.stringify(metrics)).toBe(before);
    });

    it("selects usable persisted strategy data without changing the saved metrics", () => {
        const metrics = { tradeHistogram: [5, 5], minProfit: -1, maxProfit: 2 } as FullMetrics;
        const data = strategyDataFromMetrics(metrics);
        expect(data?.source).toBe("persistedHistogram");
        expect(data?.outcomes).toHaveLength(10);
        expect(metrics.tradeHistogram).toEqual([5, 5]);
    });

    it("keeps legacy persisted Prop Firm data readable", () => {
        const normalized = normalizePublicReportMetrics({ trades_count: 10, winrate: 50, profit_factor: 1.2, max_drawdown: 5, sum_profit: 1, metrics_json: { propFirm: { passProb: 0 } } });
        expect(normalized.availability.propFirm).toBe(true);
        expect(normalized.metrics.propFirm?.passProb).toBe(0);
    });
});

describe("Prop Firm product placement", () => {
    const report = readFileSync("components/report/PersistedAdvancedSections.tsx", "utf8");
    const fullReport = readFileSync("components/analyzer/FullReport.tsx", "utf8");
    const dashboard = readFileSync("app/[locale]/dashboard/page.tsx", "utf8");
    const metricsEngine = readFileSync("lib/analyzer/metrics.ts", "utf8");

    it("removes the extensive persisted block and keeps a report CTA with the report id", () => {
        expect(report).not.toContain("metrics.propFirm");
        expect(fullReport).toContain("propFirmReport=${encodeURIComponent(analysisId)}");
        expect(dashboard).toContain("initialReportId={searchParams?.propFirmReport}");
    });

    it("keeps general Monte Carlo and no longer injects Prop Firm into new intrinsic metrics", () => {
        const fullMetricsBuilder = metricsEngine.slice(metricsEngine.indexOf("export function calcFullMetrics"), metricsEngine.indexOf("export function calcEdgeDecay"));
        expect(fullMetricsBuilder).toContain("calcMonteCarloSimulation(trades, 1000)");
        expect(fullMetricsBuilder).not.toContain("calcPropFirmChallenge");
    });
});
