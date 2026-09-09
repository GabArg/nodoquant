import { describe, expect, it } from "vitest";
import { countSavedAnalyses } from "../../lib/dashboardStats";

describe("dashboard saved-analysis counter", () => {
    it("reports one saved analysis when one owned row is loaded", () => {
        expect(countSavedAnalyses([{ id: "report-1" }])).toBe(1);
    });

    it("reports zero only for an empty or unavailable result", () => {
        expect(countSavedAnalyses([])).toBe(0);
        expect(countSavedAnalyses(null)).toBe(0);
    });
});
