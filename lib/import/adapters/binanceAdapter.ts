/**
 * Binance Adapter — client-side functions to call the NodoQuant Binance proxy.
 *
 * API keys are sent to our server route which calls Binance and immediately returns results.
 * Keys are NEVER stored server-side.
 */

import type { NormalizedTrade } from "../normalizedTrade";

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

/**
 * Fetch and normalize Binance trades via the NodoQuant server proxy.
 * The server route calls Binance, normalizes, and returns — keys never stored.
 */
export async function fetchBinanceTrades(
    req: BinanceImportRequest,
): Promise<BinanceImportResult> {
    const res = await fetch("/api/import/binance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            apiKey: req.apiKey,
            secretKey: req.secretKey,
            market: req.market,
        }),
    });

    const json = await res.json();

    if (!res.ok) {
        return {
            trades: [],
            spotCount: 0,
            futuresCount: 0,
            error: json.error ?? "Failed to fetch Binance trades",
        };
    }

    return {
        trades: (json.trades ?? []).map((t: any): NormalizedTrade => ({
            trade_id: String(t.trade_id ?? ""),
            symbol: t.symbol ?? "",
            market_type: "crypto",
            direction: t.direction ?? "unknown",
            entry_price: t.entry_price ?? null,
            exit_price: t.exit_price ?? null,
            stop_loss: null,
            take_profit: null,
            position_size: t.position_size ?? null,
            open_time: t.open_time ? new Date(t.open_time) : null,
            close_time: t.close_time ? new Date(t.close_time) : new Date(),
            commission: t.commission ?? 0,
            swap: 0,
            profit_loss: t.profit_loss ?? 0,
            risk_multiple: null,
            source: t.source ?? "binance-spot",
        })),
        spotCount: json.spotCount ?? 0,
        futuresCount: json.futuresCount ?? 0,
    };
}
