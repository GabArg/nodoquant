/**
 * CSV Adapter — wraps existing parseTrades() to produce NormalizedTrade[].
 * This preserves full backward compatibility with all CSV edge cases already handled.
 */

import { parseTrades, parseGenericCSV, type ParseResult } from "@/lib/analyzer/parser";
import {
    type NormalizedTrade,
    type ImportSource,
    inferMarketType,
    normalizeDirection,
} from "../normalizedTrade";

function tradeToNormalized(t: any, source: ImportSource): NormalizedTrade {
    const symbol = t.symbol ?? "";
    const direction = normalizeDirection(t.direction ?? "");
    const riskMultiple = t.risk_reward ?? null;

    return {
        symbol,
        market_type: inferMarketType(symbol),
        direction,
        entry_price: t.entry_price ?? null,
        exit_price: t.exit_price ?? null,
        stop_loss: t.stop_loss ?? null,
        take_profit: t.take_profit ?? null,
        position_size: t.volume ?? null,
        open_time: t.entry_time ?? null,
        close_time: t.exit_time ?? t.datetime,
        commission: 0,
        swap: 0,
        profit_loss: t.profit,
        risk_multiple: riskMultiple,
        source,
    };
}

/**
 * Parse a generic CSV/TSV string into NormalizedTrade[].
 * Auto-detects MT5 format; falls back to generic CSV.
 */
export function parseCsvToNormalized(
    content: string,
    fileName?: string,
): NormalizedTrade[] {
    const result: ParseResult = parseTrades(content, fileName);
    return result.trades.map((t) => tradeToNormalized(t, "csv"));
}

/**
 * Parse with manual column mapping (from ImportWizard) → NormalizedTrade[].
 */
export function parseMappedCsvToNormalized(
    dataLines: string[],
    mapping: {
        profitIdx: number;
        dateIdx: number;
        symbolIdx: number;
        volumeIdx: number;
        directionIdx?: number;
        entryPriceIdx?: number;
        exitPriceIdx?: number;
        stopLossIdx?: number;
        takeProfitIdx?: number;
        entryTimeIdx?: number;
        fileName?: string;
    },
): NormalizedTrade[] {
    const result = parseGenericCSV(dataLines, mapping);
    return result.trades.map((t) => tradeToNormalized(t, "csv"));
}
