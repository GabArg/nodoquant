/**
 * Binance Adapter — client-side functions to call the NodoQuant Binance proxy.
 *
 * API keys are sent to our server route which calls Binance and immediately returns results.
 * Keys are NEVER stored server-side.
 */

import type {
    ImportSource,
    NormalizedTrade,
} from "../normalizedTrade";

export type BinanceMarket = "spot" | "futures" | "both";

export interface BinanceImportRequest {
    apiKey: string;
    secretKey: string;
    market: BinanceMarket;
}

export interface BinanceImportResult {
    trades: NormalizedTrade[];
    spotCount: number;
    futuresCount: number;
    error?: string;
}

interface BinanceTradeResponse {
    trade_id?: string | number;
    symbol?: string;
    direction?: "long" | "short" | "unknown";
    entry_price?: number | null;
    exit_price?: number | null;
    position_size?: number | null;
    open_time?: string | null;
    close_time?: string | null;
    commission?: number;
    profit_loss?: number;
    source?: ImportSource;
}

interface BinanceSuccessResponse {
    trades: BinanceTradeResponse[];
    spotCount: number;
    futuresCount: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isImportSource(value: unknown): value is ImportSource {
    return (
        value === "csv" ||
        value === "mt4" ||
        value === "mt5" ||
        value === "binance" ||
        value === "binance-spot" ||
        value === "binance-futures" ||
        value === "generic"
    );
}

function parseOptionalNumber(
    value: unknown
): number | null | undefined {
    if (value === null) return null;
    return typeof value === "number" && Number.isFinite(value)
        ? value
        : undefined;
}

function parseOptionalString(
    value: unknown
): string | null | undefined {
    if (value === null) return null;
    return typeof value === "string" ? value : undefined;
}

function parseTrade(value: unknown): BinanceTradeResponse | null {
    if (!isRecord(value)) return null;

    const direction =
        value.direction === "long" ||
        value.direction === "short" ||
        value.direction === "unknown"
            ? value.direction
            : undefined;

    const tradeId =
        typeof value.trade_id === "string" ||
        typeof value.trade_id === "number"
            ? value.trade_id
            : undefined;

    return {
        trade_id: tradeId,
        symbol:
            typeof value.symbol === "string"
                ? value.symbol
                : undefined,
        direction,
        entry_price: parseOptionalNumber(value.entry_price),
        exit_price: parseOptionalNumber(value.exit_price),
        position_size: parseOptionalNumber(value.position_size),
        open_time: parseOptionalString(value.open_time),
        close_time: parseOptionalString(value.close_time),
        commission:
            typeof value.commission === "number" &&
            Number.isFinite(value.commission)
                ? value.commission
                : undefined,
        profit_loss:
            typeof value.profit_loss === "number" &&
            Number.isFinite(value.profit_loss)
                ? value.profit_loss
                : undefined,
        source: isImportSource(value.source)
            ? value.source
            : undefined,
    };
}

function parseSuccessResponse(value: unknown): BinanceSuccessResponse {
    if (!isRecord(value)) {
        return {
            trades: [],
            spotCount: 0,
            futuresCount: 0,
        };
    }

    const trades = Array.isArray(value.trades)
        ? value.trades
              .map(parseTrade)
              .filter(
                  (trade): trade is BinanceTradeResponse =>
                      trade !== null
              )
        : [];

    return {
        trades,
        spotCount:
            typeof value.spotCount === "number" &&
            Number.isFinite(value.spotCount)
                ? value.spotCount
                : 0,
        futuresCount:
            typeof value.futuresCount === "number" &&
            Number.isFinite(value.futuresCount)
                ? value.futuresCount
                : 0,
    };
}

function parseErrorMessage(value: unknown): string | undefined {
    if (!isRecord(value)) return undefined;
    return typeof value.error === "string"
        ? value.error
        : undefined;
}

/**
 * Fetch and normalize Binance trades via the NodoQuant server proxy.
 * The server route calls Binance, normalizes, and returns — keys never stored.
 */
export async function fetchBinanceTrades(
    req: BinanceImportRequest
): Promise<BinanceImportResult> {
    const response = await fetch("/api/import/binance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            apiKey: req.apiKey,
            secretKey: req.secretKey,
            market: req.market,
        }),
    });

    const json: unknown = await response.json();

    if (!response.ok) {
        return {
            trades: [],
            spotCount: 0,
            futuresCount: 0,
            error:
                parseErrorMessage(json) ??
                "Failed to fetch Binance trades",
        };
    }

    const data = parseSuccessResponse(json);

    return {
        trades: data.trades.map(
            (trade): NormalizedTrade => ({
                trade_id: String(trade.trade_id ?? ""),
                symbol: trade.symbol ?? "",
                market_type: "crypto",
                direction: trade.direction ?? "unknown",
                entry_price: trade.entry_price ?? null,
                exit_price: trade.exit_price ?? null,
                stop_loss: null,
                take_profit: null,
                position_size: trade.position_size ?? null,
                open_time: trade.open_time
                    ? new Date(trade.open_time)
                    : null,
                close_time: trade.close_time
                    ? new Date(trade.close_time)
                    : new Date(),
                commission: trade.commission ?? 0,
                swap: 0,
                profit_loss: trade.profit_loss ?? 0,
                risk_multiple: null,
                source: trade.source ?? "binance-spot",
            })
        ),
        spotCount: data.spotCount,
        futuresCount: data.futuresCount,
    };
}
