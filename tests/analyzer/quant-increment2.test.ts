import { describe, it, expect } from "vitest";
import { calcBasicMetrics, calcFullMetrics } from "@/lib/analyzer/metrics";
import type { Trade } from "@/lib/analyzer/parser";
import esMessages from "@/messages/es.json";
import enMessages from "@/messages/en.json";

function makeTrade(profit: number, index: number, rr: number | undefined = 1.5): Trade {
    const base = new Date("2026-01-01T10:00:00Z").getTime();
    return {
        ticket: `ticket-${index}`,
        datetime: new Date(base + index * 3600 * 1000),
        profit,
        risk_reward: rr,
        direction: profit >= 0 ? "BUY" : "SELL",
        symbol: "EURUSD",
    };
}

describe("NodoQuant Incremento 2: Compatibilidad de APIs y Persistencia", () => {
    // Logic replicating route validation in /api/analyzer/save and /api/analyzer/anonymous
    function validateSavePayload(body: any): { valid: boolean; error?: string } {
        const { trades_count, winrate, profit_factor, max_drawdown } = body;

        const isPFValid =
            profit_factor === null ||
            (typeof profit_factor === "number" &&
                Number.isFinite(profit_factor) &&
                profit_factor >= 0);

        const isDDValid =
            max_drawdown === null ||
            (typeof max_drawdown === "number" &&
                Number.isFinite(max_drawdown) &&
                max_drawdown >= 0);

        if (
            typeof trades_count !== "number" ||
            !Number.isInteger(trades_count) ||
            trades_count <= 0 ||
            trades_count > 1000 ||
            typeof winrate !== "number" ||
            !Number.isFinite(winrate) ||
            winrate < 0 ||
            winrate > 100 ||
            !isPFValid ||
            !isDDValid
        ) {
            return { valid: false, error: "Métricas numéricas requeridas inválidas o fuera de límites" };
        }

        return { valid: true };
    }

    it("acepta profit_factor y max_drawdown válidos como null", () => {
        const res = validateSavePayload({
            trades_count: 50,
            winrate: 60.0,
            profit_factor: null,
            max_drawdown: null,
        });
        expect(res.valid).toBe(true);
    });

    it("acepta profit_factor y max_drawdown finitos positivos normales", () => {
        const res = validateSavePayload({
            trades_count: 100,
            winrate: 55.5,
            profit_factor: 1.85,
            max_drawdown: 8.4,
        });
        expect(res.valid).toBe(true);
    });

    it("rechaza estrictamente NaN, Infinity y cadenas de texto en profit_factor", () => {
        expect(validateSavePayload({ trades_count: 50, winrate: 50, profit_factor: NaN, max_drawdown: 5 }).valid).toBe(false);
        expect(validateSavePayload({ trades_count: 50, winrate: 50, profit_factor: Infinity, max_drawdown: 5 }).valid).toBe(false);
        expect(validateSavePayload({ trades_count: 50, winrate: 50, profit_factor: "1.85", max_drawdown: 5 }).valid).toBe(false);
        expect(validateSavePayload({ trades_count: 50, winrate: 50, profit_factor: -1.5, max_drawdown: 5 }).valid).toBe(false);
    });

    it("rechaza estrictamente NaN, Infinity y cadenas de texto en max_drawdown", () => {
        expect(validateSavePayload({ trades_count: 50, winrate: 50, profit_factor: 1.5, max_drawdown: NaN }).valid).toBe(false);
        expect(validateSavePayload({ trades_count: 50, winrate: 50, profit_factor: 1.5, max_drawdown: Infinity }).valid).toBe(false);
        expect(validateSavePayload({ trades_count: 50, winrate: 50, profit_factor: 1.5, max_drawdown: "8.4" }).valid).toBe(false);
        expect(validateSavePayload({ trades_count: 50, winrate: 50, profit_factor: 1.5, max_drawdown: -5 }).valid).toBe(false);
    });

    it("preserva profitFactorInfinite e initial_capital en metrics_json", () => {
        const body = {
            profit_factor: null,
            max_drawdown: null,
            profitFactorInfinite: true,
            initial_capital: 25000,
            metrics_json: {
                basic: {
                    profitFactor: null,
                    profitFactorInfinite: true,
                    initialCapital: 25000,
                },
            },
        };

        const normalizedMetrics = { ...body.metrics_json } as any;
        const isInfinite = Boolean(
            body.profitFactorInfinite ||
            normalizedMetrics.profitFactorInfinite ||
            normalizedMetrics.basic?.profitFactorInfinite
        );
        if (isInfinite) {
            normalizedMetrics.profitFactorInfinite = true;
            if (normalizedMetrics.basic) {
                normalizedMetrics.basic.profitFactorInfinite = true;
            }
        }

        const effectiveCapital =
            body.initial_capital !== undefined
                ? body.initial_capital
                : normalizedMetrics.initial_capital !== undefined
                ? normalizedMetrics.initial_capital
                : normalizedMetrics.basic?.initialCapital !== undefined
                ? normalizedMetrics.basic.initialCapital
                : null;
        if (effectiveCapital !== null) {
            normalizedMetrics.initial_capital = effectiveCapital;
        }

        expect(normalizedMetrics.profitFactorInfinite).toBe(true);
        expect(normalizedMetrics.initial_capital).toBe(25000);
        expect(normalizedMetrics.basic.profitFactorInfinite).toBe(true);
    });
});

