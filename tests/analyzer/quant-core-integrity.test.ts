import { describe, expect, it } from "vitest";
import {
    calcBasicMetrics,
    calcFullMetrics,
    calcRecommendedRisk,
    buildDrawdownCurve,
    buildEquityCurve,
} from "../../lib/analyzer/metrics";
import type { Trade } from "../../lib/analyzer/parser";

function makeTrades(profits: number[]): Trade[] {
    const baseDate = new Date("2026-01-01T00:00:00Z");
    return profits.map((p, i) => ({
        datetime: new Date(baseDate.getTime() + i * 3600_000),
        profit: p,
        exit_time: new Date(baseDate.getTime() + i * 3600_000 + 1800_000),
    }));
}

describe("FASE 2B.2: Quantitative Core Integrity & Transparency Tests", () => {
    // ── 1. Basic Metrics & Sentinel Elimination ──────────────────────────────
    describe("1. Win Rate, Profit Factor & Expectancy Deterministic Tests", () => {
        it("handles standard balanced strategy with wins and losses", () => {
            const trades = makeTrades([100, -50, 100, -50, 100]);
            const basic = calcBasicMetrics(trades);

            expect(basic.totalTrades).toBe(5);
            expect(basic.winrate).toBe(60); // 3/5 = 60%
            expect(basic.expectancy).toBe(40); // (300 - 100) / 5 = 40
            expect(basic.sumProfit).toBe(200);
            expect(basic.profitFactor).toBe(3.0); // 300 / 100 = 3.0
            expect(basic.profitFactorInfinite).toBe(false);
        });

        it("eliminates 99.99 sentinel for pure winning strategies (no losses)", () => {
            const trades = makeTrades([50, 100, 25, 75]);
            const basic = calcBasicMetrics(trades);

            expect(basic.winrate).toBe(100);
            expect(basic.profitFactor).toBeNull();
            expect(basic.profitFactorInfinite).toBe(true);
            // Must NOT use 99.99 sentinel
            expect(basic.profitFactor).not.toBe(99.99);
        });

        it("handles pure losing strategies (no wins)", () => {
            const trades = makeTrades([-50, -100, -25]);
            const basic = calcBasicMetrics(trades);

            expect(basic.winrate).toBe(0);
            expect(basic.profitFactor).toBe(0);
            expect(basic.profitFactorInfinite).toBe(false);
            expect(basic.expectancy).toBeCloseTo(-58.33, 2);
        });

        it("handles zero-profit trades without misclassifying as wins", () => {
            const trades = makeTrades([100, 0, -100, 0]);
            const basic = calcBasicMetrics(trades);

            expect(basic.totalTrades).toBe(4);
            expect(basic.winrate).toBe(25); // only 1 positive trade out of 4
            expect(basic.expectancy).toBe(0);
            expect(basic.profitFactor).toBe(1.0);
        });

        it("handles empty trade list safely without NaN", () => {
            const basic = calcBasicMetrics([]);
            expect(basic.totalTrades).toBe(0);
            expect(basic.winrate).toBe(0);
            expect(basic.profitFactor).toBeNull();
            expect(basic.profitFactorInfinite).toBe(false);
            expect(basic.expectancy).toBe(0);
            expect(basic.maxDrawdown).toBeNull();
            expect(basic.maxDrawdownAbs).toBe(0);
        });
    });

    // ── 2. Drawdown & Optional Initial Capital ────────────────────────────────
    describe("2. Drawdown: Eliminating USD 10,000 Assumption & Unit Safety", () => {
        const drawdownTrades = makeTrades([500, -1000, 200, -700, 1500]);
        // Cumulative equity curve from 0: [0, 500, -500, -300, -1000, 500]
        // Peak is 500 at index 1.
        // Trough after peak is -1000 at index 4.
        // Absolute drawdown = 500 - (-1000) = 1500.

        it("computes absolute drawdown without needing initial capital", () => {
            const basic = calcBasicMetrics(drawdownTrades); // no initial capital

            expect(basic.maxDrawdownAbs).toBe(1500);
            // Without capital, percentage drawdown MUST NOT be reported
            expect(basic.maxDrawdown).toBeNull();
        });

        it("computes percentage drawdown correctly when initial capital is provided", () => {
            // Capital = $10,000
            // Peak equity = 10,000 + 500 = 10,500
            // Trough equity = 10,000 - 1,000 = 9,000
            // Max DD % = (10,500 - 9,000) / 10,500 * 100 = 1,500 / 10,500 * 100 = 14.2857% -> 14.3%
            const basic10k = calcBasicMetrics(drawdownTrades, 10000);
            expect(basic10k.maxDrawdownAbs).toBe(1500);
            expect(basic10k.maxDrawdown).toBe(14.3);

            // Capital = $100,000
            // Peak equity = 100,500
            // Trough equity = 99,000
            // Max DD % = 1,500 / 100,500 * 100 = 1.4925% -> 1.5%
            const basic100k = calcBasicMetrics(drawdownTrades, 100000);
            expect(basic100k.maxDrawdownAbs).toBe(1500);
            expect(basic100k.maxDrawdown).toBe(1.5);
        });

        it("does NOT assume 10,000 base balance when building drawdown curve without capital", () => {
            const equityCurve = buildEquityCurve(drawdownTrades);
            const absDdCurve = buildDrawdownCurve(equityCurve); // no capital

            // Curve should track absolute drops from cumulative peak
            expect(Math.max(...absDdCurve)).toBe(1500);
        });
    });

    // ── 3. Kelly Criterion Theoretical Fix ────────────────────────────────────
    describe("3. Kelly Criterion Theoretical Corrections & Disabling Financial Advice", () => {
        it("returns 0% recommended risk for negative expectancy strategies", () => {
            // 80% winrate, but win is 10, loss is 100 (Expectancy = -12, PF = 0.8)
            const losingTrades = makeTrades([...Array(8).fill(10), ...Array(2).fill(-100)]);
            const basic = calcBasicMetrics(losingTrades);

            expect(basic.expectancy).toBeLessThan(0);
            const kelly = calcRecommendedRisk(basic, losingTrades);

            // Must NOT recommend 0.5% on a losing system
            expect(kelly.recommendedPct).toBe(0);
            expect(kelly.kellyFraction).toBe(0);
            expect(kelly.isOperative).toBe(false);
        });

        it("returns 0% recommended risk for zero-expectancy (fair coin toss)", () => {
            const fairTrades = makeTrades([...Array(50).fill(100), ...Array(50).fill(-100)]);
            const basic = calcBasicMetrics(fairTrades);

            expect(basic.expectancy).toBe(0);
            const kelly = calcRecommendedRisk(basic, fairTrades);

            expect(kelly.recommendedPct).toBe(0);
            expect(kelly.isOperative).toBe(false);
        });

        it("uses payoff ratio (avgWin / avgLoss) correctly for asymmetric trend following", () => {
            // 35% winrate, avgWin = 300, avgLoss = 100
            // Payoff ratio b = 3.0. Winrate p = 0.35.
            // f* = p - (1 - p)/b = 0.35 - 0.65/3 = 0.35 - 0.21667 = 0.1333 (13.33%)
            // Half Kelly = 6.67%, capped at 5.0%
            const trendTrades = makeTrades([...Array(35).fill(300), ...Array(65).fill(-100)]);
            const basic = calcBasicMetrics(trendTrades);

            expect(basic.winrate).toBe(35);
            expect(basic.expectancy).toBe(40);
            const kelly = calcRecommendedRisk(basic, trendTrades);

            expect(kelly.kellyFraction).toBeCloseTo(0.1333, 3);
            expect(kelly.recommendedPct).toBe(5.0); // capped at 5% max
            expect(kelly.isOperative).toBe(false);
        });
    });

    // ── 4. Full Metrics Integration ───────────────────────────────────────────
    describe("4. FullMetrics Integration & Safety", () => {
        it("passes initialCapital through to full metrics correctly", () => {
            const trades = makeTrades([200, -100, 300, -150]);
            const fullNoCap = calcFullMetrics(trades);
            expect(fullNoCap.maxDrawdown).toBeNull();
            expect(fullNoCap.maxDrawdownAbs).toBe(150);

            const fullWithCap = calcFullMetrics(trades, 5000);
            expect(fullWithCap.maxDrawdown).not.toBeNull();
            expect(fullWithCap.maxDrawdown).toBeGreaterThan(0);
        });
    });
});
