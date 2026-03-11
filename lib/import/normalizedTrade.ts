/**
 * NormalizedTrade — the single canonical format for all import sources.
 * Every adapter (CSV, MT4, MT5, Binance) must produce NormalizedTrade[].
 */

import type { Trade } from "@/lib/analyzer/parser";

export type ImportSource = "csv" | "mt4" | "mt5" | "binance-spot" | "binance-futures" | "generic";

export type MarketType = "forex" | "crypto" | "futures" | "stocks" | "indices" | "unknown";

export interface NormalizedTrade {
    /** External trade ID from the source system (optional) */
    trade_id?: string;
    /** Instrument symbol, e.g. "EURUSD", "BTCUSDT" */
    symbol: string;
    /** Asset class */
    market_type: MarketType;
    /** Trade direction */
    direction: "long" | "short" | "unknown";
    /** Entry price */
    entry_price: number | null;
    /** Exit price */
    exit_price: number | null;
    /** Stop loss level (optional) */
    stop_loss: number | null;
    /** Take profit level (optional) */
    take_profit: number | null;
    /** Position size / lot size / quantity */
    position_size: number | null;
    /** When the position was opened */
    open_time: Date | null;
    /** When the position was closed */
    close_time: Date;
    /** Broker commission (negative value = cost) */
    commission: number;
    /** Overnight swap / rollover cost */
    swap: number;
    /** Net profit/loss in account currency */
    profit_loss: number;
    /** Risk multiple (R): profit / initial risk, null if SL unknown */
    risk_multiple: number | null;
    /** Source system this trade came from */
    source: ImportSource;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Infer market type from symbol string.
 * Very heuristic — can be refined over time.
 */
export function inferMarketType(symbol: string): MarketType {
    if (!symbol) return "unknown";
    const s = symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");

    // Crypto: ends in USDT, USDC, BTC, ETH, BNB, or common exchange pairs
    if (/USDT$|USDC$|BUSD$|DAI$/.test(s)) return "crypto";
    if (/BTC|ETH|BNB|SOL|XRP|DOGE|ADA/.test(s) && s.length <= 10) return "crypto";

    // Forex: 6-char currency pairs (EURUSD, GBPJPY, AUDUSD…)
    const CURRENCIES = ["EUR", "USD", "GBP", "JPY", "AUD", "CAD", "CHF", "NZD", "SGD", "HKD", "NOK", "SEK", "DKK"];
    if (s.length === 6) {
        const base = s.slice(0, 3);
        const quote = s.slice(3, 6);
        if (CURRENCIES.includes(base) && CURRENCIES.includes(quote)) return "forex";
    }
    // Forex with suffix: EURUSD.r, EURUSD_FX, etc.
    if (s.length <= 10) {
        const stripped = s.replace(/[^A-Z]/, "").slice(0, 6);
        const base = stripped.slice(0, 3);
        const quote = stripped.slice(3, 6);
        if (CURRENCIES.includes(base) && CURRENCIES.includes(quote)) return "forex";
    }

    // Indices
    if (/^(US30|US500|NAS100|DAX|FTSE|SP500|DJI|NDX|CAC|NIKKEI)/.test(s)) return "indices";

    // Futures: contains space or ends in month code
    if (/^[A-Z]{2,6}\d{2,6}$/.test(s)) return "futures";

    return "unknown";
}

/**
 * Normalize direction string from various broker formats to long/short/unknown.
 */
export function normalizeDirection(raw: string): "long" | "short" | "unknown" {
    if (!raw) return "unknown";
    const s = raw.toLowerCase().trim();
    if (s === "buy" || s === "long" || s === "b") return "long";
    if (s === "sell" || s === "short" || s === "s") return "short";
    if (s === "out" || s === "close") return "unknown"; // direction unclear from close leg only
    return "unknown";
}

// ── Converter: NormalizedTrade → Trade (for the existing metrics engine) ──────

/**
 * Convert NormalizedTrade to the legacy Trade format consumed by `calcBasicMetrics` etc.
 */
export function toTrade(n: NormalizedTrade): Trade {
    return {
        datetime: n.close_time,
        exit_time: n.close_time,
        entry_time: n.open_time ?? undefined,
        profit: n.profit_loss,
        symbol: n.symbol || undefined,
        direction: n.direction === "unknown" ? undefined : n.direction,
        entry_price: n.entry_price ?? undefined,
        exit_price: n.exit_price ?? undefined,
        stop_loss: n.stop_loss ?? undefined,
        take_profit: n.take_profit ?? undefined,
        volume: n.position_size ?? undefined,
        risk_reward: n.risk_multiple ?? undefined,
    };
}

/**
 * Convert an array of NormalizedTrades to legacy Trade[] for metrics engine.
 */
export function toTradeArray(normalized: NormalizedTrade[]): Trade[] {
    return normalized.map(toTrade);
}

/**
 * Build a ParseResult-compatible object from NormalizedTrade[].
 */
export function buildParseResult(
    trades: NormalizedTrade[],
    source: ImportSource,
    fileName?: string,
) {
    const legacyTrades = toTradeArray(trades);
    const sorted = [...legacyTrades].sort((a, b) => a.datetime.getTime() - b.datetime.getTime());
    const sumProfit = sorted.reduce((s, t) => s + t.profit, 0);

    return {
        trades: sorted,
        format: (source.startsWith("binance") ? "csv-generic" : source) as "mt5" | "csv-generic" | "unknown",
        fileName,
        dateRangeStart: sorted[0]?.datetime,
        dateRangeEnd: sorted[sorted.length - 1]?.datetime,
        sumProfit,
        importSource: source,
    };
}
