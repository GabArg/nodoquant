import type { StrategySimulationData } from "./propFirm";

export type SimulationQuality = "high" | "medium" | "limited";

export function getSimulationQuality(data: StrategySimulationData): SimulationQuality {
    if (data.source === "normalizedTradeSequence") {
        if (data.outcomes.length >= 100) return "high";
        if (data.outcomes.length >= 30) return "medium";
    } else if (data.outcomes.length >= 100) {
        return "medium";
    }
    return "limited";
}

export function methodologyKey(data: StrategySimulationData): "normalizedTradeSequence" | "histogramApproximation" {
    return data.source;
}
