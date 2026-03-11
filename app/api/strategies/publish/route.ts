import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/auth/server";
import { getSupabaseServer } from "@/lib/supabase";
import { generateUniqueSlug } from "@/lib/slugs";

export async function POST(req: NextRequest) {
    try {
        const authClient = createClient();
        const { data: { session } } = await authClient.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const {
            report_id,
            strategy_name,
            description,
            visibility, // 'public' | 'private' | 'unlisted'
            market,
            symbol,
            score,
            win_rate,
            profit_factor,
            expectancy,
            max_drawdown,
            trades_count
        } = body;

        if (!report_id || !strategy_name) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const supabase = getSupabaseServer();
        if (!supabase) {
            return NextResponse.json({ error: "Database not configured" }, { status: 500 });
        }

        // 1. Generate unique slug
        const finalSlug = await generateUniqueSlug(strategy_name, 'public_strategy_profiles');

        // 2. Determine Tier
        let tier = "Weak Edge";
        if (score >= 90) tier = "Elite";
        else if (score >= 75) tier = "Strong Edge";
        else if (score >= 60) tier = "Moderate Edge";

        // 3. Upsert into public_strategy_profiles
        const { data, error } = await supabase
            .from("public_strategy_profiles")
            .upsert({
                report_id,
                user_id: session.user.id,
                slug: finalSlug,
                strategy_name,
                description: description || null,
                visibility: visibility || 'public',
                market: market || "Unknown",
                symbol: symbol || "Unknown",
                score: score || 0,
                tier,
                win_rate: win_rate || 0,
                profit_factor: profit_factor || 0,
                expectancy: expectancy || 0,
                max_drawdown: max_drawdown || 0,
                trades_count: trades_count || 0,
                published_at: new Date().toISOString()
            }, { onConflict: 'report_id' })
            .select("slug")
            .single();

        if (error) {
            console.error("[Publish API] Error upserting:", error);
            return NextResponse.json({ error: "Failed to save strategy profile" }, { status: 500 });
        }

        // 4. Update the source report accessibility
        await supabase
            .from("trade_analysis")
            .update({ is_public: visibility !== 'private' })
            .eq("id", report_id);

        return NextResponse.json({ ok: true, slug: data.slug });

    } catch (err) {
        console.error("[Publish API] Unexpected error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
