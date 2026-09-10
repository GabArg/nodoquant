import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { completionReportHref, completionReportId, type AnalysisSaveOutcome } from "../../lib/analyzer/completion";
import { exceedsBetaTradeLimit, mustCheckBetaSavedAnalysisLimit } from "../../lib/payments/subscription";

describe("analyzer save limit policy", () => {
    it("bypasses both beta limits for Pro users", () => {
        expect(exceedsBetaTradeLimit(true, 501)).toBe(false);
        expect(mustCheckBetaSavedAnalysisLimit(true, true)).toBe(false);
    });

    it("keeps both limits enabled for beta users", () => {
        expect(exceedsBetaTradeLimit(false, 501)).toBe(true);
        expect(mustCheckBetaSavedAnalysisLimit(false, true)).toBe(true);
        expect(mustCheckBetaSavedAnalysisLimit(false, false)).toBe(false);
    });

    it("makes the save route consume canonical entitlement before limit checks", () => {
        const route = readFileSync("app/api/analyzer/save/route.ts", "utf8");
        expect(route).toContain("getUserEntitlement(supabase");
        expect(route).not.toContain("getUserSubscription(");
        expect(route.indexOf("const isPro = entitlement.isPro")).toBeLessThan(route.indexOf("exceedsBetaTradeLimit(isPro"));
        expect(route.indexOf("mustCheckBetaSavedAnalysisLimit(isPro")).toBeLessThan(route.indexOf("canCreateStrategy(user_id, isPro)"));
    });
});

describe("analyzer completion routing", () => {
    it.each<[AnalysisSaveOutcome, string, string]>([
        [{ status: "saved", reportId: "new-report" }, "new-report", "/es/report/new-report"],
        [{ status: "duplicated", reportId: "existing-report" }, "existing-report", "/es/report/existing-report"],
        [{ status: "beta_limit", existingReportId: "saved-report" }, "saved-report", "/es/report/saved-report"],
    ])("routes $status to the correct report", (outcome, expectedId, expectedHref) => {
        expect(completionReportId(outcome)).toBe(expectedId);
        expect(completionReportHref(outcome, "es")).toBe(expectedHref);
    });

    it("does not invent a route when the beta-limit response has no saved report", () => {
        const outcome: AnalysisSaveOutcome = { status: "beta_limit", existingReportId: null };
        expect(completionReportId(outcome)).toBeNull();
        expect(completionReportHref(outcome, "en")).toBeNull();
    });
});
