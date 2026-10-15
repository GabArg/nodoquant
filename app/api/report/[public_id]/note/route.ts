import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { createClient } from "@/lib/auth/server";
import { applyReportIdentifierFilter } from "@/lib/auth/reportAccess";

const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

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

        if (!public_id || !SAFE_ID_REGEX.test(public_id)) {
            return NextResponse.json({ ok: false, error: "Invalid report identifier" }, { status: 400 });
        }

        // Ensure user owns this report and update it
        let updateQuery = supabase
            .from("trade_analysis")
            .update({ notes });

        updateQuery = applyReportIdentifierFilter(updateQuery, public_id);

        const { data, error } = await updateQuery
            .eq("user_id", user.id)
            .select("id")
            .single();

        if (error || !data) {
            console.error("[Notes Update Error]", error);
            return NextResponse.json({ ok: false, error: "Report not found or not permitted" }, { status: 403 });
        }

        return NextResponse.json({ ok: true });
    } catch (err: unknown) {
        console.error("[Report Note Error]:", err);
        return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
    }
}
