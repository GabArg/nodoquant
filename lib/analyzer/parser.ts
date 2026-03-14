/**
 * Trade History Parser
 * Supports:
 *   - MT5 "Deals" tab export (tab-separated or comma-separated with MT5 column names)
 *   - Generic CSV (any order, looks for profit/datetime columns)
 */

export interface Trade {
    datetime: Date; // Keep datetime for backwards compatibility in existing UI for now, usually exit_time
    profit: number;
    symbol?: string;
    volume?: number;
    direction?: string;
    entry_price?: number;
    exit_price?: number;
    stop_loss?: number;
    take_profit?: number;
    entry_time?: Date;
    exit_time?: Date;
    open_time?: Date; // Alias for entry_time or specific open time
    risk_reward?: number;
    duration_minutes?: number;
    ticket?: string;
    account_id?: string;
}

export type FormatType = "mt5" | "csv-generic" | "unknown";

// ── helpers ──────────────────────────────────────────────────────────────────

function parseLine(line: string): string[] {
    // Try tab first, then comma
    if (line.includes("\t")) return line.split("\t").map((c) => c.trim());
    return line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
}

function normalizeHeader(h: string): string {
    return h.toLowerCase().replace(/[\s_\-]/g, "");
}

function parseDateTime(raw: string): Date | null {
    if (!raw) return null;
    // MT5 format: "2023.01.15 10:30:00"
    const mt5 = raw.match(/^(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
    if (mt5) {
        const [, y, mo, d, h, mi, s] = mt5;
        return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`);
    }
    // ISO / common formats
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
}

// ── MT5 detection ─────────────────────────────────────────────────────────────
// MT5 exports have these columns (case-insensitive, various orderings):
// Time | Deal | Symbol | Type | Direction | Volume | Price | Commission | Swap | Profit | Balance
const MT5_REQUIRED_COLS = ["time", "profit", "balance"];
const MT5_HINT_COLS = ["deal", "direction", "swap", "commission"];

function detectMT5(headers: string[]): boolean {
    const norm = headers.map(normalizeHeader);
    const hasRequired = MT5_REQUIRED_COLS.every((c) => norm.includes(c));
    if (!hasRequired) return false;
    const hintCount = MT5_HINT_COLS.filter((c) => norm.includes(c)).length;
    return hintCount >= 2;
}

// ── Generic CSV detection ────────────────────────────────────────────────────
const CSV_PROFIT_ALIASES = ["profit", "pnl", "pl", "gain", "result", "netprofit"];
const CSV_DATE_ALIASES = ["datetime", "date", "time", "opentime", "closetime", "timestamp"];

function findColumn(norm: string[], aliases: string[]): number {
    for (const a of aliases) {
        const idx = norm.indexOf(a);
        if (idx !== -1) return idx;
    }
    // partial match
    for (const a of aliases) {
        const idx = norm.findIndex((h) => h.includes(a));
        if (idx !== -1) return idx;
    }
    return -1;
}

// ── Main parser ───────────────────────────────────────────────────────────────

export interface ParseResult {
    trades: Trade[];
    format: FormatType;
    fileName?: string;
    dateRangeStart?: Date;
    dateRangeEnd?: Date;
    sumProfit: number;
}

export function parseTrades(raw: string, fileName?: string): ParseResult {
    // Normalize line endings
    const lines = raw
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

    if (lines.length < 2) {
        throw new Error("El archivo está vacío o tiene menos de 2 líneas.");
    }

    // Find header row (skip any MT5 report header lines that don't have delimiters)
    let headerIdx = -1;
    let headers: string[] = [];
    for (let i = 0; i < Math.min(10, lines.length); i++) {
        const cols = parseLine(lines[i]);
        if (cols.length >= 3) {
            headerIdx = i;
            headers = cols;
            break;
        }
    }

    if (headerIdx === -1) {
        throw new Error("No se encontró una cabecera válida en el archivo.");
    }

    const normHeaders = headers.map(normalizeHeader);
    const dataLines = lines.slice(headerIdx + 1);

    // ── MT5 format ──
    if (detectMT5(normHeaders)) {
        return parseMT5(normHeaders, dataLines, fileName);
    }

    // ── Generic CSV ──
    const profitIdx = findColumn(normHeaders, CSV_PROFIT_ALIASES);
    const dateIdx = findColumn(normHeaders, CSV_DATE_ALIASES);
    const entryPriceIdx = findColumn(normHeaders, ["entryprice", "openprice", "open", "pricein"]);
    const exitPriceIdx = findColumn(normHeaders, ["exitprice", "closeprice", "close", "priceout"]);

    if (profitIdx === -1 && (entryPriceIdx === -1 || exitPriceIdx === -1)) {
        throw new Error(
            'No se encontró columna de profit. Asegurate de tener una columna llamada "profit", "pnl" o "entry price" y "exit price".'
        );
    }
    if (dateIdx === -1) {
        throw new Error(
            'No se encontró columna de fecha. Asegurate de tener una columna llamada "datetime", "date" o similar.'
        );
    }

    const symbolIdx = findColumn(normHeaders, ["symbol", "instrument", "pair", "market"]);
    const volumeIdx = findColumn(normHeaders, ["volume", "size", "lots", "qty", "quantity"]);

    return parseGenericCSV(dataLines, { profitIdx, dateIdx, symbolIdx, volumeIdx, entryPriceIdx, exitPriceIdx, fileName });
}

// ── MT5 specific parser ───────────────────────────────────────────────────────

function parseMT5(normHeaders: string[], dataLines: string[], fileName?: string): ParseResult {
    const timeIdx = normHeaders.indexOf("time");
    const profitIdx = normHeaders.indexOf("profit");
    const symbolIdx = normHeaders.indexOf("symbol");
    const volumeIdx = normHeaders.indexOf("volume");
    const typeIdx = normHeaders.findIndex((h) => h === "type");
    const directionIdx = normHeaders.findIndex((h) => h === "direction");
    const dealIdx = normHeaders.indexOf("deal");
    const ticketIdx = normHeaders.indexOf("ticket"); // sometimes called ticket in other platforms

    const trades: Trade[] = [];

    for (const line of dataLines) {
        const cols = parseLine(line);
        if (cols.length < 3) continue;

        // Skip balance/deposit/withdrawal entries (profit=0, no symbol, type=balance)
        const type = typeIdx >= 0 ? cols[typeIdx]?.toLowerCase() : "";
        const direction = directionIdx >= 0 ? cols[directionIdx]?.toLowerCase() : "";
        if (type === "balance" || type === "deposit" || type === "withdrawal") continue;
        // Skip "in" direction (entry legs) — we only want closed P&L
        if (direction === "in") continue;

        const rawProfit = cols[profitIdx];
        const profit = parseFloat(rawProfit?.replace(",", ".") ?? "");
        if (isNaN(profit)) continue;
        if (profit === 0 && direction !== "out") continue; // skip non-closing rows

        const datetime = parseDateTime(cols[timeIdx] ?? "");
        if (!datetime) continue;

        trades.push({
            datetime,
            profit,
            symbol: symbolIdx >= 0 ? cols[symbolIdx] || undefined : undefined,
            volume: volumeIdx >= 0 ? parseFloat(cols[volumeIdx] ?? "") || undefined : undefined,
            ticket: dealIdx >= 0 ? cols[dealIdx] : (ticketIdx >= 0 ? cols[ticketIdx] : undefined),
        });
    }

    if (trades.length === 0) {
        throw new Error(
            "No se encontraron trades cerrados en el archivo MT5. Asegurate de exportar la pestaña Deals."
        );
    }

    return buildResult(trades, "mt5", fileName);
}

// ── Generic CSV parser ────────────────────────────────────────────────────────

interface ColIndexes {
    profitIdx: number;
    // We expect dateIdx to map to datetime or exit_time for compatibility
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
}

export function parseGenericCSV(dataLines: string[], cols: ColIndexes): ParseResult {
    const { profitIdx, dateIdx, symbolIdx, volumeIdx, directionIdx, entryPriceIdx, exitPriceIdx, stopLossIdx, takeProfitIdx, entryTimeIdx, fileName } = cols;
    const trades: Trade[] = [];

    for (const line of dataLines) {
        const parts = parseLine(line);
        if (parts.length < 2) continue;

        let profit = 0;
        if (profitIdx !== undefined && profitIdx >= 0) {
            const profitStr = parts[profitIdx]?.replace(",", ".") ?? "";
            profit = parseFloat(profitStr);
        } else if (entryPriceIdx !== undefined && entryPriceIdx >= 0 && exitPriceIdx !== undefined && exitPriceIdx >= 0) {
            const ep = parseFloat(parts[entryPriceIdx]?.replace(",", ".") ?? "");
            const xp = parseFloat(parts[exitPriceIdx]?.replace(",", ".") ?? "");
            if (!isNaN(ep) && !isNaN(xp)) {
                let dir = (directionIdx !== undefined && directionIdx >= 0) ? parts[directionIdx]?.toLowerCase() : "long";
                if (dir === "short" || dir === "sell") {
                    profit = ep - xp;
                } else {
                    profit = xp - ep;
                }
            } else {
                continue;
            }
        } else {
            continue; // Cannot compute profit
        }

        if (isNaN(profit)) continue; // Must have valid profit

        let datetime = parseDateTime(parts[dateIdx] ?? "");
        if (!datetime) {
            datetime = new Date();
        }

        const trade: Trade = {
            datetime,
            exit_time: datetime,
            profit,
            symbol: symbolIdx !== undefined && symbolIdx >= 0 ? parts[symbolIdx] : undefined,
            volume: volumeIdx !== undefined && volumeIdx >= 0 ? parseFloat(parts[volumeIdx]?.replace(",", ".") ?? "") || undefined : undefined,
            direction: directionIdx !== undefined && directionIdx >= 0 ? parts[directionIdx] : undefined,
            entry_price: entryPriceIdx !== undefined && entryPriceIdx >= 0 ? parseFloat(parts[entryPriceIdx]?.replace(",", ".") ?? "") || undefined : undefined,
            exit_price: exitPriceIdx !== undefined && exitPriceIdx >= 0 ? parseFloat(parts[exitPriceIdx]?.replace(",", ".") ?? "") || undefined : undefined,
            stop_loss: stopLossIdx !== undefined && stopLossIdx >= 0 ? parseFloat(parts[stopLossIdx]?.replace(",", ".") ?? "") || undefined : undefined,
            take_profit: takeProfitIdx !== undefined && takeProfitIdx >= 0 ? parseFloat(parts[takeProfitIdx]?.replace(",", ".") ?? "") || undefined : undefined,
            entry_time: entryTimeIdx !== undefined && entryTimeIdx >= 0 ? parseDateTime(parts[entryTimeIdx] ?? "") || undefined : undefined,
        };
        trades.push(trade);
    }

    if (trades.length === 0) {
        throw new Error(
            "No se encontraron trades con profit válidos. Verificá el formato del archivo y el mapeo de columnas."
        );
    }

    console.debug("Parsed mapped trades:", trades.length);
    return buildResult(trades, "csv-generic", fileName);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildResult(
    rawTrades: Trade[],
    format: FormatType,
    fileName?: string
): ParseResult {
    // Sort by date ascending
    const trades = [...rawTrades].sort(
        (a, b) => a.datetime.getTime() - b.datetime.getTime()
    );

    const sumProfit = trades.reduce((s, t) => s + t.profit, 0);
    const dateRangeStart = trades[0]?.datetime;
    const dateRangeEnd = trades[trades.length - 1]?.datetime;

    return { trades, format, fileName, dateRangeStart, dateRangeEnd, sumProfit };
}
