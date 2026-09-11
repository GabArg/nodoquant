import type { PropFirmConfig } from "./propFirm";

export interface PropFirmPreset {
    id: string;
    provider: string;
    name: string;
    description: string;
    version: string;
    updatedAt: string;
    sourceUrl?: string;
    sourceLabel: string;
    official: boolean;
    config: PropFirmConfig;
}

const reference = (preset: Omit<PropFirmPreset, "provider" | "version" | "updatedAt" | "sourceLabel" | "official">): PropFirmPreset => ({
    ...preset,
    provider: "NodoQuant",
    version: "reference-1.0",
    updatedAt: "2026-09-11",
    sourceLabel: "NodoQuant",
    official: false,
});

export const PROP_FIRM_PRESETS: readonly PropFirmPreset[] = [
    reference({
        id: "reference-1-step-conservative",
        name: "1-Step Conservative",
        description: "Reference template with tighter evaluation constraints.",
        config: {
            id: "reference-1-step-conservative", name: "1-Step Conservative", provider: "NodoQuant", accountSize: 100000,
            phases: [{ id: "phase-1", name: "Phase 1", profitTargetPct: 8, minTradingDays: 5, maxTradingDays: 30 }],
            dailyLossLimitPct: 4, maxLossLimitPct: 8, drawdownType: "static", dailyLossCalculation: "balanceOrEquity", tradesPerDayEstimate: 5,
            version: "reference-1.0", sourceUpdatedAt: "2026-09-11",
        },
    }),
    reference({
        id: "reference-1-step-standard",
        name: "1-Step Standard",
        description: "Neutral one-phase reference template, not tied to a firm.",
        config: {
            id: "reference-1-step-standard", name: "1-Step Standard", provider: "NodoQuant", accountSize: 100000,
            phases: [{ id: "phase-1", name: "Phase 1", profitTargetPct: 10, maxTradingDays: 30 }],
            dailyLossLimitPct: 5, maxLossLimitPct: 10, drawdownType: "static", dailyLossCalculation: "balanceOrEquity", tradesPerDayEstimate: 5,
            version: "reference-1.0", sourceUpdatedAt: "2026-09-11",
        },
    }),
    reference({
        id: "reference-2-step-standard",
        name: "2-Step Standard",
        description: "Neutral two-phase reference template, not tied to a firm.",
        config: {
            id: "reference-2-step-standard", name: "2-Step Standard", provider: "NodoQuant", accountSize: 100000,
            phases: [
                { id: "phase-1", name: "Phase 1", profitTargetPct: 10, maxTradingDays: 30 },
                { id: "phase-2", name: "Phase 2", profitTargetPct: 5, maxTradingDays: 30 },
            ],
            dailyLossLimitPct: 5, maxLossLimitPct: 10, drawdownType: "static", dailyLossCalculation: "balanceOrEquity", tradesPerDayEstimate: 5,
            version: "reference-1.0", sourceUpdatedAt: "2026-09-11",
        },
    }),
] as const;

export function getPropFirmPreset(id: string): PropFirmPreset | undefined {
    return PROP_FIRM_PRESETS.find(preset => preset.id === id);
}

export function configFromPreset(preset: PropFirmPreset): PropFirmConfig {
    return structuredClone(preset.config);
}
