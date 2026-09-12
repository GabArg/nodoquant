import type { PropFirmConfig } from "./propFirm";

export type PropFirmRuleFidelity = "exact" | "approximated" | "unsupported";
export type PropFirmOverallFidelity = "high" | "medium" | "limited";

export interface PropFirmPresetSource {
    label: string;
    url: string;
    checkedAt: string;
}

export interface PropFirmPresetFidelity {
    overall: PropFirmOverallFidelity;
    dailyLoss: PropFirmRuleFidelity;
    maxLoss: PropFirmRuleFidelity;
    phases: PropFirmRuleFidelity;
    consistency: PropFirmRuleFidelity;
    intradayEquity: PropFirmRuleFidelity;
    specialRules: PropFirmRuleFidelity;
}

export interface PropFirmPreset {
    id: string;
    provider: string;
    program: string;
    displayName: string;
    name: string;
    description: string;
    version: string;
    verifiedAt?: string;
    officialRules: boolean;
    sources: PropFirmPresetSource[];
    config: PropFirmConfig;
    fidelity?: PropFirmPresetFidelity;
    notes?: string[];
}

const reference = (preset: Omit<PropFirmPreset, "provider" | "program" | "displayName" | "version" | "officialRules" | "sources">): PropFirmPreset => ({
    ...preset,
    provider: "NodoQuant",
    program: preset.name,
    displayName: preset.name,
    version: "reference-1.0",
    officialRules: false,
    sources: [],
});

const VERIFIED_AT = "2026-09-12";
const fundingPipsSource = (label: string, url: string): PropFirmPresetSource => ({ label, url, checkedAt: VERIFIED_AT });

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
    {
        id: "ftmo-2-step", provider: "FTMO", program: "2-Step", displayName: "FTMO · 2-Step", name: "FTMO · 2-Step",
        description: "Current FTMO two-phase evaluation rules.", version: VERIFIED_AT, verifiedAt: VERIFIED_AT, officialRules: true,
        sources: [
            fundingPipsSource("FTMO · 2-Step Challenge", "https://ftmo.com/en/2-step-challenge/"),
            fundingPipsSource("FTMO · Trading Objectives", "https://ftmo.com/en/trading-objectives/"),
        ],
        config: {
            id: "ftmo-2-step", name: "FTMO · 2-Step", provider: "FTMO", accountSize: 100000,
            phases: [
                { id: "phase-1", name: "FTMO Challenge", profitTargetPct: 10, minTradingDays: 4 },
                { id: "phase-2", name: "Verification", profitTargetPct: 5, minTradingDays: 4 },
            ],
            dailyLossLimitPct: 5, maxLossLimitPct: 10, drawdownType: "static", dailyLossCalculation: "balance", tradesPerDayEstimate: 5,
            version: VERIFIED_AT, sourceUpdatedAt: VERIFIED_AT,
        },
        fidelity: { overall: "medium", dailyLoss: "approximated", maxLoss: "approximated", phases: "exact", consistency: "exact", intradayEquity: "unsupported", specialRules: "unsupported" },
        notes: ["Daily loss resets at 00:00 CE(S)T from the balance recorded at that time; NodoQuant has no real intraday equity path.", "The unlimited official trading period is represented with NodoQuant's finite simulation horizon."],
    },
    {
        id: "fundingpips-2-step-standard", provider: "FundingPips", program: "2 Step Standard", displayName: "FundingPips · 2 Step Standard", name: "FundingPips · 2 Step Standard",
        description: "Current FundingPips 2 Step Standard evaluation rules.", version: VERIFIED_AT, verifiedAt: VERIFIED_AT, officialRules: true,
        sources: [
            fundingPipsSource("FundingPips · 2 Step Standard", "https://help.fundingpips.com/hc/en-us/articles/34501809112081-2-Step-Standard"),
            fundingPipsSource("FundingPips · Terms and Conditions", "https://fundingpips.com/legal/terms-and-conditions"),
        ],
        config: {
            id: "fundingpips-2-step-standard", name: "FundingPips · 2 Step Standard", provider: "FundingPips", accountSize: 100000,
            phases: [
                { id: "phase-1", name: "Phase 1", profitTargetPct: 8, minTradingDays: 3 },
                { id: "phase-2", name: "Phase 2", profitTargetPct: 5, minTradingDays: 3 },
            ],
            dailyLossLimitPct: 5, maxLossLimitPct: 10, drawdownType: "static", dailyLossCalculation: "balanceOrEquity", tradesPerDayEstimate: 5,
            version: VERIFIED_AT, sourceUpdatedAt: VERIFIED_AT,
        },
        fidelity: { overall: "medium", dailyLoss: "approximated", maxLoss: "approximated", phases: "exact", consistency: "exact", intradayEquity: "unsupported", specialRules: "unsupported" },
        notes: ["Daily loss uses the higher of opening balance or opening equity at 00:00 platform time (UTC+3), including floating P/L.", "Inactivity and conduct policies are not modeled."],
    },
] as const;

export const REFERENCE_PROP_FIRM_PRESETS = PROP_FIRM_PRESETS.filter(preset => !preset.officialRules);
export const VERIFIED_PROP_FIRM_PRESETS = PROP_FIRM_PRESETS.filter(preset => preset.officialRules);

export function getPropFirmPreset(id: string): PropFirmPreset | undefined {
    return PROP_FIRM_PRESETS.find(preset => preset.id === id);
}

export function configFromPreset(preset: PropFirmPreset): PropFirmConfig {
    return structuredClone(preset.config);
}

export function customConfigFromPreset(preset: PropFirmPreset, name = "Custom"): PropFirmConfig {
    return { ...configFromPreset(preset), id: "custom", name, provider: undefined, version: undefined, sourceUpdatedAt: undefined };
}

export function presetHasPartialRules(preset: PropFirmPreset): boolean {
    if (!preset.fidelity) return false;
    return Object.entries(preset.fidelity).some(([key, value]) => key !== "overall" && value !== "exact");
}
