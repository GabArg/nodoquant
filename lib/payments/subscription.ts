import { getSupabaseServer } from "../supabase";

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

interface UserPlanRow {
    plan_type: PlanType;
    trial_start: string | null;
    trial_end: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPlanType(value: unknown): value is PlanType {
    return value === "free" || value === "pro_trial" || value === "pro";
}

function normalizeNullableString(value: unknown): string | null {
    return typeof value === "string" ? value : null;
}

function parseUserPlanRow(value: unknown): UserPlanRow | null {
    if (!isRecord(value) || !isPlanType(value.plan_type)) {
        return null;
    }

    return {
        plan_type: value.plan_type,
        trial_start: normalizeNullableString(value.trial_start),
        trial_end: normalizeNullableString(value.trial_end),
    };
}

/**
 * Fetch user's plan from user_plans table
 */
export async function getUserPlanStatus(
    userId: string
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

    const { data } = await supabase
        .from("user_plans")
        .select("plan_type, trial_start, trial_end")
        .eq("user_id", userId)
        .single();

    const plan = parseUserPlanRow(data);

    if (!plan) return defaultStatus;

    const now = new Date();
    const trialEnd = plan.trial_end ? new Date(plan.trial_end) : null;

    let isTrialActive = false;
    let daysRemaining = 0;

    if (
        plan.plan_type === "pro_trial" &&
        trialEnd &&
        Number.isFinite(trialEnd.getTime())
    ) {
        isTrialActive = trialEnd > now;

        if (isTrialActive) {
            daysRemaining = Math.max(
                0,
                Math.ceil(
                    (trialEnd.getTime() - now.getTime()) /
                        (1000 * 60 * 60 * 24)
                )
            );
        }
    }

    const isPro =
        plan.plan_type === "pro" ||
        (plan.plan_type === "pro_trial" && isTrialActive);

    return {
        plan: plan.plan_type,
        trial_start: plan.trial_start,
        trial_end: plan.trial_end,
        isPro,
        isTrial: plan.plan_type === "pro_trial" && isTrialActive,
        trialDaysRemaining: daysRemaining,
    };
}

/**
 * Ensures a user has a trial entry if they are new.
 * Automatically enrolls them in a 30-day PRO trial.
 */
export async function ensureTrialEnrollment(
    userId: string
): Promise<boolean> {
    const supabase = getSupabaseServer();

    if (!supabase) return false;

    // Check if they already have a plan
    const { data: existing } = await supabase
        .from("user_plans")
        .select("user_id")
        .eq("user_id", userId)
        .single();

    if (existing) return true;

    // Create 30-day trial
    const now = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(now.getDate() + 30);

    const { error } = await supabase.from("user_plans").insert({
        user_id: userId,
        plan_type: "pro_trial",
        trial_start: now.toISOString(),
        trial_end: trialEnd.toISOString(),
    });

    if (error) {
        console.error("Error enrolling user in trial:", error);
        return false;
    }

    return true;
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
    userId: string
): Promise<UserSubscription> {
    const status = await getUserPlanStatus(userId);

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
