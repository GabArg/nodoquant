import { getSupabaseServer } from "../supabase";

export type PlanType = "free" | "pro";

// Free Tier limits
export const FREE_PLAN_LIMITS = {
    MAX_TRADES_PER_ANALYSIS: 500,
    MAX_SAVED_STRATEGIES: 1,
};

export interface UserSubscription {
    plan: PlanType;
    status: string;
    current_period_end: string | null;
    lemonsqueezy_subscription_id: string | null;
}

/**
 * Fetch user's plan from user_profiles (updated by LS webhook)
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const supabase = getSupabaseServer();
    if (!supabase) return null;

    // First try the subscriptions table for full details
    const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan, status, current_period_end, lemonsqueezy_subscription_id")
        .eq("user_id", userId)
        .single();

    if (sub) {
        return sub as UserSubscription;
    }

    // Fall back to user_profiles.plan
    const { data: profile } = await supabase
        .from("user_profiles")
        .select("plan")
        .eq("id", userId)
        .single();

    return {
        plan: (profile?.plan as PlanType) ?? "free",
        status: "unknown",
        current_period_end: null,
        lemonsqueezy_subscription_id: null,
    };
}

/**
 * Returns true if user has an active Pro subscription
 */
export function isProUser(subscription: UserSubscription | null): boolean {
    if (!subscription) return false;

    // Check if plan is pro and status is valid
    const isValidStatus = subscription.plan === "pro" &&
        (subscription.status === "active" || subscription.status === "trialing" || subscription.status === "unknown");

    if (!isValidStatus) return false;

    // Safety check: if we have an expiry date and it's in the past, return false
    if (subscription.current_period_end) {
        const expiry = new Date(subscription.current_period_end);
        if (expiry < new Date()) {
            return false;
        }
    }

    return true;
}

/**
 * Check if a free user can create another strategy record
 */
export async function canCreateStrategy(userId: string, isPro: boolean): Promise<boolean> {
    if (isPro) return true;

    const supabase = getSupabaseServer();
    if (!supabase) return false;

    const { count, error } = await supabase
        .from("trade_analysis")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

    if (error) {
        console.error("Error counting user strategies:", error);
        return false;
    }

    return (count || 0) < FREE_PLAN_LIMITS.MAX_SAVED_STRATEGIES;
}
