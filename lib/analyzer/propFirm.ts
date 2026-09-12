import type { FullMetrics } from "./metrics";
import { deserializeNormalizedTradeSequence, groupNormalizedTradesByUtcDay, type NormalizedSimulationTrade } from "./normalizedTradeSequence";

export type DrawdownType = "static" | "trailing";
export type DailyLossCalculation = "balance" | "equity" | "balanceOrEquity";

export interface PropFirmPhaseConfig {
    id: string;
    name: string;
    profitTargetPct: number;
    dailyLossLimitPct?: number;
    maxLossLimitPct?: number;
    minTradingDays?: number;
    maxTradingDays?: number;
}

export interface PropFirmConfig {
    id: string;
    name: string;
    provider?: string;
    accountSize: number;
    phases: PropFirmPhaseConfig[];
    dailyLossLimitPct: number;
    maxLossLimitPct: number;
    drawdownType: DrawdownType;
    dailyLossCalculation: DailyLossCalculation;
    tradesPerDayEstimate: number;
    consistencyRulePct?: number;
    version?: string;
    sourceUpdatedAt?: string;
}

export interface StrategySimulationData {
    outcomes: number[];
    source: "normalizedTradeSequence" | "histogramApproximation";
    trades?: NormalizedSimulationTrade[];
    hasTimestamps?: boolean;
}

export type PropFirmFailureCause = "dailyLoss" | "maxLoss" | "targetNotReached" | "consistency";

export interface PropFirmSimulationResult {
    status: "completed" | "insufficientData";
    iterations: number;
    passed: number;
    phasePassProbabilities: number[];
    totalPassProbability: number | null;
    dailyLossViolationProbability: number | null;
    maxLossViolationProbability: number | null;
    targetNotReachedProbability: number | null;
    consistencyViolationProbability: number | null;
    consistencyScore: number | null;
    expectedTradesToPass: number | null;
    durationDays: { p5: number; p50: number; p95: number } | null;
    failureCounts: Record<PropFirmFailureCause, number>;
    primaryFailureCause: PropFirmFailureCause | null;
    dataSource: StrategySimulationData["source"];
}

/** DB-agnostic envelope reserved for a future persistence layer. */
export interface PersistablePropFirmSimulation {
    strategyId: string;
    config: PropFirmConfig;
    simulationResult: PropFirmSimulationResult;
    createdAt: string;
}

export const CUSTOM_PROP_FIRM_CONFIG: PropFirmConfig = {
    id: "custom",
    name: "Personalizado",
    accountSize: 100000,
    phases: [{ id: "phase-1", name: "Fase 1", profitTargetPct: 10 }],
    dailyLossLimitPct: 5,
    maxLossLimitPct: 10,
    drawdownType: "static",
    dailyLossCalculation: "balanceOrEquity",
    tradesPerDayEstimate: 5,
};

export function validatePropFirmConfig(config: PropFirmConfig): string[] {
    const errors: string[] = [];
    if (!Number.isFinite(config.accountSize) || config.accountSize <= 0) errors.push("accountSize");
    if (!Number.isFinite(config.dailyLossLimitPct) || config.dailyLossLimitPct <= 0 || config.dailyLossLimitPct >= 100) errors.push("dailyLossLimitPct");
    if (!Number.isFinite(config.maxLossLimitPct) || config.maxLossLimitPct <= 0 || config.maxLossLimitPct >= 100) errors.push("maxLossLimitPct");
    if (!Number.isInteger(config.tradesPerDayEstimate) || config.tradesPerDayEstimate <= 0) errors.push("tradesPerDayEstimate");
    if (!Array.isArray(config.phases) || config.phases.length === 0) errors.push("phases");
    config.phases.forEach((phase, index) => {
        if (!Number.isFinite(phase.profitTargetPct) || phase.profitTargetPct <= 0) errors.push(`phases.${index}.profitTargetPct`);
        if (phase.minTradingDays != null && (!Number.isInteger(phase.minTradingDays) || phase.minTradingDays < 0)) errors.push(`phases.${index}.minTradingDays`);
        if (phase.maxTradingDays != null && (!Number.isInteger(phase.maxTradingDays) || phase.maxTradingDays <= 0)) errors.push(`phases.${index}.maxTradingDays`);
        if (phase.minTradingDays != null && phase.maxTradingDays != null && phase.minTradingDays > phase.maxTradingDays) errors.push(`phases.${index}.tradingDays`);
    });
    return errors;
}