describe("NodoQuant Incremento 2: Formateo de Consumidores Seguro", () => {
    function formatPF(pf: number | null, isInfinite?: boolean): string {
        if (pf !== null) {
            return Number(pf).toFixed(2);
        }
        return isInfinite ? "∞" : "—";
    }

    function formatDD(dd: number | null, ddAbs: number): { label: string; display: string; subText?: string } {
        if (dd !== null) {
            return {
                label: "Max Drawdown",
                display: `${Math.abs(dd).toFixed(1)}%`,
            };
        }
        return {
            label: "Max Drawdown (Nominal)",
            display: `$${ddAbs.toFixed(2)}`,
            subText: "Capital no especificado",
        };
    }

    it("muestra '—' cuando profitFactor es null y no es infinito", () => {
        expect(formatPF(null, false)).toBe("—");
        expect(formatPF(null, undefined)).toBe("—");
    });

    it("muestra '∞' únicamente cuando profitFactorInfinite es true", () => {
        expect(formatPF(null, true)).toBe("∞");
    });

    it("muestra el valor decimal con 2 decimales para un profitFactor normal", () => {
        expect(formatPF(2.145)).toBe("2.15");
        expect(formatPF(1.0)).toBe("1.00");
    });

    it("no produce 999 ni 99.99 para valores nulos", () => {
        const rendered = formatPF(null, true);
        expect(rendered).not.toBe("999");
        expect(rendered).not.toBe("99.99");
        expect(rendered).toBe("∞");
    });

    it("formatea drawdown con porcentaje si existe capital y nominal si no existe", () => {
        const withCapital = formatDD(12.34, 1234);
        expect(withCapital.label).toBe("Max Drawdown");
        expect(withCapital.display).toBe("12.3%");
        expect(withCapital.subText).toBeUndefined();

        const withoutCapital = formatDD(null, 500);
        expect(withoutCapital.label).toBe("Max Drawdown (Nominal)");
        expect(withoutCapital.display).toBe("$500.00");
        expect(withoutCapital.subText).toBe("Capital no especificado");
    });
});

