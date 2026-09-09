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

function numberArray(value: unknown): number[] {
    return Array.isArray(value) && value.every(item => typeof item === "number" && Number.isFinite(item)) ? value : [];
}

/** Normalizes historical flat payloads and the current reduced analyzer payload. */
export function normalizePublicReportMetrics(report: StoredPublicReport): FullMetrics {
    const json = record(report.metrics_json);
    const savedBasic = record(json.basic);
    const savedAdvanced = record(json.advanced);
    const totalTrades = finiteNumber(report.trades_count, finiteNumber(savedBasic.totalTrades));
    const persistedSumProfit = finiteNumber(report.sum_profit, finiteNumber(savedBasic.sumProfit));
    const expectancy = finiteNumber(savedBasic.expectancy, finiteNumber(json.expectancy, totalTrades ? persistedSumProfit / totalTrades : 0));

    return {
        ...json,
        totalTrades,
        winrate: finiteNumber(report.winrate, finiteNumber(savedBasic.winrate)),
        profitFactor: finiteNumber(report.profit_factor, finiteNumber(savedBasic.profitFactor)),
        maxDrawdown: finiteNumber(report.max_drawdown, finiteNumber(savedBasic.maxDrawdown)),
        maxDrawdownAbs: finiteNumber(savedBasic.maxDrawdownAbs, finiteNumber(json.maxDrawdownAbs)),
        expectancy,
        sumProfit: persistedSumProfit || expectancy * totalTrades,
        equityCurve: numberArray(json.equityCurve ?? json.equity_curve),
        drawdownCurve: numberArray(json.drawdownCurve ?? json.drawdown_curve),
        tradeHistogram: numberArray(json.tradeHistogram ?? json.trade_histogram),
        advanced: Object.keys(savedAdvanced).length ? savedAdvanced : undefined,
    } as unknown as FullMetrics;
}

export function getPublicReportDiagnosis(report: StoredPublicReport): DiagnosisVerdict {
    const metrics = normalizePublicReportMetrics(report);
    return getCanonicalDiagnosis(metrics, metrics);
}
