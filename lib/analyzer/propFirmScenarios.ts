import type { PropFirmConfig, PropFirmSimulationResult } from "./propFirm";
import { UTC_DAILY_RESET } from "./propFirmTime";

export const MAX_PROP_FIRM_SCENARIOS = 3;

export interface PropFirmScenario {
    id: string;
    strategyId: string;
    label: string;
    presetId: string;
    config: PropFirmConfig;
    result: PropFirmSimulationResult;
}

export function propFirmConfigComparisonKey(config: PropFirmConfig): string {
    return JSON.stringify({
        accountSize: config.accountSize,
        phases: config.phases.map(phase => ({
            profitTargetPct: phase.profitTargetPct,
            dailyLossLimitPct: phase.dailyLossLimitPct ?? null,
            maxLossLimitPct: phase.maxLossLimitPct ?? null,
            minTradingDays: phase.minTradingDays ?? null,
            maxTradingDays: phase.maxTradingDays ?? null,
        })),
        dailyLossLimitPct: config.dailyLossLimitPct,
        maxLossLimitPct: config.maxLossLimitPct,
        drawdownType: config.drawdownType,
        dailyLossCalculation: config.dailyLossCalculation,
        dailyReset: config.dailyReset ?? UTC_DAILY_RESET,
        tradesPerDayEstimate: config.tradesPerDayEstimate,
        consistencyRulePct: config.consistencyRulePct ?? null,
    });
}

export function hasEquivalentScenario(current: readonly PropFirmScenario[], strategyId: string, config: PropFirmConfig): boolean {
    const key = propFirmConfigComparisonKey(config);
    return current.some(item => item.strategyId === strategyId && propFirmConfigComparisonKey(item.config) === key);
}

export function addComparisonScenario(current: readonly PropFirmScenario[], scenario: PropFirmScenario): PropFirmScenario[] {
    if (current.length && current[0].strategyId !== scenario.strategyId) return [...current];
    if (hasEquivalentScenario(current, scenario.strategyId, scenario.config)) return [...current];
    if (current.length >= MAX_PROP_FIRM_SCENARIOS) return [...current];
    return [...current, structuredClone(scenario)];
}

export function bestFitScenarioId(scenarios: readonly PropFirmScenario[]): string | null {
    if (scenarios.length < 2) return null;
    return [...scenarios].sort((a, b) => {
        const passDelta = (b.result.totalPassProbability ?? -1) - (a.result.totalPassProbability ?? -1);
        if (passDelta) return passDelta;
        const riskA = (a.result.dailyLossViolationProbability ?? 100) + (a.result.maxLossViolationProbability ?? 100);
        const riskB = (b.result.dailyLossViolationProbability ?? 100) + (b.result.maxLossViolationProbability ?? 100);
        return riskA - riskB;
    })[0]?.id ?? null;
}
