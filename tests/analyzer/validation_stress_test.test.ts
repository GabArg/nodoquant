import { describe, it, expect } from 'vitest';
import { calcFullMetrics } from '../../lib/analyzer/metrics';
import type { Trade } from '../../lib/analyzer/parser';

describe('Analytics Engine Stress Tests', () => {

    const createTrades = (profits: number[]): Trade[] => {
        return profits.map((p, i) => ({
            datetime: new Date(2026, 0, i + 1),
            profit: p,
            exit_time: new Date(2026, 0, i + 1)
        }));
    };

    // A. Small Sample (N < 20)
    it('should correctly handle small samples (N < 20)', () => {
        const profits = Array(15).fill(10);
        const trades = createTrades(profits);
        const metrics = calcFullMetrics(trades);

        // Edge Confidence should be heavily penalized
        expect(metrics.advanced?.edgeConfidence).toBeLessThan(30);
        expect(metrics.advanced?.robustnessLevel).toBe('fragile');
    });

    // B. Clustered Sequences (High Z-Score)
    it('should detect clustered sequences with high Z-Score', () => {
        // 5 wins, 5 losses repeated 5 times (N=50)
        let profits: number[] = [];
        for (let i = 0; i < 5; i++) {
            profits = [...profits, ...Array(5).fill(10), ...Array(5).fill(-5)];
        }
        const trades = createTrades(profits);
        const metrics = calcFullMetrics(trades);

        expect(Math.abs(metrics.advanced?.zScore || 0)).toBeGreaterThan(2);
        expect(metrics.advanced?.expertTips).toContain('tipZScoreHigh');
    });

    // C. Random Walk (PF ≈ 1.0)
    it('should identify a lack of edge in a random walk', () => {
        const profits = Array(100).fill(0).map(() => Math.random() > 0.5 ? 10 : -10);
        const trades = createTrades(profits);
        const metrics = calcFullMetrics(trades);

        expect(metrics.advanced?.edgeConfidence).toBeLessThan(40);
        expect(['fragile', 'moderate']).toContain(metrics.advanced?.robustnessLevel);
    });

    // D. Robust Strategy
    it('should identify a robust strategy correctly', () => {
        const profits = Array(100).fill(0).map(() => Math.random() > 0.4 ? 20 : -10);
        const trades = createTrades(profits);
        const metrics = calcFullMetrics(trades);

        expect(metrics.advanced?.edgeConfidence).toBeGreaterThan(60);
        expect(['robust', 'elite']).toContain(metrics.advanced?.robustnessLevel);
    });

    // E. Martingale / Skewed Payoff
    it('should flag Martingale-style strategies as fragile', () => {
        // 92 wins of $10, 8 losses of $100
        const profits = [...Array(92).fill(10), ...Array(8).fill(-100)];
        const trades = createTrades(profits);
        const metrics = calcFullMetrics(trades);

        // High winrate but dangerous Skew
        expect(metrics.winrate).toBeGreaterThan(90);
        
        // Edge confidence should be low due to skew penalty
        expect(metrics.advanced?.edgeConfidence).toBeLessThan(40);
        expect(metrics.advanced?.robustnessLevel).toBe('fragile');
    });

    // F. Overfitted Small Sample
    it('should penalize overfitted small samples', () => {
        // 10 trades, 10 wins, 0 losses
        const profits = Array(10).fill(100);
        const trades = createTrades(profits);
        const metrics = calcFullMetrics(trades);

        expect(metrics.profitFactor).toBeGreaterThan(5);
        expect(metrics.advanced?.edgeConfidence).toBeLessThan(30);
        expect(metrics.advanced?.robustnessLevel).toBe('fragile');
    });

    // G. Mathematical Verification (SQN)
    it('should verify SQN formula accuracy', () => {
        const profits = [10, 20, 10, 20, 10, 20, 10, 20, 10, 20]; // N=10, Avg=15, StdDev=5.27
        const trades = createTrades(profits);
        const metrics = calcFullMetrics(trades);

        // SQN = (15 / 5.27) * sqrt(10) ≈ 2.84 * 3.16 ≈ 9.0
        // Wait, SQN in metrics.ts uses (avg / stdDev) * Math.sqrt(n)
        expect(metrics.advanced?.sqn).toBeGreaterThan(8);
    });
});
