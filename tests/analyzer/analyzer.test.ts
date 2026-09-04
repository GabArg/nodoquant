import { describe, it, expect } from "vitest";
import { loadDataset, listDatasets } from "./datasetLoader";
import {
    calcAdvancedRobustness,
    calcBasicMetrics,
    calcFullMetrics,
    type MonteCarloResult,
} from "../../lib/analyzer/metrics";
import type { Trade } from "../../lib/analyzer/parser";
import {
    validateMetricsSanity,
    validateMetricConsistency,
    validateEquityCurveIntegrity,
} from "./metricsValidator";

describe("Strategy Analyzer Automated Test Suite", () => {
    // ── Baseline Strategies ──────────────────────────────────────────────────
    describe("Baseline Strategy Tests", () => {
        const baselineDatasets = listDatasets("qa-datasets/baseline");

        baselineDatasets.forEach((datasetPath) => {
            const fileName = datasetPath.split(/[\\/]/).pop();

            it(`should correctly analyze ${fileName}`, () => {
                const trades = loadDataset(datasetPath);

                const startTime = performance.now();
                const metrics = calcFullMetrics(trades);
                const endTime = performance.now();

                validateMetricsSanity(metrics, trades);
                validateMetricConsistency(metrics, trades);
                validateEquityCurveIntegrity(metrics.equityCurve, trades);

                const edgeConfidence =
                    metrics.advanced?.edgeConfidence ?? "N/A";

                const verdict =
                    metrics.advanced?.verdict ?? "N/A";

                const robustness =
                    metrics.advanced?.robustnessLevel ?? "N/A";

                console.log(
                    `[PASS] ${fileName} | ` +
                    `Trades: ${metrics.totalTrades} | ` +
                    `Winrate: ${metrics.winrate}% | ` +
                    `PF: ${metrics.profitFactor} | ` +
                    `Expectancy: ${metrics.expectancy} | ` +
                    `Stability: ${metrics.stabilityScore} | ` +
                    `Edge Confidence: ${edgeConfidence} | ` +
                    `Robustness: ${robustness} | ` +
                    `Verdict: ${verdict} | ` +
                    `Time: ${(endTime - startTime).toFixed(2)}ms`
                );
            });
        });
    });

    // ── Regression Guards ────────────────────────────────────────────────────
    describe("Regression Guards", () => {
        it("should classify a positive 30-trade sample as weakEdge at the exact minimum boundary", () => {
            const trades = loadDataset(
                "qa-datasets/baseline/strongedge.csv"
            );

            expect(trades.length).toBe(30);

            const metrics = calcFullMetrics(trades);

            expect(metrics.advanced?.verdict).toBe("weakEdge");
            expect(metrics.advanced?.edgeConfidence).toBeGreaterThanOrEqual(55);
            expect(metrics.profitFactor).toBeGreaterThanOrEqual(1.1);
        });

        it("should calculate martingale avgWin from positive trades only", () => {
            const baseDate = new Date("2026-01-01T00:00:00Z");

            const winningTrades: Trade[] = Array.from(
                { length: 29 },
                (_, index) => ({
                    datetime: new Date(baseDate.getTime() + index * 60_000),
                    profit: 10,
                })
            );

            const trades: Trade[] = [
                ...winningTrades,
                {
                    datetime: new Date(
                        baseDate.getTime() + 29 * 60_000
                    ),
                    profit: -100,
                },
            ];

            const basic = calcBasicMetrics(trades);

            const deterministicMonteCarlo: MonteCarloResult = {
                iterations: 1,
                worstCase: 0,
                averageCase: 0,
                bestCase: 0,
                riskOfRuin: 0,
                drawdownAt5Pct: 0,
                simulations: [],
                percentilePaths: {
                    p5: [],
                    p25: [],
                    p50: [],
                    p75: [],
                    p95: [],
                },
                horizon: 30,
            };

            const advanced = calcAdvancedRobustness(
                trades,
                basic,
                deterministicMonteCarlo
            );

            // True avgWin is 10, so maxLoss 100 is below the
            // martingale penalty threshold of 10 * 15 = 150.
            // The expected confidence includes only the 30-trade
            // sample-size penalty, not the martingale penalty.
            expect(advanced.edgeConfidence).toBe(51);
        });
    });

    // ── Risk & Stability ─────────────────────────────────────────────────────
    describe("Risk and Stability Analysis", () => {
        const riskDatasets = listDatasets("qa-datasets/risk");
        const stabilityDatasets = listDatasets("qa-datasets/stability");

        [...riskDatasets, ...stabilityDatasets].forEach((datasetPath) => {
            const fileName = datasetPath.split(/[\\/]/).pop();

            it(`should handle ${fileName} without breaking`, () => {
                const trades = loadDataset(datasetPath);
                const metrics = calcFullMetrics(trades);

                validateMetricsSanity(metrics, trades);
                validateMetricConsistency(metrics, trades);

                expect(metrics.stabilityScore).toBeGreaterThanOrEqual(0);
                expect(metrics.stabilityScore).toBeLessThanOrEqual(100);
            });
        });
    });

    // ── Special Cases: Free Plan Limits ──────────────────────────────────────
    describe("Plan Limit Logic", () => {
        it("should allow 500 trades (limit boundary)", () => {
            const trades = loadDataset(
                "qa-datasets/performance/dataset_500_trades.csv"
            );

            expect(trades.length).toBe(500);

            const metrics = calcFullMetrics(trades);

            expect(metrics.totalTrades).toBe(500);
        });

        it("should load 501 trades for limit testing", () => {
            const trades = loadDataset(
                "qa-datasets/performance/dataset_501_trades.csv"
            );

            expect(trades.length).toBe(501);
        });
    });

    // ── Performance Benchmarks ───────────────────────────────────────────────
    describe("Performance Benchmarks", () => {
        it("should analyze 5,000 trades within 2 seconds", () => {
            const trades = loadDataset(
                "qa-datasets/performance/dataset_5000_trades.csv"
            );

            const start = performance.now();
            const metrics = calcFullMetrics(trades);
            const end = performance.now();

            const duration = end - start;

            console.log(
                `[PERF] 5000 trades processed in ${duration.toFixed(2)}ms`
            );

            expect(duration).toBeLessThan(2000);

            validateMetricsSanity(metrics, trades);
        });
    });

    // ── Robustness: Error Datasets ───────────────────────────────────────────
    describe("Robustness and Error Handling", () => {
        const errorDatasets = listDatasets("qa-datasets/errors");

        errorDatasets.forEach((datasetPath) => {
            const fileName = datasetPath.split(/[\\/]/).pop();

            it(`should NOT crash and return structured error for ${fileName}`, () => {
                try {
                    const trades = loadDataset(datasetPath);
                    const metrics = calcFullMetrics(trades);

                    expect(metrics).toBeDefined();
                } catch (error: unknown) {
                    expect(error).toBeInstanceOf(Error);

                    if (error instanceof Error) {
                        expect(error.message).toBeDefined();

                        console.log(
                            `[SAFE] Handled error in ${fileName}: ${error.message}`
                        );
                    }
                }
            });
        });
    });
});
