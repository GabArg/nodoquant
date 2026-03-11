/**
 * MT5 Adapter — wraps the existing MT5 CSV parser from parser.ts and extends
 * it with MT5 HTML statement support.
 *
 * MT5 Deals export (CSV/TSV):
 * Time | Deal | Symbol | Type | Direction | Volume | Price | Commission | Swap | Profit | Balance
 *
 * MT5 HTML statement: similar table structure.
 */

import { parseTrades } from "@/lib/analyzer/parser";
import {
    type NormalizedTrade,
    inferMarketType,
    normalizeDirection,
} from "../normalizedTrade";

function parseNum(raw: string | null | undefined): number {
    if (!raw) return 0;
    return parseFloat(String(raw).replace(/\s/g, "").replace(",", ".")) || 0;
}

function parseDate(raw: string): Date | null {
    if (!raw) return null;
    const mt5 = raw.match(/^(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (mt5) {
        const [, y, mo, d, h, mi, s = "00"] = mt5;
        return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`);
    }
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
}

// ── MT5 CSV/TSV Deals Export ──────────────────────────────────────────────────

/**
 * Parse MT5 Deals tab export (CSV or TSV).
 * Leverages the existing parseTrades() and converts to NormalizedTrade[].
 */
export function parseMT5Csv(content: string, fileName?: string): NormalizedTrade[] {
    try {
        const result = parseTrades(content, fileName);
        return result.trades.map(t => ({
            symbol: t.symbol ?? "",
            market_type: inferMarketType(t.symbol ?? ""),
            direction: normalizeDirection(t.direction ?? ""),
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
            risk_multiple: t.risk_reward ?? null,
            source: "mt5" as const,
        }));
    } catch {
        return [];
    }
}

// ── MT5 HTML Statement Parser (browser-side) ──────────────────────────────────

/**
 * Parse an MT5 HTML statement using DOMParser.
 * MT5 HTML statements use similar table structure to MT4 but with different column names.
 */
export function parseMT5Html(html: string): NormalizedTrade[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const trades: NormalizedTrade[] = [];

    const tables = Array.from(doc.querySelectorAll("table"));

    for (const table of tables) {
        const rows = Array.from(table.querySelectorAll("tr"));
        if (rows.length < 3) continue;

        // Find header row containing MT5 Deals column names
        const headerRow = rows.find(r => {
            const text = r.textContent?.toLowerCase() ?? "";
            return (text.includes("deal") || text.includes("symbol")) && text.includes("profit");
        });
        if (!headerRow) continue;

        const headers = Array.from(headerRow.querySelectorAll("td, th"))
            .map(c => c.textContent?.trim().toLowerCase().replace(/[\s/]/g, "") ?? "");

        const idx = (...names: string[]) => {
            for (const n of names) {
                const i = headers.indexOf(n);
                if (i >= 0) return i;
            }
            return -1;
        };

        const timeIdx = idx("time");
        const symbolIdx = idx("symbol");
        const typeIdx = idx("type");
        const directionIdx = idx("direction");
        const volumeIdx = idx("volume");
        const priceIdx = idx("price");
        const commissionIdx = idx("commission");
        const swapIdx = idx("swap");
        const profitIdx = idx("profit");

        for (const row of rows) {
            if (row === headerRow) continue;
            const cells = Array.from(row.querySelectorAll("td, th"));
            if (cells.length < 4) continue;

            const cell = (i: number) => i >= 0 ? cells[i]?.textContent?.trim() ?? null : null;

            const typeRaw = cell(typeIdx)?.toLowerCase() ?? "";
            const dirRaw = cell(directionIdx)?.toLowerCase() ?? "";

            // Skip non-trade rows
            if (typeRaw === "balance" || typeRaw === "deposit" || typeRaw === "withdrawal" || typeRaw === "credit") continue;
            if (dirRaw === "in") continue; // entry legs — only want closed positions (direction=out)

            const profitRaw = cell(profitIdx);
            if (profitRaw === null) continue;
            const profit = parseNum(profitRaw);
            if (profit === 0 && dirRaw !== "out") continue;

            const closeTime = parseDate(cell(timeIdx) ?? "");
            if (!closeTime) continue;

            const symbol = cell(symbolIdx) ?? "";

            trades.push({
                symbol,
                market_type: inferMarketType(symbol),
                direction: normalizeDirection(typeRaw),
                entry_price: parseNum(cell(priceIdx)) || null,
                exit_price: null, // MT5 HTML doesn't always have separate exit price
                stop_loss: null,
                take_profit: null,
                position_size: parseNum(cell(volumeIdx)) || null,
                open_time: null,
                close_time: closeTime,
                commission: parseNum(cell(commissionIdx)),
                swap: parseNum(cell(swapIdx)),
                profit_loss: profit,
                risk_multiple: null,
                source: "mt5" as const,
            });
        }
    }

    return trades;
}

/**
 * Auto-detect and parse MT5 file — HTML or CSV.
 */
export function parseMT5File(content: string, fileName?: string): NormalizedTrade[] {
    const isHtml = content.includes("<html") || content.includes("<table") || content.includes("<HTML");
    if (isHtml) {
        return parseMT5Html(content);
    }
    return parseMT5Csv(content, fileName);
}
