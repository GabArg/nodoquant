import { getCanonicalDiagnosis } from "./diagnosis";
import type { DiagnosisVerdict, FullMetrics } from "./metrics";

type JsonRecord = Record<string, unknown>;

export interface StoredPublicReport {
    trades_count: number;
    winrate: number;
    profit_factor: number;
    max_drawdown: number;
    sum_profit: number;
    metrics_json: unknown;
}

function record(value: unknown): JsonRecord {
    return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function finiteNumber(value: unknown, fallback = 0): number {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function optionalFiniteNumber(value: unknown): number | null {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export interface NormalizedPublicReportMetrics {
    metrics: FullMetrics;
    edgeConfidence: number | null;
    strategyScore: number | null;
    availability: ReportMetricAvailability;
}

export interface ReportMetricAvailability {
    edgeConfidence: boolean;
    riskOfRuin: boolean;
    riskAnalysis: boolean;
    stability: boolean;
    evolution: boolean;
    monteCarlo: boolean;
    propFirm: boolean;
    intelligence: boolean;
}

function numberArray(value: unknown): number[] {
    return Array.isArray(value) && value.every(item => typeof item === "number" && Number.isFinite(item)) ? value : [];
}

/** Normalizes historical flat payloads and the current reduced analyzer payload. */
export function normalizePublicReportMetrics(report: StoredPublicReport): NormalizedPublicReportMetrics {
    const json = record(report.metrics_json);
    const richMetrics = record(json.full_metrics);
    const source = Object.keys(richMetrics).length ? richMetrics : json;
    const savedBasic = record(json.basic);
    const savedAdvanced = record(source.advanced);
    const totalTrades = finiteNumber(report.trades_count, finiteNumber(source.totalTrades, finiteNumber(savedBasic.totalTrades)));
    const persistedSumProfit = finiteNumber(report.sum_profit, finiteNumber(source.sumProfit, finiteNumber(savedBasic.sumProfit)));
    const expectancy = finiteNumber(source.expectancy, finiteNumber(savedBasic.expectancy, finiteNumber(json.expectancy, totalTrades ? persistedSumProfit / totalTrades : 0)));

    const riskOfRuin = optionalFiniteNumber(source.riskOfRuin);
    const riskAnalysis = record(source.riskAnalysis);
    const monteCarlo = record(source.monteCarlo);
    const stabilityScore = optionalFiniteNumber(source.stabilityScore);
    const stabilityAnalysis = record(source.stabilityAnalysis);
    const evolution = record(source.evolution);
    const propFirm = record(source.propFirm);
    const edgeDecay = record(source.edgeDecay);
    const hasMonteCarlo = Array.isArray(monteCarlo.simulations) && optionalFiniteNumber(monteCarlo.riskOfRuin) !== null;

    const metrics = {
        ...source,
        totalTrades,
        winrate: finiteNumber(report.winrate, finiteNumber(savedBasic.winrate)),
        profitFactor: finiteNumber(report.profit_factor, finiteNumber(savedBasic.profitFactor)),
        maxDrawdown: finiteNumber(report.max_drawdown, finiteNumber(savedBasic.maxDrawdown)),
        maxDrawdownAbs: finiteNumber(source.maxDrawdownAbs, finiteNumber(savedBasic.maxDrawdownAbs, finiteNumber(json.maxDrawdownAbs))),
        expectancy,
        sumProfit: optionalFiniteNumber(report.sum_profit) !== null || optionalFiniteNumber(source.sumProfit) !== null || optionalFiniteNumber(savedBasic.sumProfit) !== null
            ? persistedSumProfit
            : expectancy * totalTrades,
        equityCurve: numberArray(source.equityCurve ?? json.equity_curve),
        drawdownCurve: numberArray(source.drawdownCurve ?? json.drawdown_curve),
        tradeHistogram: numberArray(source.tradeHistogram ?? json.trade_histogram),
        advanced: Object.keys(savedAdvanced).length ? savedAdvanced : undefined,
        riskOfRuin: riskOfRuin ?? undefined,
        riskAnalysis: Object.keys(riskAnalysis).length ? riskAnalysis : undefined,
        monteCarlo: Object.keys(monteCarlo).length ? monteCarlo : undefined,
        stabilityScore: stabilityScore ?? undefined,
        stabilityAnalysis: Object.keys(stabilityAnalysis).length ? stabilityAnalysis : undefined,
        evolution: Object.keys(evolution).length ? evolution : undefined,
        propFirm: Object.keys(propFirm).length ? propFirm : undefined,
        edgeDecay: Object.keys(edgeDecay).length ? edgeDecay : undefined,
    } as unknown as FullMetrics;

    const edgeConfidence = optionalFiniteNumber(savedAdvanced.edgeConfidence);

    return {
        metrics,
        edgeConfidence,
        strategyScore: optionalFiniteNumber(source.strategy_score ?? source.quant_score),
        availability: {
            edgeConfidence: edgeConfidence !== null,
            riskOfRuin: riskOfRuin !== null,
            riskAnalysis: Object.keys(riskAnalysis).length > 0,
            stability: stabilityScore !== null,
            evolution: Object.keys(evolution).length > 0,
            monteCarlo: hasMonteCarlo,
            propFirm: Object.keys(propFirm).length > 0,
            intelligence: Object.keys(edgeDecay).length > 0 || (
                optionalFiniteNumber(savedAdvanced.sqn) !== null &&
                optionalFiniteNumber(savedAdvanced.zScore) !== null &&
                typeof savedAdvanced.robustnessLevel === "string"
            ),
        },
    };
}

export function getPublicReportDiagnosis(report: StoredPublicReport): DiagnosisVerdict {
    const { metrics } = normalizePublicReportMetrics(report);
    return getCanonicalDiagnosis(metrics, metrics);
}
