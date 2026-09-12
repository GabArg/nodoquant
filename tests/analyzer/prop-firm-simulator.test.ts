import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { FullMetrics } from "../../lib/analyzer/metrics";
import {
    CUSTOM_PROP_FIRM_CONFIG,
    runPropFirmMonteCarlo,
    strategyDataFromMetrics,
    validatePropFirmConfig,
    type PropFirmConfig,
    type PropFirmSimulationResult,
    type StrategySimulationData,
} from "../../lib/analyzer/propFirm";
import { configFromPreset, customConfigFromPreset, PROP_FIRM_PRESETS, REFERENCE_PROP_FIRM_PRESETS, VERIFIED_PROP_FIRM_PRESETS } from "../../lib/analyzer/propFirmPresets";
import { addComparisonScenario, bestFitScenarioId, propFirmConfigComparisonKey, type PropFirmScenario } from "../../lib/analyzer/propFirmScenarios";
import { getSimulationQuality, methodologyKey } from "../../lib/analyzer/propFirmMethodology";
import { normalizePublicReportMetrics } from "../../lib/analyzer/publicReportMetrics";

const strategy: StrategySimulationData = { outcomes: [-1, 2], source: "normalizedTradeSequence" };
const config = (overrides: Partial<PropFirmConfig> = {}): PropFirmConfig => ({
    ...CUSTOM_PROP_FIRM_CONFIG,
    phases: [{ id: "p1", name: "Phase 1", profitTargetPct: 10, maxTradingDays: 2 }],
    ...overrides,
});

describe("Prop Firm challenge Monte Carlo", () => {
    it("accepts a valid custom configuration and rejects invalid rules", () => {
        expect(validatePropFirmConfig(config())).toEqual([]);
        expect(validatePropFirmConfig(config({ accountSize: 0, phases: [] }))).toEqual(expect.arrayContaining(["accountSize", "phases"]));
    });

    it("receives challenge-specific config and detects a target pass", () => {
        const result = runPropFirmMonteCarlo(strategy, config({ phases: [{ id: "p1", name: "Phase 1", profitTargetPct: 1, maxTradingDays: 1 }] }), 5, () => 0.99);
        expect(result.passed).toBe(5);
        expect(result.totalPassProbability).toBe(100);
        expect(result.failureCounts.targetNotReached).toBe(0);
    });

    it("detects daily loss violations", () => {
        const result = runPropFirmMonteCarlo(strategy, config({ dailyLossLimitPct: 0.5, maxLossLimitPct: 50 }), 4, () => 0);
        expect(result.failureCounts.dailyLoss).toBe(4);
        expect(result.dailyLossViolationProbability).toBe(100);
    });

    it("detects max loss violations independently", () => {
        const result = runPropFirmMonteCarlo(strategy, config({ dailyLossLimitPct: 50, maxLossLimitPct: 0.5 }), 4, () => 0);
        expect(result.failureCounts.maxLoss).toBe(4);
        expect(result.maxLossViolationProbability).toBe(100);
    });

    it("counts target not reached when limits survive but the phase expires", () => {
        const result = runPropFirmMonteCarlo({ outcomes: [-0.1, 0], source: "normalizedTradeSequence" }, config({ dailyLossLimitPct: 99, maxLossLimitPct: 99 }), 3, () => 0.99);
        expect(result.failureCounts.targetNotReached).toBe(3);
        expect(result.targetNotReachedProbability).toBe(100);
    });

    it("models multiple phases instead of assuming a single phase", () => {
        const result = runPropFirmMonteCarlo(strategy, config({ phases: [
            { id: "p1", name: "Phase 1", profitTargetPct: 1, maxTradingDays: 1 },
            { id: "p2", name: "Phase 2", profitTargetPct: 1, maxTradingDays: 1 },
        ] }), 3, () => 0.99);
        expect(result.phasePassProbabilities).toEqual([100, 100]);
        expect(result.totalPassProbability).toBe(100);
    });

    it("keeps real zero distinct from unavailable", () => {
        const completed = runPropFirmMonteCarlo(strategy, config({ phases: [{ id: "p1", name: "Phase 1", profitTargetPct: 1, maxTradingDays: 1 }] }), 2, () => 0.99);
        const unavailable = runPropFirmMonteCarlo({ outcomes: [], source: "normalizedTradeSequence" }, config(), 2);
        expect(completed.dailyLossViolationProbability).toBe(0);
        expect(unavailable.dailyLossViolationProbability).toBeNull();
        expect(unavailable.totalPassProbability).toBeNull();
    });

    it("does not mutate intrinsic strategy metrics", () => {
        const metrics = { tradeHistogram: [1, 1], minProfit: -1, maxProfit: 2 } as FullMetrics;
        const before = JSON.stringify(metrics);
        const data = strategyDataFromMetrics(metrics);
        if (data) runPropFirmMonteCarlo(data, config(), 2, () => 0.99);
        expect(JSON.stringify(metrics)).toBe(before);
    });

    it("selects usable persisted strategy data without changing the saved metrics", () => {
        const metrics = { tradeHistogram: [5, 5], minProfit: -1, maxProfit: 2 } as FullMetrics;
        const data = strategyDataFromMetrics(metrics);
        expect(data?.source).toBe("histogramApproximation");
        expect(data?.outcomes).toHaveLength(10);
        expect(metrics.tradeHistogram).toEqual([5, 5]);
    });

    it("keeps legacy persisted Prop Firm data readable", () => {
        const normalized = normalizePublicReportMetrics({ trades_count: 10, winrate: 50, profit_factor: 1.2, max_drawdown: 5, sum_profit: 1, metrics_json: { propFirm: { passProb: 0 } } });
        expect(normalized.availability.propFirm).toBe(true);
        expect(normalized.metrics.propFirm?.passProb).toBe(0);
    });
});

