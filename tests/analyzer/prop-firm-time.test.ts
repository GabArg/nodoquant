import { describe, expect, it } from "vitest";
import { getPropFirmPreset } from "../../lib/analyzer/propFirmPresets";
import { dailyResetLabel, groupTradesByEvaluationDay, UTC_DAILY_RESET, type DailyResetConfig } from "../../lib/analyzer/propFirmTime";

const trades = (...timestamps: string[]) => timestamps.map((closedAt, index) => ({ index, profit: index, closedAt }));
const sizes = (groups: ReturnType<typeof groupTradesByEvaluationDay>) => groups.map(group => group.map(item => item.index));

describe("Prop Firm evaluation-day reset", () => {
    it("keeps UTC midnight as the internal default", () => {
        const groups = groupTradesByEvaluationDay(trades("2026-01-01T23:59:59Z", "2026-01-02T00:00:00Z"));
        expect(sizes(groups)).toEqual([[0], [1]]);
        expect(dailyResetLabel(UTC_DAILY_RESET)).toBe("00:00 UTC");
    });

    it("projects absolute instants into an IANA timezone at midnight", () => {
        const reset: DailyResetConfig = { timeZone: { kind: "iana", name: "Europe/Prague" }, hour: 0, minute: 0, semantics: "evaluationDayStart" };
        expect(sizes(groupTradesByEvaluationDay(trades("2026-01-15T22:59:59Z", "2026-01-15T23:00:00Z"), reset))).toEqual([[0], [1]]);
    });

    it("supports a non-midnight reset and preserves order within a day", () => {
        const reset: DailyResetConfig = { timeZone: { kind: "iana", name: "UTC" }, hour: 6, minute: 0, semantics: "evaluationDayStart" };
        const groups = groupTradesByEvaluationDay(trades("2026-01-02T05:00:00Z", "2026-01-02T05:59:59Z", "2026-01-02T06:00:00Z"), reset);
        expect(sizes(groups)).toEqual([[0, 1], [2]]);
    });

    it("honors Europe/Prague DST before and after the spring transition", () => {
        const reset: DailyResetConfig = { timeZone: { kind: "iana", name: "Europe/Prague" }, hour: 0, minute: 0, semantics: "evaluationDayStart" };
        expect(sizes(groupTradesByEvaluationDay(trades("2026-03-28T22:59:59Z", "2026-03-28T23:00:00Z"), reset))).toEqual([[0], [1]]);
        expect(sizes(groupTradesByEvaluationDay(trades("2026-03-29T21:59:59Z", "2026-03-29T22:00:00Z"), reset))).toEqual([[0], [1]]);
    });

    it("treats FundingPips UTC+3 as a fixed offset without DST", () => {
        const reset: DailyResetConfig = { timeZone: { kind: "fixedOffset", offsetMinutes: 180, name: "UTC+03:00" }, hour: 0, minute: 0, semantics: "evaluationDayStart" };
        expect(sizes(groupTradesByEvaluationDay(trades("2026-01-01T20:59:59Z", "2026-01-01T21:00:00Z"), reset))).toEqual([[0], [1]]);
        expect(sizes(groupTradesByEvaluationDay(trades("2026-07-01T20:59:59Z", "2026-07-01T21:00:00Z"), reset))).toEqual([[0], [1]]);
    });

    it("stores the verified temporal configs without upgrading equity fidelity", () => {
        const ftmo = getPropFirmPreset("ftmo-2-step")!;
        const fundingPips = getPropFirmPreset("fundingpips-2-step-standard")!;
        expect(ftmo.config.dailyReset).toEqual({ timeZone: { kind: "iana", name: "Europe/Prague" }, hour: 0, minute: 0, semantics: "evaluationDayStart" });
        expect(ftmo.config.dailyLossCalculation).toBe("balance");
        expect(fundingPips.config.dailyReset).toEqual({ timeZone: { kind: "fixedOffset", offsetMinutes: 180, name: "UTC+03:00" }, hour: 0, minute: 0, semantics: "evaluationDayStart" });
        expect(fundingPips.config.dailyLossCalculation).toBe("balanceOrEquity");
        expect(ftmo.fidelity?.dailyLoss).toBe("approximated");
        expect(fundingPips.fidelity?.dailyLoss).toBe("approximated");
        expect(ftmo.fidelity?.intradayEquity).toBe("unsupported");
    });
});
