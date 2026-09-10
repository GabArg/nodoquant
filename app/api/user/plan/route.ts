import { NextResponse } from "next/server";
import { createClient } from "@/lib/auth/server";
import { getSupabaseServer } from "@/lib/supabase";
import { getUserEntitlement } from "@/lib/payments/entitlements";

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

        const entitlement = await getUserEntitlement(getSupabaseServer(), {
            id: user.id,
            email: user.email,
        });

        return NextResponse.json({
            ok: true,
            plan: entitlement.tier,
            isPro: entitlement.isPro,
            source: entitlement.source,
            trialDaysRemaining: 0
        });
    } catch (err: unknown) {
        return NextResponse.json({
            plan: "free",
            isPro: false,
            error: getErrorMessage(err),
        });
    }
}
