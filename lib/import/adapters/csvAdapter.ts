/**
 * CSV Adapter — wraps existing parseTrades() to produce NormalizedTrade[].
 * This preserves full backward compatibility with all CSV edge cases already handled.
 */

import {
    parseTrades,
    parseGenericCSV,
    type ParseResult,
    type Trade,
} from "@/lib/analyzer/parser";
import {
    type NormalizedTrade,
    type ImportSource,
    inferMarketType,
    normalizeDirection,
} from "../normalizedTrade";

function tradeToNormalized(
    trade: Trade,
    source: ImportSource
): NormalizedTrade {
    const symbol = trade.symbol ?? "";
    const direction = normalizeDirection(trade.direction ?? "");
    const riskMultiple = trade.risk_reward ?? null;

    return {
        symbol,
        market_type: inferMarketType(symbol),
        direction,
        entry_price: trade.entry_price ?? null,
        exit_price: trade.exit_price ?? null,
        stop_loss: trade.stop_loss ?? null,
        take_profit: trade.take_profit ?? null,
        position_size: trade.volume ?? null,
        open_time: trade.entry_time ?? null,
        close_time: trade.exit_time ?? trade.datetime,
        commission: 0,
        swap: 0,
        profit_loss: trade.profit,
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
    return result.trades.map((trade) =>
        tradeToNormalized(trade, "csv")
    );
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
    return result.trades.map((trade) =>
        tradeToNormalized(trade, "csv")
    );
}
