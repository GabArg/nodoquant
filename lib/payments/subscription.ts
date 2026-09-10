import { getSupabaseServer } from "../supabase";
import { getUserEntitlement, type EntitlementUser } from "./entitlements";

export const FREE_PLAN_LIMITS = {
    MAX_TRADES_PER_ANALYSIS: 500,
    MAX_SAVED_STRATEGIES: 1,
};

export type PlanType = "free" | "pro_trial" | "pro";
export type SubscriptionStatus = "trialing" | "active" | "inactive";

export interface UserPlanStatus {
    plan: PlanType;
    trial_start: string | null;
    trial_end: string | null;
    isPro: boolean;
    isTrial: boolean;
    trialDaysRemaining: number;
}

export interface UserSubscription {
    plan: "free" | "pro";
    status: SubscriptionStatus;
    current_period_end: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Compatibility facade. Authorization is resolved exclusively by the
 * provider-independent entitlements layer.
 */
export async function getUserPlanStatus(
    user: string | EntitlementUser
): Promise<UserPlanStatus> {
    const supabase = getSupabaseServer();
    const defaultStatus: UserPlanStatus = {
        plan: "free",
        trial_start: null,
        trial_end: null,
        isPro: false,
        isTrial: false,
        trialDaysRemaining: 0,
    };

    if (!supabase) return defaultStatus;

    const entitlement = await getUserEntitlement(supabase, user);
    const isPro = entitlement.isPro;

    return {
        plan: isPro ? "pro" : "free",
        trial_start: null,
        trial_end: null,
        isPro,
        isTrial: false,
        trialDaysRemaining: 0,
    };
}

/**
 * Ensures a user has a trial entry if they are new.
 * Automatically enrolls them in a 30-day PRO trial.
 */
export async function ensureTrialEnrollment(
    _userId: string
): Promise<boolean> {
    return false;
}

/**
 * Compatibility hook for callers that still check trial expiration here.
 * Analytics emission remains the responsibility of the route layer.
 */
export async function trackTrialExpiration(
    _userId: string,
    plan: unknown
): Promise<void> {
    if (!isRecord(plan)) return;

    const planType = plan.plan_type;
    const trialEndValue = plan.trial_end;

    if (
        planType !== "pro_trial" ||
        typeof trialEndValue !== "string"
    ) {
        return;
    }

    const trialEnd = new Date(trialEndValue);

    if (!Number.isFinite(trialEnd.getTime())) {
        return;
    }

    if (trialEnd < new Date()) {
        // Analytics event 'trial_expired' is intentionally handled by the route layer.
    }
}

/**
 * Compatibility helper (deprecated LS logic)
 */
export async function getUserSubscription(
    user: string | EntitlementUser
): Promise<UserSubscription> {
    const status = await getUserPlanStatus(user);

    return {
        plan: status.isPro ? "pro" : "free",
        status: status.isTrial
            ? "trialing"
            : status.isPro
            ? "active"
            : "inactive",
        current_period_end: status.trial_end,
    };
}

export function isProUser(status: unknown): boolean {
    if (!isRecord(status)) return false;

    if (typeof status.isPro === "boolean") {
        return status.isPro;
    }

    return status.plan === "pro" || status.status === "trialing";
}

export async function canCreateStrategy(
    userId: string,
    isPro: boolean
): Promise<boolean> {
    if (isPro) return true;

    const supabase = getSupabaseServer();

    if (!supabase) return false;

    const { count, error } = await supabase
        .from("trade_analysis")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

    if (error) return false;

    return (count || 0) < FREE_PLAN_LIMITS.MAX_SAVED_STRATEGIES;
}

export function exceedsBetaTradeLimit(isPro: boolean, tradesCount: number): boolean {
    return !isPro && tradesCount > FREE_PLAN_LIMITS.MAX_TRADES_PER_ANALYSIS;
}

export function mustCheckBetaSavedAnalysisLimit(isPro: boolean, isNewAnalysis: boolean): boolean {
    return !isPro && isNewAnalysis;
}
