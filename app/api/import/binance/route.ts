/**
 * POST /api/import/binance
 *
 * Proxy route that fetches Binance trade history using provided API credentials.
 * Credentials are used in-request and NEVER persisted.
 *
 * Body: { apiKey: string, secretKey: string, market: "spot" | "futures" | "both" }
 * Returns: { trades: NormalizedTrade[], spotCount, futuresCount }
 */

import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";

// ── Binance API helpers ───────────────────────────────────────────────────────

const BINANCE_BASE = "https://api.binance.com";
const BINANCE_FUTURES_BASE = "https://fapi.binance.com";

function buildQuery(params: Record<string, string>): string {
    return Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");
}

function sign(queryString: string, secret: string): string {
    return crypto.createHmac("sha256", secret).update(queryString).digest("hex");
}

async function binanceFetch(
    baseUrl: string,
    path: string,
    params: Record<string, string>,
    apiKey: string,
    secretKey: string,
) {
    const timestamp = Date.now().toString();
    const query = buildQuery({ ...params, timestamp });
    const signature = sign(query, secretKey);
    const url = `${baseUrl}${path}?${query}&signature=${signature}`;

    const res = await fetch(url, {
        headers: {
            "X-MBX-APIKEY": apiKey,
            "Content-Type": "application/json",
        },
    });

    const json = await res.json();
    if (!res.ok) {
        throw new Error(json?.msg ?? `Binance API error (${res.status})`);
    }
    return json;
}

// ── Spot trade normalization ───────────────────────────────────────────────────
// Binance Spot /api/v3/myTrades returns per-fill trades (not per-position).
// We group fills by orderId to reconstruct positions.

interface BinanceSpotTrade {
    symbol: string;
    orderId: number;
    id: number;
    isBuyer: boolean;
    price: string;
    qty: string;
    quoteQty: string;
    commission: string;
    commissionAsset: string;
    time: number;
    isMaker: boolean;
    isBestMatch: boolean;
}

function normalizeSpotTrades(raw: BinanceSpotTrade[], symbol: string): any[] {
    // Group fills by orderId
    const orderMap = new Map<number, BinanceSpotTrade[]>();
    for (const fill of raw) {
        const fills = orderMap.get(fill.orderId) ?? [];
        fills.push(fill);
        orderMap.set(fill.orderId, fills);
    }

    const normalized: any[] = [];
    for (const [, fills] of orderMap) {
        if (fills.length === 0) continue;
        const isBuy = fills[0].isBuyer;
        const totalQty = fills.reduce((s, f) => s + parseFloat(f.qty), 0);
        const totalQuote = fills.reduce((s, f) => s + parseFloat(f.quoteQty), 0);
        const avgPrice = totalQty > 0 ? totalQuote / totalQty : 0;
        const totalCommission = fills.reduce((s, f) => s + parseFloat(f.commission), 0);
        const time = fills[fills.length - 1].time;

        // Spot trades are individual buy/sell orders — profit_loss is 0 per fill
        // We record them as individual trades with the fill price
        normalized.push({
            trade_id: String(fills[0].orderId),
            symbol,
            market_type: "crypto",
            direction: isBuy ? "long" : "short",
            entry_price: avgPrice,
            exit_price: null,
            position_size: totalQty,
            open_time: new Date(time).toISOString(),
            close_time: new Date(time).toISOString(),
            commission: -totalCommission,
            profit_loss: isBuy ? -totalQuote : totalQuote,
            source: "binance-spot",
        });
    }
    return normalized;
}

// ── Futures trade normalization ───────────────────────────────────────────────
// Binance USDT-M Futures /fapi/v1/userTrades returns closed position snapshots.

interface BinanceFuturesTrade {
    symbol: string;
    id: number;
    orderId: number;
    side: string; // BUY | SELL
    price: string;
    qty: string;
    realizedPnl: string;
    marginAsset: string;
    quoteQty: string;
    commission: string;
    commissionAsset: string;
    time: number;
    positionSide: string; // LONG | SHORT | BOTH
    buyer: boolean;
    maker: boolean;
}

