/**
 * POST /api/import/binance
 *
 * Proxy route that fetches Binance trade history using provided API credentials.
 * Credentials are used in-request and NEVER persisted.
 *
 * Body: { apiKey: string, secretKey: string, market: "spot" | "futures" | "both" }
 * Returns: { trades: normalized Binance trades, spotCount, futuresCount }
 */

import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";

const BINANCE_BASE = "https://api.binance.com";
const BINANCE_FUTURES_BASE = "https://fapi.binance.com";

type BinanceDirection = "long" | "short";
type BinanceTradeSource = "binance-spot" | "binance-futures";

interface BinanceApiError {
    msg?: string;
}

interface BinanceNormalizedTrade {
    trade_id: string;
    symbol: string;
    market_type: "crypto";
    direction: BinanceDirection;
    entry_price: number;
    exit_price: null;
    position_size: number;
    open_time: string;
    close_time: string;
    commission: number;
    profit_loss: number;
    source: BinanceTradeSource;
}

interface BinanceBalance {
    asset: string;
    free: string;
    locked: string;
}

interface BinanceAccountResponse {
    balances?: BinanceBalance[];
}

interface BinanceExchangeSymbol {
    symbol: string;
    status: string;
    quoteAsset: string;
}

interface BinanceExchangeInfoResponse {
    symbols?: BinanceExchangeSymbol[];
}

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

interface BinanceFuturesTrade {
    symbol: string;
    id: number;
    orderId: number;
    side: string;
    price: string;
    qty: string;
    realizedPnl: string;
    marginAsset: string;
    quoteQty: string;
    commission: string;
    commissionAsset: string;
    time: number;
    positionSide: string;
    buyer: boolean;
    maker: boolean;
}

function buildQuery(params: Record<string, string>): string {
    return Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join("&");
}

function sign(queryString: string, secret: string): string {
    return crypto.createHmac("sha256", secret).update(queryString).digest("hex");
}

function getApiErrorMessage(value: unknown): string | undefined {
    if (typeof value !== "object" || value === null) return undefined;
    const candidate = value as BinanceApiError;
    return typeof candidate.msg === "string" ? candidate.msg : undefined;
}

async function binanceFetch<T>(
    baseUrl: string,
    path: string,
    params: Record<string, string>,
    apiKey: string,
    secretKey: string
): Promise<T> {
    const timestamp = Date.now().toString();
    const query = buildQuery({ ...params, timestamp });
    const signature = sign(query, secretKey);
    const url = `${baseUrl}${path}?${query}&signature=${signature}`;

    const response = await fetch(url, {
        headers: {
            "X-MBX-APIKEY": apiKey,
            "Content-Type": "application/json",
        },
    });

    const json: unknown = await response.json();

    if (!response.ok) {
        throw new Error(
            getApiErrorMessage(json) ?? `Binance API error (${response.status})`
        );
    }

    return json as T;
}

function normalizeSpotTrades(
    raw: BinanceSpotTrade[],
    symbol: string
): BinanceNormalizedTrade[] {
    const orderMap = new Map<number, BinanceSpotTrade[]>();

    for (const fill of raw) {
        const fills = orderMap.get(fill.orderId) ?? [];
        fills.push(fill);
        orderMap.set(fill.orderId, fills);
    }

    const normalized: BinanceNormalizedTrade[] = [];

    for (const [, fills] of orderMap) {
        if (fills.length === 0) continue;

        const firstFill = fills[0];
        const lastFill = fills[fills.length - 1];
        const totalQty = fills.reduce((sum, fill) => sum + parseFloat(fill.qty), 0);
        const totalQuote = fills.reduce((sum, fill) => sum + parseFloat(fill.quoteQty), 0);
        const avgPrice = totalQty > 0 ? totalQuote / totalQty : 0;
        const totalCommission = fills.reduce(
            (sum, fill) => sum + parseFloat(fill.commission),
            0
        );
        const timestamp = lastFill.time;

        normalized.push({
            trade_id: String(firstFill.orderId),
            symbol,
            market_type: "crypto",
            direction: firstFill.isBuyer ? "long" : "short",
            entry_price: avgPrice,
            exit_price: null,
            position_size: totalQty,
            open_time: new Date(timestamp).toISOString(),
            close_time: new Date(timestamp).toISOString(),
            commission: -totalCommission,
            profit_loss: firstFill.isBuyer ? -totalQuote : totalQuote,
            source: "binance-spot",
        });
    }

    return normalized;
}

function normalizeFuturesTrades(
    raw: BinanceFuturesTrade[],
    symbol: string
): BinanceNormalizedTrade[] {
    return raw.map((trade) => ({
        trade_id: String(trade.id),
        symbol,
        market_type: "crypto",
        direction:
            trade.positionSide === "SHORT" || trade.side === "SELL"
                ? "short"
                : "long",
        entry_price: parseFloat(trade.price),
        exit_price: null,
        position_size: parseFloat(trade.qty),
        open_time: new Date(trade.time).toISOString(),
        close_time: new Date(trade.time).toISOString(),
        commission: -parseFloat(trade.commission),
        profit_loss: parseFloat(trade.realizedPnl),
        source: "binance-futures",
    }));
}

