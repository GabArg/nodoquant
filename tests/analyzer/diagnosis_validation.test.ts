import { describe, it, expect } from 'vitest';
import { loadDataset } from './datasetLoader';
import { calcFullMetrics } from '../../lib/analyzer/metrics';

describe('Diagnosis Validation on Synthetic Datasets', () => {

    // Helper to calculate metrics directly from path
    const getMetricsForDataset = (relativePath: string) => {
        const trades = loadDataset(relativePath);
        return calcFullMetrics(trades);
    };

    describe('Dataset A: High Drawdown (200 trades)', () => {
        it('should correctly classify the edge and flag high risk', () => {
            const metrics = getMetricsForDataset('tests/datasets/dataset_a_high_dd.csv');
            
            // Expected Diagnosis: Not No Edge
            expect(metrics.advanced?.verdict).not.toBe('noEdge');
            
            // Risk Level: Large Drawdown (expected actual is > 10%)
            expect(Math.abs(metrics.maxDrawdown)).toBeGreaterThan(10);
            
            // Probability of Ruin should reflect high volatility
            expect(metrics.riskOfRuin).toBeGreaterThan(0);
        });
    });

    describe('Dataset B: Overfitted Strategy (80 trades)', () => {
        it('should assign a Weak Edge verdict due to sample limitations', () => {
            const metrics = getMetricsForDataset('tests/datasets/dataset_b_overfitted.csv');
            
            // Expectancy is positive, but confidence limited by size
            expect(metrics.expectancy).toBeGreaterThan(0);
            
            // Expected Diagnosis: Weak Edge
            expect(metrics.advanced?.verdict).toBe('weakEdge');
            
            // Edge Confidence should not be elite (expected < 90)
            expect(metrics.advanced?.edgeConfidence).toBeLessThan(90);
        });
    });

    describe('Dataset C: Edge Decay Strategy (150 trades)', () => {
        it('should detect degradation in edge stability', () => {
            const metrics = getMetricsForDataset('tests/datasets/dataset_c_decay.csv');
            
            // The signal should indicate caution or drift since the last 75 trades are losing
            expect(['warning', 'caution']).toContain(metrics.edgeDecay?.signal);
            
            // Baseline SQN should be higher than Recent SQN
            expect(metrics.edgeDecay?.baselineSQN).toBeGreaterThan(metrics.edgeDecay?.recentSQN || 0);
        });
    });

});
