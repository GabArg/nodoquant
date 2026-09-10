export type EntitlementTier = "beta" | "pro";
export type EntitlementSource = "explicit" | "legacy_subscription" | "beta_default";

export interface UserEntitlement {
    tier: EntitlementTier;
    isPro: boolean;
    source: EntitlementSource;
}

export interface LegacySubscriptionRow {
    plan?: unknown;
    status?: unknown;
    current_period_end?: unknown;
}

interface EntitlementDatabaseClient {
    from(table: string): any;
}

export interface EntitlementUser {
    id: string;
    email?: string | null;
}

interface EntitlementEnvironment {
    NODE_ENV?: string;
    VERCEL_ENV?: string;
    NODOQUANT_TEST_PRO_USER_IDS?: string;
    NODOQUANT_TEST_PRO_EMAILS?: string;
}

function allowlistValues(value: string | undefined): Set<string> {
    return new Set(
        (value ?? "")
            .split(",")
            .map((entry) => entry.trim().toLowerCase())
            .filter(Boolean)
    );
}

export function hasPreviewTestProAccess(
    user: EntitlementUser,
    environment: EntitlementEnvironment = process.env
): boolean {
    const isProduction = environment.VERCEL_ENV === "production" ||
        (!environment.VERCEL_ENV && environment.NODE_ENV === "production");

    if (isProduction) return false;

    const userIds = allowlistValues(environment.NODOQUANT_TEST_PRO_USER_IDS);
    if (userIds.has(user.id.trim().toLowerCase())) return true;

    if (!user.email) return false;
    const emails = allowlistValues(environment.NODOQUANT_TEST_PRO_EMAILS);
    return emails.has(user.email.trim().toLowerCase());
}

export function hasActiveLegacyProAccess(
    value: LegacySubscriptionRow | null | undefined,
    now: Date = new Date()
): boolean {
    if (!value || value.plan !== "pro") return false;
    if (value.status !== "active" && value.status !== "trialing") return false;
    if (value.current_period_end == null) return true;
    if (typeof value.current_period_end !== "string") return false;

    const periodEnd = new Date(value.current_period_end);
    return Number.isFinite(periodEnd.getTime()) && periodEnd > now;
}

export function resolveEntitlement({
    explicitTier,
    legacySubscription,
    now = new Date(),
}: {
    explicitTier?: EntitlementTier | null;
    legacySubscription?: LegacySubscriptionRow | null;
    now?: Date;
}): UserEntitlement {
    if (explicitTier) {
        return { tier: explicitTier, isPro: explicitTier === "pro", source: "explicit" };
    }

    if (hasActiveLegacyProAccess(legacySubscription, now)) {
        return { tier: "pro", isPro: true, source: "legacy_subscription" };
    }

    return { tier: "beta", isPro: false, source: "beta_default" };
}

/**
 * Single server-side entry point for authorization decisions.
 *
 * There is no persisted provider-independent entitlement table in production
 * yet. Until one is introduced, users receive beta access by default. The
 * subscriptions adapter is isolated and disabled by default. It may only be
 * enabled after the legacy table and its write policies have been audited.
 */
export async function getUserEntitlement(
    client: EntitlementDatabaseClient | null | undefined,
    authenticatedUser: string | EntitlementUser,
    options: {
        allowLegacySubscriptionFallback?: boolean;
        environment?: EntitlementEnvironment;
    } = {}
): Promise<UserEntitlement> {
    const user = typeof authenticatedUser === "string"
        ? { id: authenticatedUser }
        : authenticatedUser;

    if (hasPreviewTestProAccess(user, options.environment ?? process.env)) {
        return { tier: "pro", isPro: true, source: "explicit" };
    }

    if (!client || options.allowLegacySubscriptionFallback !== true) {
        return resolveEntitlement({});
    }

    const { data, error } = await client
        .from("subscriptions")
        .select("plan, status, current_period_end")
        .eq("user_id", user.id)
        .maybeSingle();

    return resolveEntitlement({
        legacySubscription: error ? null : data,
    });
}
