import { describe, it, expect } from "vitest";
import { calcFullMetrics } from "../../lib/analyzer/metrics";
import type { Trade } from "../../lib/analyzer/parser";

describe("Analytics Engine Stress Tests", () => {
    const createTrades = (profits: number[]): Trade[] => {
        return profits.map((profit, index) => ({
            datetime: new Date(2026, 0, index + 1),
            profit,
            exit_time: new Date(2026, 0, index + 1),
        }));
    };

    // A. Small Sample (N < 20)
    it("should correctly handle small samples (N < 20)", () => {
        const profits = Array(15).fill(10);
        const trades = createTrades(profits);
        const metrics = calcFullMetrics(trades);

        expect(metrics.advanced?.edgeConfidence).toBeLessThan(30);
        expect(metrics.advanced?.robustnessLevel).toBe("fragile");
        expect(metrics.advanced?.verdict).toBe("insufficientSample");
    });

    // B. Clustered Sequences (High Z-Score)
    it("should detect clustered sequences with high Z-Score", () => {
        const profits: number[] = [];

        for (let i = 0; i < 5; i++) {
            profits.push(
                ...Array(5).fill(10),
                ...Array(5).fill(-5)
            );
        }

        const trades = createTrades(profits);
        const metrics = calcFullMetrics(trades);

        expect(Math.abs(metrics.advanced?.zScore ?? 0)).toBeGreaterThan(2);
        expect(metrics.advanced?.expertTips).toContain("tipZScoreHigh");
    });

    // C. Random Walk / No Edge
    // Exactly balanced:
    // - 50 wins of +10
    // - 50 losses of -10
    // - Profit Factor = 1
    // - Expectancy = 0
    //
    // This test is intentionally deterministic. Using Math.random()
    // here would make the result vary between test runs.
    it("should identify a lack of edge in a random walk", () => {
        const profits = Array.from(
            { length: 100 },
            (_, index) => (index % 2 === 0 ? 10 : -10)
        );

        const trades = createTrades(profits);
        const metrics = calcFullMetrics(trades);

        expect(metrics.totalTrades).toBe(100);
        expect(metrics.winrate).toBe(50);
        expect(metrics.profitFactor).toBe(1);
        expect(metrics.expectancy).toBe(0);

        expect(metrics.advanced?.edgeConfidence).toBeLessThan(40);
        expect(metrics.advanced?.verdict).toBe("noEdge");
        expect(["fragile", "moderate"]).toContain(
            metrics.advanced?.robustnessLevel
        );
    });

    // D. Robust Strategy
    // Deterministic profitable sample:
    // - 60 wins of +20
    // - 40 losses of -10
    // - PF = 3
    // - Positive expectancy
    //
    // The sequence is intentionally spread rather than randomized so
    // this test produces the same result on every execution.
    it("should identify a robust strategy correctly", () => {
        const profits = Array.from(
            { length: 100 },
            (_, index) => {
                const positionInBlock = index % 5;

                return positionInBlock < 3 ? 20 : -10;
            }
        );

        const trades = createTrades(profits);
        const metrics = calcFullMetrics(trades);

        expect(metrics.totalTrades).toBe(100);
        expect(metrics.winrate).toBe(60);
        expect(metrics.profitFactor).toBeGreaterThan(1);
        expect(metrics.expectancy).toBeGreaterThan(0);

        expect(metrics.advanced?.edgeConfidence).toBeGreaterThan(60);
        expect(["robust", "elite"]).toContain(
            metrics.advanced?.robustnessLevel
        );
    });

    // E. Martingale / Skewed Payoff
    it("should flag Martingale-style strategies as fragile", () => {
        // 92 wins of +10 and 8 losses of -100
        const profits = [
            ...Array(92).fill(10),
            ...Array(8).fill(-100),
        ];

        const trades = createTrades(profits);
        const metrics = calcFullMetrics(trades);

        expect(metrics.winrate).toBeGreaterThan(90);

        expect(metrics.advanced?.edgeConfidence).toBeLessThan(40);
        expect(metrics.advanced?.robustnessLevel).toBe("fragile");
    });

    // F. Overfitted Small Sample
    it("should penalize overfitted small samples", () => {
        const profits = Array(10).fill(100);

        const trades = createTrades(profits);
        const metrics = calcFullMetrics(trades);

        expect(metrics.totalTrades).toBe(10);
        expect(metrics.profitFactor).toBeGreaterThan(5);

        expect(metrics.advanced?.edgeConfidence).toBeLessThan(30);
        expect(metrics.advanced?.robustnessLevel).toBe("fragile");
        expect(metrics.advanced?.verdict).toBe("insufficientSample");
    });

    // G. Mathematical Verification (SQN)
    it("should verify SQN formula accuracy", () => {
        const profits = [
            10, 20,
            10, 20,
            10, 20,
            10, 20,
            10, 20,
        ];

        const trades = createTrades(profits);
        const metrics = calcFullMetrics(trades);

        // SQN = (avg / sample stdDev) * sqrt(n)
        // With avg = 15 and sample stdDev ≈ 5.27,
        // SQN is approximately 9.
        expect(metrics.advanced?.sqn).toBeGreaterThan(8);
    });
});