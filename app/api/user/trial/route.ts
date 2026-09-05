import { NextResponse } from "next/server";
import { createClient } from "@/lib/auth/server";
import { getUserPlanStatus, ensureTrialEnrollment } from "@/lib/payments/subscription";
import { trackEvent } from "@/lib/analytics";

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Internal error";
}

export async function POST() {
    try {
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        // 1. Trigger the logic to ensure they have a trial (sets plan_type, trial_start, trial_end)
        const enrolled = await ensureTrialEnrollment(user.id);

        // 2. Refresh the actual DB plan status to confirm
        const fullStatus = await getUserPlanStatus(user.id);

        if (enrolled) {
            // Fire tracking event if they were just enrolled
            await trackEvent("trial_started", { userId: user.id }, user.id);
        }

        return NextResponse.json({
            ok: true,
            plan: fullStatus.plan,
            isPro: fullStatus.isPro,
            trialDaysRemaining: fullStatus.trialDaysRemaining,
            enrolledJustNow: enrolled,
        });
    } catch (err: unknown) {
        console.error("[API /trial] Error activating trial:", err);
        return NextResponse.json(
            { ok: false, error: getErrorMessage(err) },
            { status: 500 }
        );
    }
}
