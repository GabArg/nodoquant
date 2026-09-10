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

    it("grants explicit Pro to an allowlisted user in preview and development", async () => {
        const preview = {
            NODE_ENV: "production",
            VERCEL_ENV: "preview",
            NODOQUANT_TEST_PRO_USER_IDS: "other-id, test-user-id",
        };
        const development = {
            NODE_ENV: "development",
            NODOQUANT_TEST_PRO_EMAILS: "test@example.com",
        };

        await expect(getUserEntitlement(null, { id: "test-user-id" }, { environment: preview })).resolves.toEqual({
            tier: "pro", isPro: true, source: "explicit",
        });
        await expect(getUserEntitlement(null, { id: "user-id", email: "TEST@example.com" }, { environment: development })).resolves.toEqual({
            tier: "pro", isPro: true, source: "explicit",
        });
    });

    it("keeps users outside the allowlist on beta access", async () => {
        await expect(getUserEntitlement(null, { id: "regular-user", email: "regular@example.com" }, {
            environment: { NODE_ENV: "development", NODOQUANT_TEST_PRO_EMAILS: "test@example.com" },
        })).resolves.toEqual({ tier: "beta", isPro: false, source: "beta_default" });
    });

    it("ignores every test allowlist in production", async () => {
        const production = {
            NODE_ENV: "production",
            VERCEL_ENV: "production",
            NODOQUANT_TEST_PRO_USER_IDS: "test-user-id",
            NODOQUANT_TEST_PRO_EMAILS: "test@example.com",
        };

        await expect(getUserEntitlement(null, { id: "test-user-id", email: "test@example.com" }, { environment: production })).resolves.toEqual({
            tier: "beta", isPro: false, source: "beta_default",
        });
    });
});
