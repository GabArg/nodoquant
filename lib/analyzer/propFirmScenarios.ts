import type { PropFirmConfig, PropFirmSimulationResult } from "./propFirm";

export const MAX_PROP_FIRM_SCENARIOS = 3;

export interface PropFirmScenario {
    id: string;
    strategyId: string;
    label: string;
    presetId: string;
    config: PropFirmConfig;
    result: PropFirmSimulationResult;
}

export function addComparisonScenario(current: readonly PropFirmScenario[], scenario: PropFirmScenario): PropFirmScenario[] {
    if (current.length && current[0].strategyId !== scenario.strategyId) return [...current];
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
