import type { BasicMetrics, FullMetrics } from "./metrics";

export const FULL_METRICS_SCHEMA_VERSION = 2;

export interface RichMetricsPayload {
    schema_version: 2;
    full_metrics: FullMetrics;
    basic: BasicMetrics;
    equity_curve: number[];
    drawdown_curve: number[];
    trade_histogram: number[];
}

/** FullMetrics contains plain JSON values; this clone also rejects accidental non-JSON values. */
export function serializeFullMetrics(metrics: FullMetrics): RichMetricsPayload {
    const basic: BasicMetrics = {
        totalTrades: metrics.totalTrades,
        winrate: metrics.winrate,
        profitFactor: metrics.profitFactor,
        maxDrawdown: metrics.maxDrawdown,
        maxDrawdownAbs: metrics.maxDrawdownAbs,
        expectancy: metrics.expectancy,
        sumProfit: metrics.sumProfit,
    };

    return {
        schema_version: FULL_METRICS_SCHEMA_VERSION,
        full_metrics: JSON.parse(JSON.stringify(metrics)) as FullMetrics,
        basic,
        equity_curve: metrics.equityCurve,
        drawdown_curve: metrics.drawdownCurve,
        trade_histogram: metrics.tradeHistogram,
    };
}

/**
 * Preserve the pre-v2 fingerprint input exactly. Rich persistence must not make
 * an otherwise identical analysis look new to deduplication.
 */
export function metricsFingerprintProjection(payload: object): object {
    const candidate = payload as Partial<RichMetricsPayload>;
    const full = candidate.schema_version === FULL_METRICS_SCHEMA_VERSION
        ? candidate.full_metrics
        : undefined;

    if (!full) return payload;

    const basic: BasicMetrics = {
        totalTrades: full.totalTrades,
        winrate: full.winrate,
        profitFactor: full.profitFactor,
        maxDrawdown: full.maxDrawdown,
        maxDrawdownAbs: full.maxDrawdownAbs,
        expectancy: full.expectancy,
        sumProfit: full.sumProfit,
    };

    return {
        basic,
        equity_curve: full.equityCurve,
        drawdown_curve: full.drawdownCurve,
        trade_histogram: full.tradeHistogram,
    };
}
