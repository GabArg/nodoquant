import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

/**
 * GET /api/analyzer/stats
 * Returns aggregate counters for the platform.
 * Falls back to mock values if Supabase is not configured.
 */
export async function GET() {
    const supabaseAdmin = getSupabaseAdmin();

    if (supabaseAdmin) {
        try {
            const { count: analysisCount, error: e1 } = await supabaseAdmin
                .from("trade_analysis")
                .select("*", { count: "exact", head: true });

            const { count: leadsCount, error: e2 } = await supabaseAdmin
                .from("nodoquant_leads")
                .select("*", { count: "exact", head: true });

            if (e1 || e2) {
                console.warn("[Stats] Supabase count error:", e1?.message ?? e2?.message);
                return NextResponse.json(getMockStats());
            }

            return NextResponse.json({
                analysisCount: analysisCount ?? 0,
                leadsCount: leadsCount ?? 0,
                backtests: analysisCount ?? 0,
                automationProjects: leadsCount ?? 0,
                forwardTests: Math.floor((analysisCount ?? 0) / 3),
            });
        } catch {
            return NextResponse.json(getMockStats());
        }
    }

    // No Supabase — return mock values for development
    return NextResponse.json(getMockStats());
}

function getMockStats() {
    return {
        analysisCount: 0,
        leadsCount: 0,
        backtests: 0,
        automationProjects: 0,
        forwardTests: 0,
    };
}
