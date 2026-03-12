import { expect } from 'vitest';
import type { FullMetrics, BasicMetrics } from '../../lib/analyzer/metrics';
import { calcEdgeScore } from '../../lib/edgeScore';
import type { Trade } from '../../lib/analyzer/parser';

/**
 * Validates that the produced metrics are within sane biological/mathematical bounds.
 */
export function validateMetricsSanity(metrics: FullMetrics, trades: Trade[]) {
    // Basic Counts
    expect(metrics.totalTrades).toBe(trades.length);

    // Win Rate (0-100)
    expect(metrics.winrate).toBeGreaterThanOrEqual(0);
    expect(metrics.winrate).toBeLessThanOrEqual(100);

    // Profit Factor (>= 0)
    expect(metrics.profitFactor).toBeGreaterThanOrEqual(0);
    
    // Expectancy (unbound but must be a number)
    expect(metrics.expectancy).not.toBeNaN();
    expect(Number.isFinite(metrics.expectancy)).toBe(true);

    // Drawdown (can exceed 100 if equity goes negative)
    expect(metrics.maxDrawdown).toBeGreaterThanOrEqual(0);
    expect(metrics.maxDrawdownAbs).toBeGreaterThanOrEqual(0);

    // Score Validation (0-100)
    const score = calculateExpectedScore(metrics);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
}

/**
 * Validates consistency between related metrics.
 */
export function validateMetricConsistency(metrics: BasicMetrics, trades: Trade[]) {
    const winners = trades.filter(t => t.profit > 0);
    const losers = trades.filter(t => t.profit < 0);

    // Profit Factor Consistency: Gross Profit / Gross Loss
    const grossProfit = winners.reduce((sum, t) => sum + t.profit, 0);
    const grossLoss = Math.abs(losers.reduce((sum, t) => sum + t.profit, 0));
    
    if (grossLoss === 0) {
        if (grossProfit > 0) expect(metrics.profitFactor).toBe(99.99);
        else expect(metrics.profitFactor).toBe(0);
    } else {
        const expectedPF = Math.round((grossProfit / grossLoss) * 100) / 100;
        expect(metrics.profitFactor).toBeCloseTo(expectedPF, 1);
    }

    // Expectancy Consistency: (WinRate * AvgWin) - (LossRate * AvgLoss)
    const avgWin = winners.length > 0 ? grossProfit / winners.length : 0;
    const avgLoss = losers.length > 0 ? grossLoss / losers.length : 0;
    const wr = winners.length / trades.length;
    const expectedExpectancy = (wr * avgWin) - ((1 - wr) * avgLoss);
    
    expect(metrics.expectancy).toBeCloseTo(expectedExpectancy, 1);

    // Max Drawdown vs Total Profit
    // Max Drawdown (Absolute) should not exceed total equity peak - current equity (it depends on history)
    // But Abs Max Drawdown must be >= 0
    expect(metrics.maxDrawdownAbs).toBeGreaterThanOrEqual(0);
}

/**
 * Validates the integrity of the equity curve.
 */
export function validateEquityCurveIntegrity(equityCurve: number[], trades: Trade[]) {
    // Basic checks
    expect(equityCurve.length).toBeGreaterThan(0);
    
    equityCurve.forEach(val => {
        expect(Number.isFinite(val)).toBe(true);
        expect(val).not.toBeNaN();
    });

    // Integrity: Length should be trades.length + 1 (including start) 
    // IF NOT DOWNSAMPLED. The FullMetrics engine downsamples to 500.
    if (trades.length < 500) {
        expect(equityCurve.length).toBe(trades.length + 1);
        
        // Cumulative integrity
        let runningSum = equityCurve[0];
        for (let i = 0; i < trades.length; i++) {
            runningSum += trades[i].profit;
            // Rounding might apply in production
            expect(equityCurve[i + 1]).toBeCloseTo(runningSum, 1);
        }
    } else {
        expect(equityCurve.length).toBeLessThanOrEqual(501);
    }
}

/**
 * Internal logic representing the 0-100 Strategy Score as calculated in BasicResults.tsx
 */
function calculateExpectedScore(metrics: BasicMetrics): number {
    const edgeRaw = calcEdgeScore(metrics.winrate, metrics.profitFactor, metrics.maxDrawdown, metrics.totalTrades);
    let score = Math.round(edgeRaw * 10);
    
    // Sample size penalty
    if (metrics.totalTrades < 50) score = Math.round(score * 0.6);
    else if (metrics.totalTrades < 100) score = Math.round(score * 0.8);
    
    return Math.min(100, Math.max(0, score));
}
