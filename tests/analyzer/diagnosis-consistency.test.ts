import { describe, expect, it } from "vitest";
import { getCanonicalDiagnosis, isNegativeDiagnosis } from "../../lib/analyzer/diagnosis";
import type { BasicMetrics, FullMetrics } from "../../lib/analyzer/metrics";

const strongBasic: BasicMetrics = {
    totalTrades: 140,
    winrate: 64.3,
    profitFactor: 2.49,
    maxDrawdown: 0.7,
    maxDrawdownAbs: 0.7,
    expectancy: 1,
    sumProfit: 140,
};

describe("canonical report diagnosis", () => {
    it("never classifies a canonical strong edge as an imminent-loss warning", () => {
        const full = {
            ...strongBasic,
            advanced: { verdict: "strongEdge" },
        } as FullMetrics;
        const verdict = getCanonicalDiagnosis(strongBasic, full);
        expect(verdict).toBe("strongEdge");
        expect(isNegativeDiagnosis(verdict)).toBe(false);
    });

    it("uses the same deterministic fallback when advanced diagnosis is absent", () => {
        expect(getCanonicalDiagnosis(strongBasic)).toBe("strongEdge");
    });
});
