import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { createClient } from "@/lib/auth/server";

export async function GET(
    req: NextRequest,
    { params }: { params: { reportId: string } }
) {
    try {
        const { reportId } = params;
        if (!reportId) {
            return NextResponse.json({ ok: false, error: "ID de reporte requerido" }, { status: 400 });
        }

        const authClient = createClient();
        const { data: { session } } = await authClient.auth.getSession();
        const userId = session?.user?.id;

        const supabase = getSupabaseServer();
        if (!supabase) {
            // Fallback for local development if needed, but normally reportId points to DB
            return NextResponse.json({ ok: false, error: "Database not configured" }, { status: 500 });
        }

        const { data: report, error } = await supabase
            .from("trade_analysis")
            .select("*")
            .eq("id", reportId)
            .single();

        if (error || !report) {
            return NextResponse.json({ ok: false, error: "Reporte no encontrado" }, { status: 404 });
        }

        // Security check: Verify ownership if userId is present in report
        // If report has no userId, it might be a public/guest report (depending on app rules)
        // Given user's request: "Ensure the report API verifies that the requested report belongs to the authenticated user"
        if (report.user_id && report.user_id !== userId) {
            return NextResponse.json({ ok: false, error: "No tenés permiso para ver este reporte" }, { status: 403 });
        }

        return NextResponse.json(
            { ok: true, report },
            {
                headers: {
                    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
                },
            }
        );
    } catch (err) {
        console.error("[Report API] Error:", err);
        return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
    }
}
