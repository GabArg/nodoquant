import { describe, expect, it } from "vitest";
import { getUserEntitlement, hasActiveLegacyProAccess, resolveEntitlement } from "../../lib/payments/entitlements";

const now = new Date("2026-09-09T12:00:00.000Z");

describe("beta entitlement resolution", () => {
    it("fails closed for missing and malformed subscription data", () => {
        expect(hasActiveLegacyProAccess(null, now)).toBe(false);
        expect(hasActiveLegacyProAccess({ plan: "pro", status: "unknown" }, now)).toBe(false);
        expect(hasActiveLegacyProAccess({ plan: "pro", status: "active", current_period_end: "invalid" }, now)).toBe(false);
    });

    it("keeps valid historical pro access", () => {
        expect(hasActiveLegacyProAccess({ plan: "pro", status: "active" }, now)).toBe(true);
        expect(hasActiveLegacyProAccess({ plan: "pro", status: "active", current_period_end: "2026-10-01T00:00:00.000Z" }, now)).toBe(true);
    });

    it("rejects free, inactive and expired rows", () => {
        expect(hasActiveLegacyProAccess({ plan: "free", status: "active" }, now)).toBe(false);
        expect(hasActiveLegacyProAccess({ plan: "pro", status: "inactive" }, now)).toBe(false);
        expect(hasActiveLegacyProAccess({ plan: "pro", status: "active", current_period_end: "2026-09-01T00:00:00.000Z" }, now)).toBe(false);
    });

    it("uses explicit entitlements first and beta as the default", () => {
        expect(resolveEntitlement({ explicitTier: "beta", legacySubscription: { plan: "pro", status: "active" }, now })).toEqual({ tier: "beta", isPro: false, source: "explicit" });
        expect(resolveEntitlement({})).toEqual({ tier: "beta", isPro: false, source: "beta_default" });
        expect(resolveEntitlement({ legacySubscription: { plan: "pro", status: "active" }, now }).source).toBe("legacy_subscription");
    });

    it("does not read the legacy provider table unless explicitly enabled", async () => {
        const client = { from: () => { throw new Error("legacy lookup must not run"); } };
        await expect(getUserEntitlement(client, "user-id")).resolves.toEqual({
            tier: "beta",
            isPro: false,
            source: "beta_default",
        });
    });
});
