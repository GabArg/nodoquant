import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { createClient } from "@/lib/auth/server";

export async function PUT(
    req: NextRequest,
    { params }: { params: { public_id: string } }
) {
    try {
        const authClient = createClient();
        const { data: { user } } = await authClient.auth.getUser();

        if (!user) {
            return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { notes } = body;

        const supabase = getSupabaseServer();
        if (!supabase) {
            return NextResponse.json({ ok: false, error: "DB not configured" }, { status: 500 });
        }

        const { public_id } = params;

        // Ensure user owns this report and update it
        const { data, error } = await supabase
            .from("trade_analysis")
            .update({ notes })
            .eq("public_id", public_id)
            .eq("user_id", user.id)
            .select("id")
            .single();

        if (error || !data) {
            console.error("[Notes Update Error]", error);
            return NextResponse.json({ ok: false, error: "Report not found or not permitted" }, { status: 403 });
        }

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        console.error("[Report Note Error]:", err);
        return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
    }
}
