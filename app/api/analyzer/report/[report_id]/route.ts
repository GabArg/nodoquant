import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { createClient } from "@/lib/auth/server";
import { canAccessReport, applyReportIdentifierFilter } from "@/lib/auth/reportAccess";

const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

export async function GET(
    req: NextRequest,
    { params }: { params: { report_id: string } }
) {
    try {
        const { report_id } = params;
        if (!report_id || !SAFE_ID_REGEX.test(report_id)) {
            return NextResponse.json({ ok: false, error: "Reporte no encontrado" }, { status: 404 });
        }

        const authClient = createClient();
        const { data: { user } } = await authClient.auth.getUser();
        const userId = user?.id;

        const supabase = getSupabaseServer();
        if (!supabase) {
            return NextResponse.json({ ok: false, error: "Database not configured" }, { status: 500 });
        }

        const baseQuery = supabase
            .from("trade_analysis")
            .select("*");

        const { data: report, error } = await applyReportIdentifierFilter(baseQuery, report_id).single();

        if (error) {
            if (error.code !== "PGRST116") {
                console.error("[Report API] Query error:", error.code, error.message);
            }
            return NextResponse.json({ ok: false, error: "Reporte no encontrado" }, { status: 404 });
        }

        if (!report) {
            return NextResponse.json({ ok: false, error: "Reporte no encontrado" }, { status: 404 });
        }

        // Authorization check: public reports can be viewed by anyone,
        // private reports are only accessible by their owner.
        if (!canAccessReport(report, userId)) {
            return NextResponse.json({ ok: false, error: "Reporte no encontrado" }, { status: 404 });
        }

        const cacheControl = report.is_public
            ? "public, s-maxage=3600, stale-while-revalidate=86400"
            : "private, no-cache, no-store, must-revalidate";

        return NextResponse.json(
            { ok: true, report },
            {
                headers: {
                    "Cache-Control": cacheControl,
                },
            }
        );
    } catch (err) {
        console.error("[Report API] Error:", err);
        return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
    }
}
