/**
 * POST /api/import/mt4
 * Server-side MT4 HTML statement parser.
 * Accepts an HTML string, returns parsed normalized trades.
 */

import { NextRequest, NextResponse } from "next/server";

interface ParsedTrade {
    symbol: string;
    direction: string;
    entry_price: number | null;
    exit_price: number | null;
    position_size: number | null;
    open_time: string | null;
    close_time: string;
    commission: number;
    swap: number;
    profit_loss: number;
    source: "mt4";
}


function parseNum(raw: string | null | undefined): number {
    if (!raw) return 0;
    return parseFloat(String(raw).replace(/\s/g, "").replace(",", ".")) || 0;
}

function parseDate(raw: string): string | null {
    if (!raw) return null;
    const mt4 = raw.match(/^(\d{4})\.(\d{2})\.(\d{2})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?/);
    if (mt4) {
        const [, y, mo, d, h = "00", mi = "00", s = "00"] = mt4;
        return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`).toISOString();
    }
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d.toISOString();
}

function normalizeDirection(raw: string): "long" | "short" | "unknown" {
    const s = raw.toLowerCase().trim();
    if (s === "buy" || s === "long") return "long";
    if (s === "sell" || s === "short") return "short";
    return "unknown";
}

/**
 * Parse MT4 HTML statement using simple regex-based table extraction.
 * (No DOM APIs available in Node.js — use lightweight string parsing.)
 */
function parseMT4HtmlServer(html: string): ParsedTrade[] {
    const trades: ParsedTrade[] = [];

    // Extract table rows using regex
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;

    const rows: string[][] = [];
    let rowMatch;
    while ((rowMatch = rowRegex.exec(html)) !== null) {
        const cells: string[] = [];
        let cellMatch;
        const rowHtml = rowMatch[1];
        const tempRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
        while ((cellMatch = tempRegex.exec(rowHtml)) !== null) {
            // Strip inner HTML tags
            const text = cellMatch[1].replace(/<[^>]+>/g, "").trim();
            cells.push(text);
        }
        if (cells.length >= 4) rows.push(cells);
    }

    if (rows.length < 2) return trades;

    // Find header row
    let headerIdx = -1;
    let headers: string[] = [];
    for (let i = 0; i < Math.min(20, rows.length); i++) {
        const norm = rows[i].map(c => c.toLowerCase().replace(/[\s/]/g, ""));
        if ((norm.includes("type") || norm.includes("ticket")) && norm.includes("profit")) {
            headerIdx = i;
            headers = norm;
            break;
        }
    }
    if (headerIdx < 0) return trades;

    const idx = (...names: string[]) => {
        for (const n of names) {
            const i = headers.indexOf(n);
            if (i >= 0) return i;
        }
        return -1;
    };

    const typeIdx = idx("type");
    const symbolIdx = idx("item", "symbol");
    const openTimeIdx = idx("opentime", "time");
    const closeTimeIdx = idx("closetime");
    const openPriceIdx = idx("openprice", "open", "price");
    const closePriceIdx = idx("closeprice", "close");
    const sizeIdx = idx("size", "volume", "lots");
    const slIdx = idx("sl", "s/l", "stoploss");
    const tpIdx = idx("tp", "t/p", "takeprofit");
    const profitIdx = idx("profit");
    const commIdx = idx("commission");
    const swapIdx = idx("swap");

    for (const row of rows.slice(headerIdx + 1)) {
        if (row.length < 5) continue;
        const typeRaw = typeIdx >= 0 ? row[typeIdx]?.toLowerCase() ?? "" : "";
        if (typeRaw === "balance" || typeRaw === "credit" || typeRaw === "deposit" || typeRaw === "withdrawal") continue;
        if (!typeRaw.match(/buy|sell|b\/l|s\/l/)) {
            if (profitIdx < 0 || !row[profitIdx]) continue;
        }

        const profit = profitIdx >= 0 ? parseNum(row[profitIdx]) : 0;
        const closeTimeRaw = closeTimeIdx >= 0 ? row[closeTimeIdx] : (openTimeIdx >= 0 ? row[openTimeIdx] : null);
        const closeTime = parseDate(closeTimeRaw ?? "");
        if (!closeTime) continue;

        trades.push({
            symbol: symbolIdx >= 0 ? row[symbolIdx]?.trim() ?? "" : "",
            direction: normalizeDirection(typeRaw.replace(/\s+stop|\s+limit/i, "")),
            entry_price: openPriceIdx >= 0 ? parseNum(row[openPriceIdx]) || null : null,
            exit_price: closePriceIdx >= 0 ? parseNum(row[closePriceIdx]) || null : null,
            position_size: sizeIdx >= 0 ? parseNum(row[sizeIdx]) || null : null,
            open_time: openTimeIdx >= 0 ? parseDate(row[openTimeIdx] ?? "") : null,
            close_time: closeTime,
            commission: commIdx >= 0 ? parseNum(row[commIdx]) : 0,
            swap: swapIdx >= 0 ? parseNum(row[swapIdx]) : 0,
            profit_loss: profit,
            source: "mt4",
        });
    }

    return trades;
}

export async function POST(req: NextRequest) {
    let body: { html?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!body.html?.trim()) {
        return NextResponse.json({ error: "HTML content is required" }, { status: 400 });
    }

    try {
        const trades = parseMT4HtmlServer(body.html);
        if (trades.length === 0) {
            return NextResponse.json(
                { error: "No trades found in the MT4 statement. Make sure you exported the full account history as HTML." },
                { status: 422 },
            );
        }
        return NextResponse.json({ trades, count: trades.length });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message ?? "Failed to parse MT4 statement" }, { status: 500 });
    }
}