export function strategySimulationDataFromPersistedMetrics(metrics: FullMetrics): StrategySimulationData | null {
    const normalized = deserializeNormalizedTradeSequence(metrics.simulationData);
    if (normalized && normalized.length >= 10) {
        const dayGroups = groupNormalizedTradesByUtcDay(normalized);
        return {
            outcomes: normalized.map(trade => trade.profit),
            source: "normalizedTradeSequence",
            trades: normalized,
            hasTimestamps: dayGroups.length > 0,
        };
    }
    const counts = metrics.tradeHistogram;
    if (!Array.isArray(counts) || counts.length === 0 || !Number.isFinite(metrics.minProfit) || !Number.isFinite(metrics.maxProfit)) return null;
    const width = metrics.maxProfit === metrics.minProfit ? 0 : (metrics.maxProfit - metrics.minProfit) / counts.length;
    const outcomes = counts.flatMap((count, index) => {
        const safeCount = Number.isInteger(count) && count > 0 ? count : 0;
        const midpoint = width === 0 ? metrics.minProfit : metrics.minProfit + width * (index + 0.5);
        return Array.from({ length: safeCount }, () => midpoint);
    });
    return outcomes.length >= 10 ? { outcomes, source: "histogramApproximation", hasTimestamps: false } : null;
}

/** Backwards-compatible name used by existing consumers. */
export const strategyDataFromMetrics = strategySimulationDataFromPersistedMetrics;

export function runPropFirmMonteCarlo(
    strategy: StrategySimulationData,
    config: PropFirmConfig,
    iterations = 1000,
    random: () => number = Math.random,
): PropFirmSimulationResult {
    if (validatePropFirmConfig(config).length || strategy.outcomes.length < 2 || iterations <= 0) {
        return emptyResult(iterations, strategy.source);
    }
    const losses = strategy.outcomes.filter(value => value < 0);
    if (!losses.length) return emptyResult(iterations, strategy.source);
    const averageLoss = Math.abs(losses.reduce((sum, value) => sum + value, 0) / losses.length);
    if (!Number.isFinite(averageLoss) || averageLoss === 0) return emptyResult(iterations, strategy.source);
    const normalizedR = strategy.outcomes.map(value => value / averageLoss);
    const temporalDayGroups = strategy.trades && strategy.hasTimestamps
        ? groupNormalizedTradesByUtcDay(strategy.trades).map(group => group.map(trade => trade.profit / averageLoss))
        : [];
    const phasePassCounts = config.phases.map(() => 0);
    const failures: Record<PropFirmFailureCause, number> = { dailyLoss: 0, maxLoss: 0, targetNotReached: 0, consistency: 0 };
    const passDurations: number[] = [];
    const passDurationDays: number[] = [];
    let passed = 0;

    for (let iteration = 0; iteration < iterations; iteration++) {
        let totalTrades = 0;
        let totalDays = 0;
        let failed: PropFirmFailureCause | null = null;
        for (let phaseIndex = 0; phaseIndex < config.phases.length; phaseIndex++) {
            const phase = config.phases[phaseIndex];
            const maxDays = phase.maxTradingDays ?? Math.max(20, temporalDayGroups.length || Math.ceil(strategy.outcomes.length / config.tradesPerDayEstimate));
            const dailyLimit = phase.dailyLossLimitPct ?? config.dailyLossLimitPct;
            const maxLimit = phase.maxLossLimitPct ?? config.maxLossLimitPct;
            let equity = 100;
            let peak = 100;
            let dayStartBalance = 100;
            let dayStartEquity = 100;
            let largestWinningDay = 0;
            let totalProfit = 0;
            let phasePassed = false;

            for (let dayIndex = 0; dayIndex < maxDays && !phasePassed && !failed; dayIndex++) {
                dayStartBalance = equity;
                dayStartEquity = equity;
                totalDays++;
                const dailyOutcomes = temporalDayGroups.length
                    ? temporalDayGroups[Math.min(temporalDayGroups.length - 1, Math.floor(random() * temporalDayGroups.length))]
                    : Array.from({ length: config.tradesPerDayEstimate }, () => normalizedR[Math.min(normalizedR.length - 1, Math.floor(random() * normalizedR.length))]);
                for (const outcomePct of dailyOutcomes) {
                    equity += outcomePct;
                    totalTrades++;
                    peak = Math.max(peak, equity);
                    totalProfit += Math.max(0, outcomePct);
                    largestWinningDay = Math.max(largestWinningDay, Math.max(0, equity - dayStartBalance));
                    const dailyBaseline = config.dailyLossCalculation === "balance" ? dayStartBalance : config.dailyLossCalculation === "equity" ? dayStartEquity : Math.max(dayStartBalance, dayStartEquity);
                    if (dailyBaseline - equity >= dailyLimit) { failed = "dailyLoss"; break; }
                    const maxBaseline = config.drawdownType === "trailing" ? peak : 100;
                    if (maxBaseline - equity >= maxLimit) { failed = "maxLoss"; break; }
                    if (equity - 100 >= phase.profitTargetPct && dayIndex + 1 >= (phase.minTradingDays ?? 0)) {
                        if (config.consistencyRulePct != null && totalProfit > 0 && largestWinningDay / totalProfit * 100 > config.consistencyRulePct) failed = "consistency";
                        else phasePassed = true;
                        break;
                    }
                }
            }
            if (!phasePassed) {
                failed ??= "targetNotReached";
                break;
            }
            phasePassCounts[phaseIndex]++;
        }
        if (failed) failures[failed]++;
        else { passed++; passDurations.push(totalTrades); passDurationDays.push(totalDays); }
    }

    const failureEntries = Object.entries(failures) as Array<[PropFirmFailureCause, number]>;
    const primaryFailureCause = failureEntries.reduce<([PropFirmFailureCause, number] | null)>((best, item) => !best || item[1] > best[1] ? item : best, null);
    const consistencyScore = calculateConsistencyScore(normalizedR);
    return {
        status: "completed", iterations, passed,
        phasePassProbabilities: phasePassCounts.map(count => roundPct(count / iterations * 100)),
        totalPassProbability: roundPct(passed / iterations * 100),
        dailyLossViolationProbability: roundPct(failures.dailyLoss / iterations * 100),
        maxLossViolationProbability: roundPct(failures.maxLoss / iterations * 100),
        targetNotReachedProbability: roundPct(failures.targetNotReached / iterations * 100),
        consistencyViolationProbability: roundPct(failures.consistency / iterations * 100),
        consistencyScore,
        expectedTradesToPass: passDurations.length ? Math.round(passDurations.reduce((a, b) => a + b, 0) / passDurations.length) : null,
        durationDays: passDurations.length ? (temporalDayGroups.length ? percentileValues(passDurationDays) : percentileDays(passDurations, config.tradesPerDayEstimate)) : null,
        failureCounts: failures,
        primaryFailureCause: primaryFailureCause && primaryFailureCause[1] > 0 ? primaryFailureCause[0] : null,
        dataSource: strategy.source,
    };
}