describe("versioned Prop Firm presets and comparison", () => {
    const result = (pass: number, daily = 0, max = 0): PropFirmSimulationResult => ({
        status: "completed", iterations: 1000, passed: pass * 10, phasePassProbabilities: [pass], totalPassProbability: pass,
        dailyLossViolationProbability: daily, maxLossViolationProbability: max, targetNotReachedProbability: 0,
        consistencyViolationProbability: 0, consistencyScore: 90, expectedTradesToPass: 20,
        durationDays: { p5: 2, p50: 4, p95: 8 }, failureCounts: { dailyLoss: daily * 10, maxLoss: max * 10, targetNotReached: 0, consistency: 0 },
        primaryFailureCause: daily >= max ? "dailyLoss" : "maxLoss", dataSource: "histogramApproximation",
    });
    const scenario = (id: string, strategyId: string, pass: number, daily = 0, max = 0, effectiveConfig = config()): PropFirmScenario => ({ id, strategyId, label: id, presetId: id, config: effectiveConfig, result: result(pass, daily, max) });

    it("keeps Custom available and returns preset configs without mutating the catalog", () => {
        expect(CUSTOM_PROP_FIRM_CONFIG.id).toBe("custom");
        const preset = PROP_FIRM_PRESETS[0];
        const copy = configFromPreset(preset);
        copy.phases[0].profitTargetPct = 99;
        expect(preset.config.phases[0].profitTargetPct).not.toBe(99);
    });

    it("keeps reference templates explicitly non-official", () => {
        for (const preset of REFERENCE_PROP_FIRM_PRESETS) {
            expect(preset.version).toBeTruthy();
            expect(preset.officialRules).toBe(false);
            expect(preset.verifiedAt).toBeUndefined();
        }
    });

    it("requires versioned, dated, valid official sources on every verified preset", () => {
        expect(VERIFIED_PROP_FIRM_PRESETS.map(item => item.id)).toEqual(["ftmo-2-step", "fundingpips-2-step-standard"]);
        for (const preset of VERIFIED_PROP_FIRM_PRESETS) {
            expect(preset.officialRules).toBe(true);
            expect(preset.version).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(preset.verifiedAt).toBe(preset.version);
            expect(preset.sources.length).toBeGreaterThan(0);
            for (const source of preset.sources) {
                expect(new URL(source.url).protocol).toBe("https:");
                expect(source.checkedAt).toBe(preset.verifiedAt);
            }
        }
    });

    it("marks unsupported rules as metadata, never as numeric zero", () => {
        for (const preset of VERIFIED_PROP_FIRM_PRESETS) {
            expect(preset.fidelity).toMatchObject({ dailyLoss: "approximated", maxLoss: "approximated", intradayEquity: "unsupported", specialRules: "unsupported" });
            expect(Object.values(preset.fidelity!)).not.toContain(0);
        }
    });

    it("turns a verified preset into a defensive unofficial custom config", () => {
        const preset = VERIFIED_PROP_FIRM_PRESETS[0];
        const custom = customConfigFromPreset(preset, "Custom");
        custom.phases[0].profitTargetPct = 99;
        expect(custom).toMatchObject({ id: "custom", name: "Custom", provider: undefined, version: undefined, sourceUpdatedAt: undefined });
        expect(preset.config.phases[0].profitTargetPct).toBe(10);
    });

    it("selecting a different preset yields its own rules", () => {
        const first = configFromPreset(PROP_FIRM_PRESETS[0]);
        const twoStep = configFromPreset(PROP_FIRM_PRESETS[2]);
        expect(first.id).not.toBe(twoStep.id);
        expect(first.phases).toHaveLength(1);
        expect(twoStep.phases).toHaveLength(2);
    });

    it("limits comparison to three scenarios and rejects a different strategy", () => {
        let items: PropFirmScenario[] = [];
        items = addComparisonScenario(items, scenario("a", "strategy-a", 80, 0, 0, config({ accountSize: 10000 })));
        items = addComparisonScenario(items, scenario("b", "strategy-a", 70, 0, 0, config({ accountSize: 20000 })));
        items = addComparisonScenario(items, scenario("c", "strategy-a", 60, 0, 0, config({ accountSize: 30000 })));
        items = addComparisonScenario(items, scenario("d", "strategy-a", 50, 0, 0, config({ accountSize: 40000 })));
        items = addComparisonScenario(items, scenario("foreign", "strategy-b", 99, 0, 0, config({ accountSize: 50000 })));
        expect(items.map(item => item.id)).toEqual(["a", "b", "c"]);
    });

    it("does not add the same effective config twice or consume a slot", () => {
        const original = config();
        const metadataOnlyDifference = { ...config(), id: "other-id", name: "Other label", provider: "Other", version: "v9", sourceUpdatedAt: "2099-01-01" };
        let items = addComparisonScenario([], scenario("a", "strategy-a", 80, 0, 0, original));
        items = addComparisonScenario(items, scenario("duplicate", "strategy-a", 80, 0, 0, metadataOnlyDifference));
        expect(items).toHaveLength(1);
        expect(propFirmConfigComparisonKey(original)).toBe(propFirmConfigComparisonKey(metadataOnlyDifference));
        items = addComparisonScenario(items, scenario("different", "strategy-a", 80, 0, 0, config({ maxLossLimitPct: 11 })));
        expect(items.map(item => item.id)).toEqual(["a", "different"]);
    });

    it("selects best fit by pass probability and rule risk as tie-breaker", () => {
        expect(bestFitScenarioId([scenario("a", "s", 80, 10, 5), scenario("b", "s", 90, 20, 20)])).toBe("b");
        expect(bestFitScenarioId([scenario("a", "s", 90, 10, 5), scenario("b", "s", 90, 2, 1)])).toBe("b");
    });

    it("identifies histogram methodology and never labels it high quality", () => {
        const histogram: StrategySimulationData = { outcomes: Array(150).fill(1), source: "histogramApproximation" };
        expect(methodologyKey(histogram)).toBe("histogramApproximation");
        expect(getSimulationQuality(histogram)).toBe("medium");
        expect(getSimulationQuality({ outcomes: Array(100).fill(1), source: "normalizedTradeSequence" })).toBe("high");
    });
});

