/**
 * Currency Detector and Formatter for NodoQuant Quantitative Engine
 *
 * Rules:
 * 1. Never assume USD or '$' without explicit evidence in headers, statement text, or quotes.
 * 2. If currency is unknown/undetected, return null and format as nominal value.
 */

const KNOWN_CURRENCIES = new Set([
    "USD", "EUR", "GBP", "JPY", "CHF", "AUD", "CAD", "NZD", "SGD", "HKD", "SEK", "NOK", "MXN", "ZAR",
    "USDT", "USDC", "BUSD", "DAI", "BTC", "ETH"
]);

const KNOWN_FOREX_CURRENCIES = new Set([
    "USD", "EUR", "GBP", "JPY", "CHF", "AUD", "CAD", "NZD", "SGD", "HKD", "SEK", "NOK", "MXN", "ZAR"
]);

/**
 * Detect currency from file content, headers, or trade symbols.
 * Returns ISO code (e.g. "USD", "EUR", "USDT") if evidence exists, or null if unknown.
 * Never defaults to USD without evidence.
 */
export function detectCurrency(
    rawText?: string | null,
    headers?: string[] | null,
    symbols?: string[] | null
): string | null {
    // 1. Check explicit header column names: profit (usd), pnl_eur, balance_usdt
    if (headers && headers.length > 0) {
        for (const h of headers) {
            const clean = h.toLowerCase().trim();
            const match = clean.match(/(?:profit|pnl|pl|balance|gain|loss|deposit|equity)[_\s\(\[\{]+([a-z]{3,5})[_\s\)\]\}]*/);
            if (match && match[1]) {
                const candidate = match[1].toUpperCase();
                if (KNOWN_CURRENCIES.has(candidate)) return candidate;
            }
        }
    }

    // 2. Check statement text patterns (e.g. MT4/MT5 HTML or account summary)
    if (rawText) {
        // e.g. "Currency: USD" or "Currency : EUR" or "Account: 12345 (USD)"
        const curMatch =
            rawText.match(/currency\s*[:=]\s*([A-Za-z]{3,5})\b/i) ||
            rawText.match(/account\s*[:=]?\s*[^(\n\r]+\(([A-Za-z]{3,5})\)/i) ||
            rawText.match(/deposit\s*\/?\s*withdrawal\s*[:=]?\s*[\d,.\s]+\s*([A-Za-z]{3,5})\b/i);
        if (curMatch && curMatch[1]) {
            const candidate = curMatch[1].toUpperCase();
            if (KNOWN_CURRENCIES.has(candidate)) return candidate;
        }
    }

    // 3. Check trade symbols (if >= 80% share the same quote currency, e.g. all USDT or all EUR)
    if (symbols && symbols.length > 0) {
        const quoteCounts: Record<string, number> = {};
        let validSymbols = 0;
        for (const sym of symbols) {
            if (!sym) continue;
            const s = sym.toUpperCase().trim();
            // Crypto USDT / USDC / BUSD
            if (s.endsWith("USDT")) {
                quoteCounts["USDT"] = (quoteCounts["USDT"] || 0) + 1;
                validSymbols++;
            } else if (s.endsWith("USDC")) {
                quoteCounts["USDC"] = (quoteCounts["USDC"] || 0) + 1;
                validSymbols++;
            } else if (s.endsWith("BUSD")) {
                quoteCounts["BUSD"] = (quoteCounts["BUSD"] || 0) + 1;
                validSymbols++;
            } else if (/^[A-Z]{6}$/.test(s)) {
                // Forex pairs: 6 chars e.g. EURUSD -> quote is USD
                const quote = s.slice(3, 6);
                if (KNOWN_FOREX_CURRENCIES.has(quote)) {
                    quoteCounts[quote] = (quoteCounts[quote] || 0) + 1;
                    validSymbols++;
                }
            }
        }
        if (validSymbols >= 5) {
            for (const [cur, count] of Object.entries(quoteCounts)) {
                if (count / validSymbols >= 0.8) {
                    return cur;
                }
            }
        }
    }

    // No evidence found — return null (never assume USD!)
    return null;
}

/**
 * Format a nominal amount with optional currency code.
 * If currency is not provided (or unknown), returns the formatted number without assuming '$' or USD.
 */
export function formatNominalOrCurrency(value: number, currency?: string | null): string {
    if (!Number.isFinite(value)) return "-";
    const formatted = Math.abs(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    const sign = value < 0 ? "-" : "";
    if (!currency || typeof currency !== "string" || currency.trim() === "") {
        return `${sign}${formatted}`;
    }
    const cur = currency.trim().toUpperCase();
    if (cur === "USD") return `${sign}$${formatted}`;
    if (cur === "EUR") return `${sign}€${formatted}`;
    if (cur === "GBP") return `${sign}£${formatted}`;
    return `${sign}${formatted} ${cur}`;
}
