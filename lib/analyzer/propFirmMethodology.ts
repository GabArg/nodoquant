import type { StrategySimulationData } from "./propFirm";
import type { PropFirmOverallFidelity, PropFirmPreset } from "./propFirmPresets";

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

const qualityRank: Record<SimulationQuality, number> = { limited: 0, medium: 1, high: 2 };

/** A verified ruleset never raises the quality supported by the available strategy data. */
export function getPresetSimulationQuality(data: StrategySimulationData, preset?: PropFirmPreset): SimulationQuality {
    const dataQuality = getSimulationQuality(data);
    const presetQuality = preset?.fidelity?.overall as PropFirmOverallFidelity | undefined;
    if (!presetQuality) return dataQuality;
    return qualityRank[dataQuality] <= qualityRank[presetQuality] ? dataQuality : presetQuality;
}
