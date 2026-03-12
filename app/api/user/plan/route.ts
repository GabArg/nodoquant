import { NextResponse } from "next/server";
import { createClient } from "@/lib/auth/server";
import { getUserSubscription, isProUser } from "@/lib/payments/subscription";

export async function GET() {
    try {
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ plan: "free", isPro: false });
        }

        const sub = await getUserSubscription(user.id);
        const isPro = isProUser(sub);

        return NextResponse.json({
            ok: true,
            plan: sub?.plan ?? "free",
            isPro: isPro
        });
    } catch (err: any) {
        return NextResponse.json({ plan: "free", isPro: false, error: err.message });
    }
}