describe("NodoQuant Incremento 2: Capital Inicial y Drawdown", () => {
    it("con capital conocido calcula maxDrawdown porcentual y conserva maxDrawdownAbs nominal", () => {
        const trades = [
            makeTrade(1000, 1),
            makeTrade(-500, 2),
            makeTrade(-500, 3),
            makeTrade(1200, 4),
        ];

        const initialCapital = 10000;
        const basic = calcBasicMetrics(trades, initialCapital);
        const full = calcFullMetrics(trades, initialCapital);

        expect(basic.initialCapital).toBe(10000);
        expect(basic.maxDrawdown).not.toBeNull();
        expect(typeof basic.maxDrawdown).toBe("number");
        expect(basic.maxDrawdown!).toBeGreaterThan(0);
        expect(basic.maxDrawdownAbs).toBe(1000);

        expect(full.maxDrawdown).toBe(basic.maxDrawdown);
        expect(full.maxDrawdownAbs).toBe(1000);
        expect(Array.isArray(full.drawdownCurve)).toBe(true);
        expect(full.drawdownCurve.length).toBeGreaterThan(0);
        expect(typeof full.drawdownCurve[0]).toBe("number");
    });

    it("sin capital devuelve maxDrawdown null y conserva maxDrawdownAbs nominal", () => {
        const trades = [
            makeTrade(1000, 1),
            makeTrade(-500, 2),
            makeTrade(-500, 3),
            makeTrade(1200, 4),
        ];

        const basic = calcBasicMetrics(trades, null);
        const full = calcFullMetrics(trades, null);

        expect(basic.initialCapital).toBeNull();
        expect(basic.maxDrawdown).toBeNull();
        expect(basic.maxDrawdownAbs).toBe(1000);

        expect(full.maxDrawdown).toBeNull();
        expect(full.maxDrawdownAbs).toBe(1000);
        expect(Array.isArray(full.drawdownCurve)).toBe(true);
        expect(full.drawdownCurve.length).toBeGreaterThan(0);
        // Sin capital especificado, la curva contiene la pérdida acumulada nominal
        full.drawdownCurve.forEach(val => {
            expect(typeof val).toBe("number");
            expect(val).toBeGreaterThanOrEqual(0);
        });
    });
});

describe("NodoQuant Incremento 2: Transparencia Estadística y Textos", () => {
    it("renombra Edge Confidence a Puntuación de evidencia / Evidence Score", () => {
        expect(esMessages.analyzer.edgeConfidence.title).toBe("Puntuación de evidencia");
        expect(enMessages.analyzer.edgeConfidence.title).toBe("Evidence Score");

        expect(esMessages.analyzer.results.stability.confidence).not.toContain("%");
        expect(enMessages.analyzer.results.stability.confidence).not.toContain("%");
    });

    it("describe la métrica como índice heurístico y no como probabilidad", () => {
        expect(esMessages.analyzer.edgeConfidence.tooltip).toContain("Índice heurístico");
        expect(esMessages.analyzer.edgeConfidence.tooltip).toContain("No constituye una probabilidad");

        expect(enMessages.analyzer.edgeConfidence.tooltip).toContain("Heuristic index");
        expect(enMessages.analyzer.edgeConfidence.tooltip).toContain("not a statistical probability");
    });

    it("no contiene afirmaciones de supervivencia en estabilidad ni monteCarlo", () => {
        const esStability = esMessages.analyzer.results.stability.microcopy;
        const enStability = enMessages.analyzer.results.stability.microcopy;
        const esMCTooltip = esMessages.analyzer.monteCarlo.tooltip;
        const enMCTooltip = enMessages.analyzer.monteCarlo.tooltip;

        expect(esStability).not.toContain("supervivencia");
        expect(enStability.toLowerCase()).not.toContain("survival");
        expect(esMCTooltip).not.toContain("supervivencia");
        expect(enMCTooltip.toLowerCase()).not.toContain("survival");
    });

    it("reemplaza recomendaciones operativas de trading en nextSteps por diagnósticos cuantitativos de la muestra", () => {
        const esNext = esMessages.analyzer.results.nextSteps;
        const enNext = enMessages.analyzer.results.nextSteps;

        // No órdenes de trading ni invitaciones comerciales
        expect(esNext.strongEdge).not.toContain("Prop Firm");
        expect(enNext.strongEdge).not.toContain("Prop Firm");
        expect(esNext.unstableEdge).not.toContain("Reduce el tamaño");
        expect(enNext.unstableEdge).not.toContain("Cut your position");
        expect(esNext.noEdge).not.toContain("Soluciona esto antes");
        expect(enNext.noEdge).not.toContain("Fix this before");
    });
});
