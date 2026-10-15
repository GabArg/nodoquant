import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/auth/server";
import { getSupabaseServer } from "@/lib/supabase";
import { generateUniqueSlug } from "@/lib/slugs";

const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

export async function POST(req: NextRequest) {
    try {
        const authClient = createClient();
        const { data: { user } } = await authClient.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const {
            report_id,
            strategy_name,
            description,
            visibility = "public", // 'public' | 'private' | 'unlisted'
            market,
            symbol,
            score,
            win_rate,
            profit_factor,
            expectancy,
            max_drawdown,
            trades_count
        } = body;

        if (!report_id || !SAFE_ID_REGEX.test(report_id) || !strategy_name) {
            return NextResponse.json({ error: "Missing or invalid required fields" }, { status: 400 });
        }

        const safeVisibility: "public" | "private" | "unlisted" =
            visibility === "private" || visibility === "unlisted" ? visibility : "public";

        const supabase = getSupabaseServer();
        if (!supabase) {
            return NextResponse.json({ error: "Database not configured" }, { status: 500 });
        }

        // 1. Verify ownership of the source report before any modification
        const { data: analysis, error: fetchError } = await supabase
            .from("trade_analysis")
            .select("id, user_id, is_public")
            .eq("id", report_id)
            .single();

        if (fetchError || !analysis) {
            return NextResponse.json({ error: "Reporte no encontrado" }, { status: 404 });
        }

        // Strict authorization: report must belong to the authenticated user.
        // Rejects reports belonging to other users or anonymous reports (user_id === null).
        if (!analysis.user_id || analysis.user_id !== user.id) {
            return NextResponse.json({ error: "No autorizado para publicar este reporte" }, { status: 403 });
        }

        // 2. Generate unique slug
        const finalSlug = await generateUniqueSlug(strategy_name, 'public_strategy_profiles');

        // 3. Determine Tier
        let tier = "Weak Edge";
        if (score >= 90) tier = "Elite";
        else if (score >= 75) tier = "Strong Edge";
        else if (score >= 60) tier = "Moderate Edge";

        // 4. Upsert into public_strategy_profiles
        const { data, error } = await supabase
            .from("public_strategy_profiles")
            .upsert({
                report_id,
                user_id: user.id,
                slug: finalSlug,
                strategy_name,
                description: description || null,
                visibility: safeVisibility,
                market: market || "Unknown",
                symbol: symbol || "Unknown",
                score: score != null && Number.isFinite(Number(score)) ? Number(score) : 0,
                tier,
                win_rate: win_rate != null && Number.isFinite(Number(win_rate)) ? Number(win_rate) : 0,
                profit_factor: profit_factor != null && Number.isFinite(Number(profit_factor)) ? Number(profit_factor) : null,
                expectancy: expectancy != null && Number.isFinite(Number(expectancy)) ? Number(expectancy) : 0,
                max_drawdown: max_drawdown != null && Number.isFinite(Number(max_drawdown)) ? Number(max_drawdown) : null,
                trades_count: trades_count != null && Number.isFinite(Number(trades_count)) ? Number(trades_count) : 0,
                published_at: new Date().toISOString()
            }, { onConflict: 'report_id' })
            .select("slug")
            .single();

        if (error) {
            console.error("[Publish API] Error upserting:", error);
            return NextResponse.json({ error: "Failed to save strategy profile" }, { status: 500 });
        }

        // 5. Update the source report accessibility (scoped strictly to owner)
        await supabase
            .from("trade_analysis")
            .update({ is_public: safeVisibility !== 'private' })
            .eq("id", report_id)
            .eq("user_id", user.id);

        return NextResponse.json({ ok: true, slug: data.slug });

    } catch (err) {
        console.error("[Publish API] Unexpected error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
