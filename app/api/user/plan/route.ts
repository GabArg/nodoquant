import { NextResponse } from "next/server";
import { createClient } from "@/lib/auth/server";
import { getUserSubscription, isProUser, getUserPlanStatus } from "@/lib/payments/subscription";
import { trackEvent } from "@/lib/analytics";

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Internal error";
}

export async function GET() {
    try {
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ plan: "free", isPro: false });
        }

        const sub = await getUserSubscription(user.id);
        const fullStatus = await getUserPlanStatus(user.id);
        const isPro = isProUser(sub);

        // Track trial expiration if it just happened
        if (fullStatus.plan === "pro_trial" && !fullStatus.isTrial) {
            await trackEvent("trial_expired", { userId: user.id }, user.id);
        }

        return NextResponse.json({
            ok: true,
            plan: sub?.plan ?? "free",
            isPro: isPro,
            trialDaysRemaining: fullStatus.trialDaysRemaining
        });
    } catch (err: unknown) {
        return NextResponse.json({
            plan: "free",
            isPro: false,
            error: getErrorMessage(err),
        });
    }
}
