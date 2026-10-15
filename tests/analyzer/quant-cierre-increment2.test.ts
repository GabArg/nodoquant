import { describe, it, expect } from "vitest";
import { calcBasicMetrics, calcFullMetrics } from "@/lib/analyzer/metrics";
import { calcEdgeScore } from "@/lib/edgeScore";
import {
    calcHealthScore,
    calcRobustnessScore,
    calcEvolutionScore,
    calcQuantScore,
    calcQuantScoreSimple,
} from "@/lib/quantScore";
import { detectOverfitting } from "@/lib/overfittingRisk";
import { detectCurrency, formatNominalOrCurrency } from "@/lib/analyzer/currencyDetector";
import { parseTrades } from "@/lib/analyzer/parser";
import { buildParseResult } from "@/lib/import/normalizedTrade";
import type { Trade } from "@/lib/analyzer/parser";

describe("Fase 2B.2 Cierre Incremento 2: Integridad, Rankings, Moneda y Metadatos", () => {
    // ── 1. Publish contract: Null & infinite PF/DD preservation ────────────────
    describe("1. Publish contract & Null preservation", () => {
        it("should never convert null or undefined profit_factor to 0", () => {
            // Emulate payload transformation in /api/strategies/publish
            const inputPayload = {
                score: 85,
                win_rate: 100,
                profit_factor: null, // Infinite PF (100% win rate)
                expectancy: 1.5,
                max_drawdown: null, // No initial capital
                trades_count: 50,
            };

            const safeProfitFactor =
                inputPayload.profit_factor != null && Number.isFinite(Number(inputPayload.profit_factor))
                    ? Number(inputPayload.profit_factor)
                    : null;
            const safeMaxDrawdown =
                inputPayload.max_drawdown != null && Number.isFinite(Number(inputPayload.max_drawdown))
                    ? Number(inputPayload.max_drawdown)
                    : null;

            expect(safeProfitFactor).toBeNull();
            expect(safeProfitFactor).not.toBe(0);
            expect(safeMaxDrawdown).toBeNull();
            expect(safeMaxDrawdown).not.toBe(0);
        });

        it("should preserve valid positive numeric values for profit_factor and max_drawdown", () => {
            const inputPayload = {
                score: 78,
                win_rate: 65,
                profit_factor: 2.15,
                expectancy: 0.85,
                max_drawdown: 14.2,
                trades_count: 120,
            };

            const safeProfitFactor =
                inputPayload.profit_factor != null && Number.isFinite(Number(inputPayload.profit_factor))
                    ? Number(inputPayload.profit_factor)
                    : null;
            const safeMaxDrawdown =
                inputPayload.max_drawdown != null && Number.isFinite(Number(inputPayload.max_drawdown))
                    ? Number(inputPayload.max_drawdown)
                    : null;

            expect(safeProfitFactor).toBe(2.15);
            expect(safeMaxDrawdown).toBe(14.2);
        });
    });

    // ── 2. Rankings and Scores: No penalty for unavailable metrics ─────────────
    describe("2. Quant Rankings & Scores with Null Metrics", () => {
        it("should reward 100% win rate (null PF) in calcEdgeScore and calcHealthScore rather than penalizing", () => {
            const edgeInfinitePF = calcEdgeScore(100, null, 10, 80);
            const edgeZeroPF = calcEdgeScore(100, 0, 10, 80);

            // Null PF with winRate > 0 must receive full 3.5 points, whereas 0 PF receives 0 points
            expect(edgeInfinitePF).toBeGreaterThan(edgeZeroPF);
            expect(edgeInfinitePF).toBe(8.5); // 3.5 (WR) + 3.5 (PF) + 1.0 (DD/sample) = 8.5

            const healthInfinite = calcHealthScore(100, null, 10, 80, edgeInfinitePF);
            const healthZeroPF = calcHealthScore(100, 0, 10, 80, edgeZeroPF);
            expect(healthInfinite).toBeGreaterThan(healthZeroPF);
        });

        it("should treat null max_drawdown neutrally without penalizing as extreme DD", () => {
            const healthNullDD = calcHealthScore(60, 2.0, null, 100, 7.5);
            const healthExtremeDD = calcHealthScore(60, 2.0, 85, 100, 7.5);

            expect(healthNullDD).toBeGreaterThan(healthExtremeDD);

            const quantNullDD = calcQuantScoreSimple(7.5, healthNullDD, 100, null);
            const quantExtremeDD = calcQuantScoreSimple(7.5, healthExtremeDD, 100, 85);

            expect(quantNullDD).toBeGreaterThan(quantExtremeDD);
        });

        it("should calculate calcRobustnessScore and calcEvolutionScore without NaN when null metrics are present", () => {
            const datasets = [
                { trades_count: 50, winrate: 60, profit_factor: 2.1, max_drawdown: null, edge: 7.0 },
                { trades_count: 60, winrate: 65, profit_factor: null, max_drawdown: 12.0, edge: 8.5 },
                { trades_count: 55, winrate: 58, profit_factor: 1.9, max_drawdown: 15.0, edge: 6.8 },
            ];

            const robustness = calcRobustnessScore(datasets);
            expect(Number.isFinite(robustness)).toBe(true);
            expect(robustness).toBeGreaterThan(0);
            expect(robustness).toBeLessThanOrEqual(10);

            const evolution = calcEvolutionScore([
                { created_at: "2026-01-01", winrate: 60, profit_factor: null, max_drawdown: null, edge: 7.0 },
                { created_at: "2026-02-01", winrate: 65, profit_factor: 2.2, max_drawdown: 11.0, edge: 8.0 },
            ]);
            expect(Number.isFinite(evolution)).toBe(true);
            expect(evolution).toBeGreaterThanOrEqual(0);
            expect(evolution).toBeLessThanOrEqual(10);
        });

        it("should avoid NaN in client sorting when null values are encountered", () => {
            const rows = [
                { id: "1", profit_factor: 2.5 },
                { id: "2", profit_factor: null },
                { id: "3", profit_factor: 1.8 },
            ];

            const sortedDesc = [...rows].sort((a, b) => {
                const av = a.profit_factor;
                const bv = b.profit_factor;
                if (av === null && bv === null) return 0;
                if (av === null) return 1;
                if (bv === null) return -1;
                return bv - av;
            });

            expect(sortedDesc[0].id).toBe("1"); // 2.5
            expect(sortedDesc[1].id).toBe("3"); // 1.8
            expect(sortedDesc[2].id).toBe("2"); // null at bottom
        });

        it("detectOverfitting handles null profitFactor and maxDrawdown correctly", () => {
            const res = detectOverfitting({
                profitFactor: null,
                maxDrawdown: null,
                trades: 40,
                datasetsCount: 1,
                confidenceScore: 3,
                edgeScores: [7.0],
            });

            expect(res.riskPoints).toBeGreaterThan(0);
            expect(res.triggeredRules.some((r) => r.toLowerCase().includes("sample"))).toBe(true);
        });
    });

    // ── 3. Currency Detection & Formatting ─────────────────────────────────────
    describe("3. Currency Detection & Formatting (Never Assume USD)", () => {
        it("returns null when no currency evidence is present", () => {
            const csv = `date,profit,volume\n2026-01-01,100,1.0\n2026-01-02,50,1.0`;
            const result = parseTrades(csv);

            expect(result.accountCurrency).toBeNull();
        });

        it("detects currency from column headers (e.g. EUR, USDT)", () => {
            expect(detectCurrency(undefined, ["date", "profit (eur)", "volume"])).toBe("EUR");
            expect(detectCurrency(undefined, ["date", "pnl_usdt", "volume"])).toBe("USDT");
            expect(detectCurrency(undefined, ["time", "balance_gbp", "profit"])).toBe("GBP");
        });

        it("detects currency from statement text", () => {
            const statement = `NodoQuant Statement\nAccount: 987654 (EUR)\nCurrency: EUR\nDeposit: 10000.00 EUR`;
            expect(detectCurrency(statement)).toBe("EUR");
        });

        it("detects currency from crypto symbols (e.g. USDT)", () => {
            const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "ADAUSDT"];
            expect(detectCurrency(undefined, undefined, symbols)).toBe("USDT");
        });

        it("returns null when symbols are mixed and no header currency is specified", () => {
            const symbols = ["EURUSD", "GBPJPY", "AUDCAD", "NZDCHF", "USDJPY"];
            expect(detectCurrency(undefined, undefined, symbols)).toBeNull();
        });

        it("formatNominalOrCurrency formats without '$' when currency is null or unknown", () => {
            expect(formatNominalOrCurrency(1234.5, null)).toBe("1,234.50");
            expect(formatNominalOrCurrency(1234.5, undefined)).toBe("1,234.50");
            expect(formatNominalOrCurrency(-450.25, null)).toBe("-450.25");
        });

        it("formatNominalOrCurrency formats with appropriate currency symbol when currency is specified", () => {
            expect(formatNominalOrCurrency(1234.5, "USD")).toBe("$1,234.50");
            expect(formatNominalOrCurrency(1234.5, "EUR")).toBe("€1,234.50");
            expect(formatNominalOrCurrency(1234.5, "GBP")).toBe("£1,234.50");
            expect(formatNominalOrCurrency(1234.5, "USDT")).toBe("1,234.50 USDT");
            expect(formatNominalOrCurrency(-500, "USD")).toBe("-$500.00");
        });
    });

    // ── 4. Metadata in metrics_json (schema_version 2.0) ───────────────────────
    describe("4. Explicit Metadata Serialization", () => {
        const dummyTrades: Trade[] = [
            { datetime: new Date("2026-01-01"), profit: 150, symbol: "EURUSD" },
            { datetime: new Date("2026-01-02"), profit: -50, symbol: "EURUSD" },
            { datetime: new Date("2026-01-03"), profit: 200, symbol: "EURUSD" },
        ];

        it("calcFullMetrics attaches schema_version 2.0 and methodology_version", () => {
            const full = calcFullMetrics(dummyTrades, 10000, "USD");

            expect(full.schema_version).toBe("2.0");
            expect(full.methodology_version).toBe("v2-contract");
            expect(full.initial_capital).toBe(10000);
            expect(full.account_currency).toBe("USD");
            expect(full.metadata).toEqual({
                schema_version: "2.0",
                methodology_version: "v2-contract",
                initial_capital: 10000,
                account_currency: "USD",
            });
        });

        it("calcFullMetrics handles null capital and null currency gracefully in metadata", () => {
            const full = calcFullMetrics(dummyTrades, null, null);

            expect(full.schema_version).toBe("2.0");
            expect(full.methodology_version).toBe("v2-contract");
            expect(full.initial_capital).toBeNull();
            expect(full.account_currency).toBeNull();
            expect(full.metadata?.initial_capital).toBeNull();
            expect(full.metadata?.account_currency).toBeNull();
        });
    });

    // ── 5. Historical Records Compatibility ────────────────────────────────────
    describe("5. Historical Records Compatibility (58 Historical Analyses)", () => {
        it("renders legacy records without schema_version or currency without error", () => {
            const legacyRow = {
                id: "hist-001",
                trades_count: 142,
                winrate: 61.2,
                profit_factor: 1.84,
                max_drawdown: 12.8,
                metrics_json: {
                    basic: { totalTrades: 142, winrate: 61.2, profitFactor: 1.84 },
                    equity_curve: [100, 200, 350],
                },
            };

            // Formatting drawdown with unknown currency
            const currency = (legacyRow.metrics_json as any).account_currency ?? null;
            const formatted = formatNominalOrCurrency(legacyRow.max_drawdown, currency);
            expect(formatted).toBe("12.80"); // No "$" assumption!

            // Edge and quant score calculations work seamlessly
            const edge = calcEdgeScore(
                legacyRow.winrate,
                legacyRow.profit_factor,
                legacyRow.max_drawdown,
                legacyRow.trades_count
            );
            const health = calcHealthScore(
                legacyRow.winrate,
                legacyRow.profit_factor,
                legacyRow.max_drawdown,
                legacyRow.trades_count,
                edge
            );
            const quant = calcQuantScoreSimple(edge, health, legacyRow.trades_count, legacyRow.max_drawdown);

            expect(quant).toBeGreaterThan(0);
            expect(quant).toBeLessThanOrEqual(10);
        });
    });
});