async function fetchAllSpotTrades(
    apiKey: string,
    secretKey: string
): Promise<BinanceNormalizedTrade[]> {
    const account = await binanceFetch<BinanceAccountResponse>(
        BINANCE_BASE,
        "/api/v3/account",
        {},
        apiKey,
        secretKey
    );

    const balances = account.balances ?? [];

    const assetsWithBalance = balances
        .filter(
            (balance) =>
                parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0
        )
        .map((balance) => balance.asset)
        .filter((asset) => asset !== "USDT" && asset !== "BUSD");

    if (assetsWithBalance.length === 0) {
        const commonSymbols = [
            "BTCUSDT",
            "ETHUSDT",
            "BNBUSDT",
            "SOLUSDT",
            "XRPUSDT",
            "DOGEUSDT",
            "ADAUSDT",
            "AVAXUSDT",
            "MATICUSDT",
            "DOTUSDT",
        ];

        const all: BinanceNormalizedTrade[] = [];

        for (const symbol of commonSymbols) {
            try {
                const trades = await binanceFetch<BinanceSpotTrade[]>(
                    BINANCE_BASE,
                    "/api/v3/myTrades",
                    { symbol, limit: "1000" },
                    apiKey,
                    secretKey
                );

                if (trades.length > 0) {
                    all.push(...normalizeSpotTrades(trades, symbol));
                }
            } catch {
                // Symbol might not be traded — skip
            }
        }

        return all;
    }

    const all: BinanceNormalizedTrade[] = [];

    for (const asset of assetsWithBalance.slice(0, 30)) {
        const symbol = `${asset}USDT`;

        try {
            const trades = await binanceFetch<BinanceSpotTrade[]>(
                BINANCE_BASE,
                "/api/v3/myTrades",
                { symbol, limit: "1000" },
                apiKey,
                secretKey
            );

            if (trades.length > 0) {
                all.push(...normalizeSpotTrades(trades, symbol));
            }
        } catch {
            // Skip invalid pairs
        }
    }

    return all;
}

async function fetchFuturesTrades(
    apiKey: string,
    secretKey: string
): Promise<BinanceNormalizedTrade[]> {
    const exchangeInfoResponse = await fetch(
        `${BINANCE_FUTURES_BASE}/fapi/v1/exchangeInfo`
    );
    const exchangeInfo =
        (await exchangeInfoResponse.json()) as BinanceExchangeInfoResponse;

    const activeSymbols = (exchangeInfo.symbols ?? [])
        .filter(
            (symbol) =>
                symbol.status === "TRADING" && symbol.quoteAsset === "USDT"
        )
        .map((symbol) => symbol.symbol)
        .slice(0, 40);

    const all: BinanceNormalizedTrade[] = [];

    for (const symbol of activeSymbols) {
        try {
            const trades = await binanceFetch<BinanceFuturesTrade[]>(
                BINANCE_FUTURES_BASE,
                "/fapi/v1/userTrades",
                { symbol, limit: "1000" },
                apiKey,
                secretKey
            );

            if (trades.length > 0) {
                const normalized = normalizeFuturesTrades(trades, symbol);
                all.push(...normalized.filter((trade) => trade.profit_loss !== 0));
            }
        } catch {
            // Symbol might not have any trades — skip
        }
    }

    return all;
}

export async function POST(req: NextRequest) {
    let body: {
        apiKey?: string;
        secretKey?: string;
        market?: string;
    };

    try {
        body = await req.json();
    } catch {
        return NextResponse.json(
            { error: "Invalid request body" },
            { status: 400 }
        );
    }

    const { apiKey, secretKey, market = "both" } = body;

    if (!apiKey?.trim() || !secretKey?.trim()) {
        return NextResponse.json(
            { error: "API key and secret key are required" },
            { status: 400 }
        );
    }

    try {
        let spotTrades: BinanceNormalizedTrade[] = [];
        let futuresTrades: BinanceNormalizedTrade[] = [];

        if (market === "spot" || market === "both") {
            spotTrades = await fetchAllSpotTrades(apiKey.trim(), secretKey.trim());
        }

        if (market === "futures" || market === "both") {
            futuresTrades = await fetchFuturesTrades(
                apiKey.trim(),
                secretKey.trim()
            );
        }

        const allTrades = [...spotTrades, ...futuresTrades].sort(
            (a, b) =>
                new Date(a.close_time).getTime() -
                new Date(b.close_time).getTime()
        );

        if (allTrades.length === 0) {
            return NextResponse.json(
                {
                    error:
                        "No trades found. Make sure your API key has Read permission and you have closed trades on this account.",
                },
                { status: 422 }
            );
        }

        return NextResponse.json({
            trades: allTrades,
            spotCount: spotTrades.length,
            futuresCount: futuresTrades.length,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";

        if (
            message.includes("-2014") ||
            message.includes("API-key format invalid")
        ) {
            return NextResponse.json(
                {
                    error:
                        "Invalid API key format. Check your key and try again.",
                },
                { status: 401 }
            );
        }

        if (
            message.includes("-2015") ||
            message.includes("Invalid API-key")
        ) {
            return NextResponse.json(
                {
                    error:
                        "Invalid API credentials. Check your API key and secret.",
                },
                { status: 401 }
            );
        }

        if (message.includes("-1022") || message.includes("Signature")) {
            return NextResponse.json(
                {
                    error:
                        "Invalid API secret. Please check your secret key.",
                },
                { status: 401 }
            );
        }

        if (message.includes("-2011") || message.includes("permission")) {
            return NextResponse.json(
                {
                    error:
                        "Your API key needs Read permissions enabled. Please update your Binance API key settings.",
                },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { error: `Binance API error: ${message}` },
            { status: 502 }
        );
    }
}
