import { describe, expect, it } from "vitest";
import type { FullMetrics } from "../../lib/analyzer/metrics";
import { calcFullMetrics } from "../../lib/analyzer/metrics";
import { serializeFullMetrics } from "../../lib/analyzer/persistedMetrics";
import type { Trade } from "../../lib/analyzer/parser";
import { CUSTOM_PROP_FIRM_CONFIG, runPropFirmMonteCarlo, strategySimulationDataFromPersistedMetrics, type PropFirmConfig } from "../../lib/analyzer/propFirm";
import { deserializeNormalizedTradeSequence, normalizedTradeSequenceFromTrades, serializeNormalizedTradeSequence } from "../../lib/analyzer/normalizedTradeSequence";
import { groupTradesByEvaluationDay, UTC_DAILY_RESET } from "../../lib/analyzer/propFirmTime";

const metricShell = (simulationData?: FullMetrics["simulationData"]): FullMetrics => ({
    totalTrades: 10, winrate: 50, profitFactor: 1, maxDrawdown: 1, maxDrawdownAbs: 1, expectancy: 0, sumProfit: 0,
    equityCurve: [], drawdownCurve: [], tradeHistogram: [5, 5], minProfit: -1, maxProfit: 1, longestLosingStreak: 1,
    recommendedRiskPct: 1, riskOfRuin: 0, monteCarlo: {} as FullMetrics["monteCarlo"], timeAnalysis: {} as FullMetrics["timeAnalysis"],
    riskAnalysis: {} as FullMetrics["riskAnalysis"], stabilityAnalysis: {} as FullMetrics["stabilityAnalysis"], stabilityScore: 0,
    simulationData,
});

describe("normalized trade sequence", () => {
    it("keeps complete 140 and 500 trade v2 payloads within the transport budget", () => {
        for (const count of [140, 500]) {
            const trades = Array.from({ length: count }, (_, index) => ({ datetime: new Date(Date.UTC(2026, 0, 1) + index * 3600000), profit: index % 2 ? -1 : 2 }));
            const metrics = calcFullMetrics(trades);
            const withSequence = Buffer.byteLength(JSON.stringify(serializeFullMetrics(metrics)), "utf8");
            const withoutSequence = Buffer.byteLength(JSON.stringify(serializeFullMetrics({ ...metrics, simulationData: undefined })), "utf8");
            expect(withSequence).toBeGreaterThan(withoutSequence);
            expect(withSequence - withoutSequence).toBeLessThan(12000);
            expect(withSequence).toBeLessThan(102400);
        }
    });
    it("preserves real order, zero profit and optional timestamps", () => {
        const trades: Trade[] = [
            { datetime: new Date("2026-01-02T10:00:00Z"), profit: 2 },
            { datetime: new Date("2026-01-01T10:00:00Z"), profit: 0 },
            { datetime: new Date(), profit: -1, timestamp_valid: false },
        ];
        const normalized = normalizedTradeSequenceFromTrades(trades);
        expect(normalized.map(item => item.profit)).toEqual([2, 0, -1]);
        expect(normalized.map(item => item.index)).toEqual([0, 1, 2]);
        expect(normalized[0].closedAt).toBe("2026-01-02T10:00:00.000Z");
        expect(normalized[2].closedAt).toBeUndefined();
    });

    it("round-trips 500 compact trades without inventing optional fields", () => {
        const source = Array.from({ length: 500 }, (_, index) => ({ index, profit: index % 2 ? -1 : 1, closedAt: new Date(Date.UTC(2026, 0, 1 + Math.floor(index / 5), index % 24)).toISOString() }));
        const persisted = serializeNormalizedTradeSequence(source);
        const restored = deserializeNormalizedTradeSequence(JSON.parse(JSON.stringify(persisted)));
        expect(restored).toEqual(source);
        expect(JSON.stringify(persisted).length).toBeLessThan(15000);
        expect(JSON.stringify(persisted)).not.toMatch(/symbol|trade_id|equity|balance/);
    });

    it("prioritizes a valid persisted sequence and falls back for historical metrics", () => {
        const sequence = serializeNormalizedTradeSequence(Array.from({ length: 10 }, (_, index) => ({ index, profit: index - 5, closedAt: new Date(Date.UTC(2026, 0, index + 1)).toISOString() })));
        const current = strategySimulationDataFromPersistedMetrics(metricShell(sequence));
        const historical = strategySimulationDataFromPersistedMetrics(metricShell());
        expect(current).toMatchObject({ source: "normalizedTradeSequence", outcomes: [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4], hasTimestamps: true });
        expect(historical?.source).toBe("histogramApproximation");
    });

    it("groups closed trades into real UTC trading days", () => {
        const groups = groupTradesByEvaluationDay([
            { index: 0, profit: 1, closedAt: "2026-01-01T10:00:00.000Z" },
            { index: 1, profit: -1, closedAt: "2026-01-01T15:00:00.000Z" },
            { index: 2, profit: 2, closedAt: "2026-01-03T10:00:00.000Z" },
        ]);
        expect(groups.map(group => group.map(trade => trade.index))).toEqual([[0, 1], [2]]);
        expect(groupTradesByEvaluationDay([{ index: 0, profit: 1 }], UTC_DAILY_RESET)).toEqual([]);
    });

    it("uses observed day blocks for minimum trading days and duration", () => {
        const trades = Array.from({ length: 10 }, (_, index) => ({ index, profit: index % 2 ? -1 : 2, closedAt: new Date(Date.UTC(2026, 0, index + 1)).toISOString() }));
        const data = { outcomes: trades.map(item => item.profit), trades, source: "normalizedTradeSequence" as const, hasTimestamps: true };
        const config: PropFirmConfig = { ...CUSTOM_PROP_FIRM_CONFIG, phases: [{ id: "p1", name: "P1", profitTargetPct: 1, minTradingDays: 3, maxTradingDays: 3 }] };
        const passing = runPropFirmMonteCarlo(data, config, 2, () => 0.8);
        expect(passing.durationDays?.p50).toBe(3);
    });

    it("models static and trailing limits only on closed cumulative outcomes", () => {
        const data = { outcomes: [-1, 2], source: "normalizedTradeSequence" as const };
        const base: PropFirmConfig = { ...CUSTOM_PROP_FIRM_CONFIG, phases: [{ id: "p1", name: "P1", profitTargetPct: 50, maxTradingDays: 1 }], dailyLossLimitPct: 99, maxLossLimitPct: 0.5, tradesPerDayEstimate: 2 };
        const staticResult = runPropFirmMonteCarlo(data, { ...base, drawdownType: "static" }, 1, (() => { const values = [0.99, 0]; return () => values.shift() ?? 0; })());
        const trailingResult = runPropFirmMonteCarlo(data, { ...base, drawdownType: "trailing" }, 1, (() => { const values = [0.99, 0]; return () => values.shift() ?? 0; })());
        expect(staticResult.failureCounts.maxLoss).toBe(0);
        expect(trailingResult.failureCounts.maxLoss).toBe(1);
        expect(data).not.toHaveProperty("intradayEquity");
    });
});
