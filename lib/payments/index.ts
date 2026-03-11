import { getUserSubscription, isProUser } from "@/lib/payments/subscription";

export type PlanType = "free" | "pro";

export const FREE_PLAN_LIMITS = {
    MAX_TRADES_PER_ANALYSIS: 500,
    MAX_SAVED_STRATEGIES: 1,
};

export { getUserSubscription, isProUser };
export type { UserSubscription } from "@/lib/payments/subscription";