function normalizeFuturesTrades(raw: BinanceFuturesTrade[], symbol: string): any[] {
    return raw.map(t => ({
        trade_id: String(t.id),
        symbol,
        market_type: "crypto",
        direction: t.positionSide === "SHORT" || t.side === "SELL" ? "short" : "long",
        entry_price: parseFloat(t.price),
        exit_price: null,
        position_size: parseFloat(t.qty),
        open_time: new Date(t.time).toISOString(),
        close_time: new Date(t.time).toISOString(),
        commission: -parseFloat(t.commission),
        profit_loss: parseFloat(t.realizedPnl),
        source: "binance-futures",
    }));
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

// Fetch all spot trades for a list of symbols (or all active symbols if none provided)
async function fetchAllSpotTrades(apiKey: string, secretKey: string): Promise<any[]> {
    // First get account info to find symbols with non-zero trades
    const account = await binanceFetch(BINANCE_BASE, "/api/v3/account", {}, apiKey, secretKey);
    const balances: { asset: string; free: string; locked: string }[] = account.balances ?? [];

    // Get symbols from USDT pairs with any balance
    const assetsWithBalance = balances
        .filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
        .map(b => b.asset)
        .filter(a => a !== "USDT" && a !== "BUSD");

    if (assetsWithBalance.length === 0) {
        // Fallback: try to get exchange info symbols (up to 50 most common)
        const commonSymbols = [
            "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT",
            "DOGEUSDT", "ADAUSDT", "AVAXUSDT", "MATICUSDT", "DOTUSDT"
        ];
        const all: any[] = [];
        for (const sym of commonSymbols) {
            try {
                const trades = await binanceFetch(BINANCE_BASE, "/api/v3/myTrades", { symbol: sym, limit: "1000" }, apiKey, secretKey);
                if (Array.isArray(trades) && trades.length > 0) {
                    all.push(...normalizeSpotTrades(trades, sym));
                }
            } catch {
                // Symbol might not be traded — skip
            }
        }
        return all;
    }

    const all: any[] = [];
    for (const asset of assetsWithBalance.slice(0, 30)) { // cap at 30 to avoid rate limits
        const sym = `${asset}USDT`;
        try {
            const trades = await binanceFetch(BINANCE_BASE, "/api/v3/myTrades", { symbol: sym, limit: "1000" }, apiKey, secretKey);
            if (Array.isArray(trades) && trades.length > 0) {
                all.push(...normalizeSpotTrades(trades, sym));
            }
        } catch {
            // Skip invalid pairs
        }
    }
    return all;
}

async function fetchFuturesTrades(apiKey: string, secretKey: string): Promise<any[]> {
    // Get all available futures symbols first
    const exchangeInfo = await fetch(`${BINANCE_FUTURES_BASE}/fapi/v1/exchangeInfo`);
    const info = await exchangeInfo.json();
    const activeSymbols: string[] = (info.symbols ?? [])
        .filter((s: any) => s.status === "TRADING" && s.quoteAsset === "USDT")
        .map((s: any) => s.symbol)
        .slice(0, 40); // cap to avoid rate limits

    const all: any[] = [];
    for (const symbol of activeSymbols) {
        try {
            const trades = await binanceFetch(
                BINANCE_FUTURES_BASE,
                "/fapi/v1/userTrades",
                { symbol, limit: "1000" },
                apiKey,
                secretKey,
            );
            if (Array.isArray(trades) && trades.length > 0) {
                const normalized = normalizeFuturesTrades(trades, symbol);
                // Only include trades with non-zero realized PnL (closed positions)
                all.push(...normalized.filter(t => t.profit_loss !== 0));
            }
        } catch {
            // Symbol might not have any trades — skip
        }
    }
    return all;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    let body: { apiKey?: string; secretKey?: string; market?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { apiKey, secretKey, market = "both" } = body;

    if (!apiKey?.trim() || !secretKey?.trim()) {
        return NextResponse.json({ error: "API key and secret key are required" }, { status: 400 });
    }

    try {
        let spotTrades: any[] = [];
        let futuresTrades: any[] = [];

        if (market === "spot" || market === "both") {
            spotTrades = await fetchAllSpotTrades(apiKey.trim(), secretKey.trim());
        }

        if (market === "futures" || market === "both") {
            futuresTrades = await fetchFuturesTrades(apiKey.trim(), secretKey.trim());
        }

        const allTrades = [...spotTrades, ...futuresTrades]
            .sort((a, b) => new Date(a.close_time).getTime() - new Date(b.close_time).getTime());

        if (allTrades.length === 0) {
            return NextResponse.json({
                error: "No trades found. Make sure your API key has Read permission and you have closed trades on this account.",
            }, { status: 422 });
        }

        return NextResponse.json({
            trades: allTrades,
            spotCount: spotTrades.length,
            futuresCount: futuresTrades.length,
        });

    } catch (err: any) {
        const msg = err?.message ?? "Unknown error";

        // Detect common Binance error codes
        if (msg.includes("-2014") || msg.includes("API-key format invalid")) {
            return NextResponse.json({ error: "Invalid API key format. Check your key and try again." }, { status: 401 });
        }
        if (msg.includes("-2015") || msg.includes("Invalid API-key")) {
            return NextResponse.json({ error: "Invalid API credentials. Check your API key and secret." }, { status: 401 });
        }
        if (msg.includes("-1022") || msg.includes("Signature")) {
            return NextResponse.json({ error: "Invalid API secret. Please check your secret key." }, { status: 401 });
        }
        if (msg.includes("-2011") || msg.includes("permission")) {
            return NextResponse.json({ error: "Your API key needs Read permissions enabled. Please update your Binance API key settings." }, { status: 403 });
        }

        return NextResponse.json({ error: `Binance API error: ${msg}` }, { status: 502 });
    }
}