function emptyResult(iterations: number, source: StrategySimulationData["source"]): PropFirmSimulationResult {
    return { status: "insufficientData", iterations, passed: 0, phasePassProbabilities: [], totalPassProbability: null, dailyLossViolationProbability: null, maxLossViolationProbability: null, targetNotReachedProbability: null, consistencyViolationProbability: null, consistencyScore: null, expectedTradesToPass: null, durationDays: null, failureCounts: { dailyLoss: 0, maxLoss: 0, targetNotReached: 0, consistency: 0 }, primaryFailureCause: null, dataSource: source };
}

function calculateConsistencyScore(values: number[]): number {
    const positives = values.filter(value => value > 0).sort((a, b) => b - a);
    const total = positives.reduce((sum, value) => sum + value, 0);
    if (!total) return 0;
    const top = positives.slice(0, Math.max(1, Math.ceil(values.length * 0.1))).reduce((sum, value) => sum + value, 0);
    const concentration = top / total * 100;
    return Math.round(Math.max(0, 100 - Math.max(0, concentration - 50) * 2));
}

function percentileDays(trades: number[], tradesPerDay: number) {
    const sorted = [...trades].sort((a, b) => a - b);
    const at = (pct: number) => Math.ceil(sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * pct))] / tradesPerDay);
    return { p5: at(0.05), p50: at(0.5), p95: at(0.95) };
}

function percentileValues(values: number[]) {
    const sorted = [...values].sort((a, b) => a - b);
    const at = (pct: number) => sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * pct))];
    return { p5: at(0.05), p50: at(0.5), p95: at(0.95) };
}

function roundPct(value: number) { return Math.round(value * 10) / 10; }
