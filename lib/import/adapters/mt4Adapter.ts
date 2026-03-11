/**
 * MT4 Adapter — parses MT4 HTML statements and MT4 CSV exports.
 *
 * MT4 HTML statement format:
 * The file is an HTML table with rows for each deal.
 * Key columns: Time, Type, Size, Item (symbol), Price, S/L, T/P, Profit, Commission, Swap
 *
 * MT4 CSV export format (varies by broker):
 * Ticket, Open Time, Type, Size, Symbol, Open Price, S/L, T/P, Close Time, Close Price, Commission, Swap, Profit
 */

import {
    type NormalizedTrade,
    inferMarketType,
    normalizeDirection,
} from "../normalizedTrade";

// ── Date parser ──────────────────────────────────────────────────────────────

function parseDate(raw: string): Date | null {
    if (!raw) return null;
    // MT4 format: "2024.01.15 10:30:00" or "2024.01.15"
    const mt4 = raw.match(/^(\d{4})\.(\d{2})\.(\d{2})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?/);
    if (mt4) {
        const [, y, mo, d, h = "00", mi = "00", s = "00"] = mt4;
        return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`);
    }
    // ISO or common formats
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
}

function parseNum(raw: string | null | undefined): number {
    if (!raw) return 0;
    return parseFloat(String(raw).replace(/\s/g, "").replace(",", ".")) || 0;
}

// ── MT4 HTML Statement Parser (client-side) ──────────────────────────────────

/**
 * Parse an MT4 HTML statement using DOMParser (browser-only).
 * Call this only in client components.
 */
export function parseMT4Html(html: string): NormalizedTrade[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const trades: NormalizedTrade[] = [];

    // MT4 statements have a table with class "trades" or just the main data table
    const tables = Array.from(doc.querySelectorAll("table"));

    for (const table of tables) {
        const rows = Array.from(table.querySelectorAll("tr"));
        if (rows.length < 2) continue;

        // Find header row
        const headerRow = rows.find(r => {
            const text = r.textContent?.toLowerCase() ?? "";
            return (text.includes("ticket") || text.includes("symbol") || text.includes("type")) &&
                text.includes("profit");
        });
        if (!headerRow) continue;

        // Parse column indices from header
        const headers = Array.from(headerRow.querySelectorAll("td, th"))
            .map(c => c.textContent?.trim().toLowerCase().replace(/[\s/]/g, "") ?? "");

        const get = (row: Element, name: string) => {
            const idx = headers.indexOf(name);
            if (idx < 0) return null;
            const cells = row.querySelectorAll("td, th");
            return cells[idx]?.textContent?.trim() ?? null;
        };

        // These aliases cover different MT4 broker variations
        const findIdx = (...names: string[]) => {
            for (const n of names) {
                const i = headers.indexOf(n);
                if (i >= 0) return i;
            }
            return -1;
        };

        const typeIdx = findIdx("type");
        const symbolIdx = findIdx("item", "symbol", "pair");
        const openTimeIdx = findIdx("opentime", "time");
        const closeTimeIdx = findIdx("closetime");
        const openPriceIdx = findIdx("openprice", "price");
        const closePriceIdx = findIdx("closeprice", "close");
        const sizeIdx = findIdx("size", "volume", "lots");
        const slIdx = findIdx("s/l", "sl", "stoploss");
        const tpIdx = findIdx("t/p", "tp", "takeprofit");
        const profitIdx = findIdx("profit");
        const commissionIdx = findIdx("commission");
        const swapIdx = findIdx("swap");

        // Parse data rows (skip header row and total row)
        for (const row of rows) {
            if (row === headerRow) continue;
            const cells = Array.from(row.querySelectorAll("td, th"));
            if (cells.length < 5) continue;

            const cell = (idx: number) => idx >= 0 ? cells[idx]?.textContent?.trim() ?? null : null;

            const typeRaw = cell(typeIdx)?.toLowerCase() ?? "";
            // Only include closing trades (sell, buy — not balance, credit, etc.)
            if (typeRaw === "balance" || typeRaw === "credit" || typeRaw === "deposit" || typeRaw === "withdrawal") continue;
            if (!["buy", "sell", "b/l", "s/l", "buy stop", "sell stop", "buy limit", "sell limit"].some(t => typeRaw.includes(t))) {
                // Might still be a closed trade with type described differently — check profit column
                if (profitIdx < 0 || cell(profitIdx) === null) continue;
            }

            const profitRaw = cell(profitIdx);
            if (profitRaw === null) continue;
            const profit = parseNum(profitRaw);

            const closeTimeRaw = cell(closeTimeIdx) ?? cell(openTimeIdx);
            const closeTime = parseDate(closeTimeRaw ?? "");
            if (!closeTime) continue;

            const symbol = cell(symbolIdx) ?? "";
            const direction = normalizeDirection(typeRaw.replace(/\s+stop|\s+limit/i, ""));

            trades.push({
                trade_id: undefined,
                symbol,
                market_type: inferMarketType(symbol),
                direction,
                entry_price: parseNum(cell(openPriceIdx)) || null,
                exit_price: parseNum(cell(closePriceIdx)) || null,
                stop_loss: parseNum(cell(slIdx)) || null,
                take_profit: parseNum(cell(tpIdx)) || null,
                position_size: parseNum(cell(sizeIdx)) || null,
                open_time: parseDate(cell(openTimeIdx) ?? "") ?? null,
                close_time: closeTime,
                commission: parseNum(cell(commissionIdx)),
                swap: parseNum(cell(swapIdx)),
                profit_loss: profit,
                risk_multiple: null,
                source: "mt4",
            });
        }
    }

    return trades;
}

// ── MT4 CSV Export Parser ─────────────────────────────────────────────────────

/**
 * Parse an MT4 CSV export.
 * Standard columns: Ticket, Open Time, Type, Size, Symbol, Open Price, S/L, T/P, Close Time, Close Price, Commission, Swap, Profit
 */
export function parseMT4Csv(content: string): NormalizedTrade[] {
    const lines = content
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .split("\n")
        .map(l => l.trim())
        .filter(l => l.length > 0);

    if (lines.length < 2) return [];

    const splitLine = (l: string): string[] =>
        l.includes("\t") ? l.split("\t") : l.split(",").map(c => c.trim().replace(/^"|"$/g, ""));

    // Find header row
    let headerIdx = -1;
    let headers: string[] = [];
    for (let i = 0; i < Math.min(10, lines.length); i++) {
        const cols = splitLine(lines[i]).map(h => h.toLowerCase().replace(/[\s./]/g, ""));
        if (cols.includes("type") && (cols.includes("profit") || cols.includes("symbol"))) {
            headerIdx = i;
            headers = cols;
            break;
        }
    }
    if (headerIdx < 0) return [];

    const idx = (names: string[]) => {
        for (const n of names) {
            const i = headers.indexOf(n);
            if (i >= 0) return i;
        }
        return -1;
    };

    const typeIdx = idx(["type"]);
    const symbolIdx = idx(["symbol", "item"]);
    const openTimeIdx = idx(["opentime"]);
    const closeTimeIdx = idx(["closetime"]);
    const openPriceIdx = idx(["openprice", "open"]);
    const closePriceIdx = idx(["closeprice", "close", "price"]);
    const sizeIdx = idx(["size", "volume", "lots"]);
    const slIdx = idx(["sl", "stoploss", "s/l"]);
    const tpIdx = idx(["tp", "takeprofit", "t/p"]);
    const profitIdx = idx(["profit"]);
    const commIdx = idx(["commission"]);
    const swapIdx = idx(["swap"]);

    const trades: NormalizedTrade[] = [];

    for (const line of lines.slice(headerIdx + 1)) {
        const cols = splitLine(line);
        if (cols.length < 5) continue;

        const typeRaw = (openTimeIdx >= 0 ? cols[typeIdx]?.toLowerCase() : "") ?? "";
        if (!typeRaw || typeRaw === "balance" || typeRaw === "credit") continue;

        const profit = profitIdx >= 0 ? parseNum(cols[profitIdx]) : 0;
        if (profit === 0 && !cols[profitIdx]) continue;

        const closeTimeRaw = closeTimeIdx >= 0 ? cols[closeTimeIdx] : null;
        const openTimeRaw = openTimeIdx >= 0 ? cols[openTimeIdx] : null;
        const closeTime = parseDate(closeTimeRaw ?? openTimeRaw ?? "");
        if (!closeTime) continue;

        const symbol = symbolIdx >= 0 ? cols[symbolIdx]?.trim() ?? "" : "";
        const direction = normalizeDirection(typeRaw);

        trades.push({
            symbol,
            market_type: inferMarketType(symbol),
            direction,
            entry_price: openPriceIdx >= 0 ? parseNum(cols[openPriceIdx]) || null : null,
            exit_price: closePriceIdx >= 0 ? parseNum(cols[closePriceIdx]) || null : null,
            stop_loss: slIdx >= 0 ? parseNum(cols[slIdx]) || null : null,
            take_profit: tpIdx >= 0 ? parseNum(cols[tpIdx]) || null : null,
            position_size: sizeIdx >= 0 ? parseNum(cols[sizeIdx]) || null : null,
            open_time: parseDate(openTimeRaw ?? ""),
            close_time: closeTime,
            commission: commIdx >= 0 ? parseNum(cols[commIdx]) : 0,
            swap: swapIdx >= 0 ? parseNum(cols[swapIdx]) : 0,
            profit_loss: profit,
            risk_multiple: null,
            source: "mt4",
        });
    }

    return trades;
}
