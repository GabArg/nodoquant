import { describe, expect, it } from "vitest";
import { isUserAdmin } from "../../lib/auth/admin";

describe("Admin Authorization Engine (isUserAdmin)", () => {
    it("denies access when user is null or undefined", () => {
        expect(isUserAdmin(null)).toBe(false);
        expect(isUserAdmin(undefined)).toBe(false);
    });

    it("denies access when user has no email", () => {
        expect(isUserAdmin({ id: "user-123", email: null })).toBe(false);
        expect(isUserAdmin({ id: "user-123", email: "" })).toBe(false);
    });

    it("denies access to normal authenticated users", () => {
        expect(isUserAdmin({ id: "user-1", email: "trader@gmail.com" }, { NODE_ENV: "production" })).toBe(false);
        expect(isUserAdmin({ id: "user-2", email: "quant@yahoo.com" }, { NODE_ENV: "production" })).toBe(false);
        expect(isUserAdmin({ id: "user-3", email: "user@nodoquant.fake.com" }, { NODE_ENV: "production" })).toBe(false);
    });

    it("allows access to company domain (@nodoquant.com)", () => {
        expect(isUserAdmin({ id: "admin-1", email: "admin@nodoquant.com" })).toBe(true);
        expect(isUserAdmin({ id: "admin-2", email: "security@nodoquant.com" })).toBe(true);
        expect(isUserAdmin({ id: "admin-3", email: "founder@NODOQUANT.COM" })).toBe(true);
    });

    it("allows access when email is in ADMIN_EMAILS environment variable", () => {
        const env = { ADMIN_EMAILS: "gabriel@external.com, auditor@security.io" };
        expect(isUserAdmin({ id: "ext-1", email: "gabriel@external.com" }, env)).toBe(true);
        expect(isUserAdmin({ id: "ext-2", email: "auditor@security.io" }, env)).toBe(true);
        expect(isUserAdmin({ id: "ext-3", email: "other@external.com" }, env)).toBe(false);
    });
});
