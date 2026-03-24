import { getSupabaseServer } from "../supabase";

export const FREE_PLAN_LIMITS = {
    MAX_TRADES_PER_ANALYSIS: 500,
    MAX_SAVED_STRATEGIES: 1,
};

export type PlanType = "free" | "pro_trial" | "pro";

export interface UserPlanStatus {
    plan: PlanType;
    trial_start: string | null;
    trial_end: string | null;
    isPro: boolean;
    isTrial: boolean;
    trialDaysRemaining: number;
}

/**
 * Fetch user's plan from user_plans table
 */
export async function getUserPlanStatus(userId: string): Promise<UserPlanStatus> {
    const supabase = getSupabaseServer();
    const defaultStatus: UserPlanStatus = {
        plan: "free",
        trial_start: null,
        trial_end: null,
        isPro: false,
        isTrial: false,
        trialDaysRemaining: 0
    };

    if (!supabase) return defaultStatus;

    const { data: plan } = await supabase
        .from("user_plans")
        .select("*")
        .eq("user_id", userId)
        .single();

    if (!plan) return defaultStatus;

    const now = new Date();
    const trialEnd = plan.trial_end ? new Date(plan.trial_end) : null;
    
    let isTrialActive = false;
    let daysRemaining = 0;

    if (plan.plan_type === "pro_trial" && trialEnd) {
        isTrialActive = trialEnd > now;
        if (isTrialActive) {
            daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        }
    }

    const isPro = plan.plan_type === "pro" || (plan.plan_type === "pro_trial" && isTrialActive);

    return {
        plan: plan.plan_type as PlanType,
        trial_start: plan.trial_start,
        trial_end: plan.trial_end,
        isPro,
        isTrial: plan.plan_type === "pro_trial" && isTrialActive,
        trialDaysRemaining: daysRemaining
    };
}

/**
 * Ensures a user has a trial entry if they are new.
 * Automatically enrolls them in a 30-day PRO trial.
 */
export async function ensureTrialEnrollment(userId: string): Promise<boolean> {
    const supabase = getSupabaseServer();
    if (!supabase) return false;

    // Check if they already have a plan
    const { data: existing } = await supabase
        .from("user_plans")
        .select("*")
        .eq("user_id", userId)
        .single();

    if (existing) return true;

    // Create 30-day trial
    const now = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(now.getDate() + 30);

    const { error } = await supabase
        .from("user_plans")
        .insert({
            user_id: userId,
            plan_type: 'pro_trial',
            trial_start: now.toISOString(),
            trial_end: trialEnd.toISOString()
        });

    if (error) {
        console.error("Error enrolling user in trial:", error);
        return false;
    }

    // Since trackEvent usually needs to be imported or handled, we assume we want to track this.
    // However, subscription.ts is a low-level lib, maybe we track in the route?
    return true;
}

/**
 * Tracks trial expiration when a user fetches their plan and it's found to be expired.
 */
export async function trackTrialExpiration(userId: string, plan: any) {
    if (plan.plan_type !== 'pro_trial' || !plan.trial_end) return;
    
    const now = new Date();
    const trialEnd = new Date(plan.trial_end);
    
    if (trialEnd < now) {
        // This is where we would fire the analytics event 'trial_expired'
        // We can do this in the route handler to avoid circular deps if any
    }
}

/**
 * Compatibility helper (deprecated LS logic)
 */
export async function getUserSubscription(userId: string) {
    const status = await getUserPlanStatus(userId);
    return {
        plan: status.isPro ? "pro" : "free",
        status: status.isTrial ? "trialing" : (status.isPro ? "active" : "inactive"),
        current_period_end: status.trial_end,
    };
}

export function isProUser(status: any): boolean {
    if (!status) return false;
    // Handle both old and new shapes for compatibility during migration
    if ('isPro' in status) return status.isPro;
    return status.plan === "pro" || status.status === "trialing";
}

export async function canCreateStrategy(userId: string, isPro: boolean): Promise<boolean> {
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
