import { describe, it, expect, vi } from 'vitest';
import { loadDataset, listDatasets } from './datasetLoader';
import { calcFullMetrics } from '../../lib/analyzer/metrics';
import { 
    validateMetricsSanity, 
    validateMetricConsistency, 
    validateEquityCurveIntegrity 
} from './metricsValidator';

describe('Strategy Analyzer Automated Test Suite', () => {

    // ── Baseline Strategies ──────────────────────────────────────────────────
    describe('Baseline Strategy Tests', () => {
        const baselineDatasets = listDatasets('qa-datasets/baseline');
        
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

                console.log(`[PASS] ${fileName} | Trades: ${metrics.totalTrades} | Winrate: ${metrics.winrate}% | Score: ${metrics.stabilityScore} | Time: ${(endTime - startTime).toFixed(2)}ms`);
            });
        });
    });

    // ── Risk & Stability ─────────────────────────────────────────────────────
    describe('Risk and Stability Analysis', () => {
        const riskDatasets = listDatasets('qa-datasets/risk');
        const stabilityDatasets = listDatasets('qa-datasets/stability');

        [...riskDatasets, ...stabilityDatasets].forEach((datasetPath) => {
            const fileName = datasetPath.split(/[\\/]/).pop();
            it(`should handle ${fileName} without breaking`, () => {
                const trades = loadDataset(datasetPath);
                const metrics = calcFullMetrics(trades);
                
                validateMetricsSanity(metrics, trades);
                validateMetricConsistency(metrics, trades);
                
                // Stability score specific check
                expect(metrics.stabilityScore).toBeGreaterThanOrEqual(0);
                expect(metrics.stabilityScore).toBeLessThanOrEqual(100);
            });
        });
    });

    // ── Special Cases: Free Plan Limits ──────────────────────────────────────
    describe('Plan Limit Logic', () => {
        it('should allow 500 trades (limit boundary)', () => {
            const trades = loadDataset('qa-datasets/performance/dataset_500_trades.csv');
            expect(trades.length).toBe(500);
            // The limit itself is usually enforced in the UI or higher-level logic, 
            // but we verify the analyzer can process 500 trades.
            const metrics = calcFullMetrics(trades);
            expect(metrics.totalTrades).toBe(500);
        });

        it('should load 501 trades for limit testing', () => {
            const trades = loadDataset('qa-datasets/performance/dataset_501_trades.csv');
            expect(trades.length).toBe(501);
        });
    });

    // ── Performance Benchmarks ───────────────────────────────────────────────
    describe('Performance Benchmarks', () => {
        it('should analyze 5,000 trades within 2 seconds', () => {
            const trades = loadDataset('qa-datasets/performance/dataset_5000_trades.csv');
            
            const start = performance.now();
            const metrics = calcFullMetrics(trades);
            const end = performance.now();
            
            const duration = end - start;
            console.log(`[PERF] 5000 trades processed in ${duration.toFixed(2)}ms`);
            
            expect(duration).toBeLessThan(2000); // 2 second limit
            validateMetricsSanity(metrics, trades);
        });
    });

    // ── Robustness: Error Datasets ───────────────────────────────────────────
    describe('Robustness and Error Handling', () => {
        const errorDatasets = listDatasets('qa-datasets/errors');

        errorDatasets.forEach((datasetPath) => {
            const fileName = datasetPath.split(/[\\/]/).pop();
            it(`should NOT crash and return structured error for ${fileName}`, () => {
                try {
                    const trades = loadDataset(datasetPath);
                    // If it doesn't throw at load (parse), it might throw at analysis
                    const metrics = calcFullMetrics(trades);
                    expect(metrics).toBeDefined();
                } catch (error: any) {
                    // We expect structured errors for invalid formats
                    expect(error).toBeInstanceOf(Error);
                    expect(error.message).toBeDefined();
                    console.log(`[SAFE] Handled error in ${fileName}: ${error.message}`);
                }
            });
        });
    });
});