describe("Prop Firm product placement", () => {
    const report = readFileSync("components/report/PersistedAdvancedSections.tsx", "utf8");
    const fullReport = readFileSync("components/analyzer/FullReport.tsx", "utf8");
    const dashboard = readFileSync("app/[locale]/dashboard/page.tsx", "utf8");
    const metricsEngine = readFileSync("lib/analyzer/metrics.ts", "utf8");
    const simulator = readFileSync("components/dashboard/PropFirmSimulator.tsx", "utf8");
    const es = JSON.parse(readFileSync("messages/es.json", "utf8"));
    const en = JSON.parse(readFileSync("messages/en.json", "utf8"));

    it("removes the extensive persisted block and keeps a report CTA with the report id", () => {
        expect(report).not.toContain("metrics.propFirm");
        expect(fullReport).toContain("propFirmReport=${encodeURIComponent(analysisId)}");
        expect(dashboard).toContain("initialReportId={searchParams?.propFirmReport}");
    });

    it("keeps general Monte Carlo and no longer injects Prop Firm into new intrinsic metrics", () => {
        const fullMetricsBuilder = metricsEngine.slice(metricsEngine.indexOf("export function calcFullMetrics"), metricsEngine.indexOf("export function calcEdgeDecay"));
        expect(fullMetricsBuilder).toContain("calcMonteCarloSimulation(trades, 1000)");
        expect(fullMetricsBuilder).not.toContain("calcPropFirmChallenge");
    });

    it("places Prop Firm before evolution and analysis history", () => {
        expect(dashboard.indexOf("<PropFirmDashboardSimulator")).toBeLessThan(dashboard.indexOf("<ScoreEvolutionChart"));
        expect(dashboard.indexOf("<PropFirmDashboardSimulator")).toBeLessThan(dashboard.indexOf('t("history.title")'));
    });

    it("provides consistent Spanish and English product copy", () => {
        expect(es.dashboard.propFirm).toMatchObject({
            strategy: "Estrategia",
            preset: "Configuración",
            accountSize: "Tamaño de cuenta",
            target: "Objetivo",
            dailyLoss: "Pérdida diaria",
            maxLoss: "Pérdida máxima",
            static: "Estático",
            custom: "Personalizado · No oficial",
            estimatedPass: "Probabilidad estimada de aprobación",
        });
        expect(en.dashboard.propFirm).toMatchObject({
            strategy: "Strategy",
            preset: "Configuration",
            accountSize: "Account size",
            custom: "Custom · Unofficial",
            estimatedPass: "Estimated pass probability",
        });
        expect(JSON.stringify(es.dashboard.propFirm)).not.toMatch(/Daily Loss|Max Loss|Estimated Duration|Pass Probability|Target no logrado|Static/);
        expect(simulator).not.toContain("function labels(");
        expect(es.dashboard.propFirm.presetNames).toEqual({
            "reference-1-step-conservative": "1 Paso · Conservadora",
            "reference-1-step-standard": "1 Paso · Estándar",
            "reference-2-step-standard": "2 Pasos · Estándar",
        });
        expect(en.dashboard.propFirm.presetNames).toEqual({
            "reference-1-step-conservative": "1-Step Conservative",
            "reference-1-step-standard": "1-Step Standard",
            "reference-2-step-standard": "2-Step Standard",
        });
    });

    it("changes the CTA after a result and derives verdict and guidance from real output", () => {
        expect(simulator).toContain("result ? copy.recalculate : copy.simulate");
        expect(simulator).toContain("result.totalPassProbability");
        expect(simulator).toContain("probability >= 70 ? copy.excellent : probability >= 40 ? copy.moderate : copy.elevated");
        expect(simulator).toContain("result.primaryFailureCause");
        expect(simulator).toContain("primaryRisk.${result.primaryFailureCause}");
        expect(simulator.indexOf("hasEquivalentScenario(scenarios")).toBeLessThan(simulator.indexOf("scenarios.length >= MAX_PROP_FIRM_SCENARIOS"));
        expect(es.dashboard.propFirm.duplicateComparison).toBe("Esta configuración ya está en la comparación.");
        expect(en.dashboard.propFirm.duplicateComparison).toBe("This configuration is already in the comparison.");
    });

    it("updates rules from presets and clears comparisons when strategy changes", () => {
        expect(simulator).toContain("configFromPreset(getPropFirmPreset(nextId)!)");
        expect(simulator).toContain("setScenarios([])");
        expect(simulator).toContain("setPresetId(\"custom\")");
        expect(simulator).toContain("setCustomOriginPresetId(presetId)");
        expect(simulator).toContain("customConfigFromPreset(getPropFirmPreset(presetId)!");
        expect(simulator).toContain("originPreset ? `${presetDisplayName(originPreset.id, copy)} · ${copy.customSuffix}` : copy.customShort");
        expect(es.dashboard.propFirm.customShort).toBe("Personalizado");
        expect(en.dashboard.propFirm.customShort).toBe("Custom");
    });

    it("groups reference and verified presets and keeps safe official links", () => {
        expect(simulator).toContain("REFERENCE_PROP_FIRM_PRESETS.map");
        expect(simulator).toContain("VERIFIED_PROP_FIRM_PRESETS.map");
        expect(simulator).toContain('rel="noopener noreferrer"');
        expect(es.dashboard.propFirm.verifiedRules).toBe("Reglas verificadas");
        expect(en.dashboard.propFirm.verifiedRules).toBe("Verified rules");
        expect(es.dashboard.propFirm.partialRulesWarning).toContain("NodoQuant aproxima");
        expect(en.dashboard.propFirm.partialRulesWarning).toContain("NodoQuant approximates");
    });
});
