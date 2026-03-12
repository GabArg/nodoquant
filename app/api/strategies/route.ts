import { NextResponse } from "next/server";
import { createClient } from "@/lib/auth/server";

function generateSlug(name: string, asset?: string | null, timeframe?: string | null): string {
    const parts = [name, asset, timeframe].filter(Boolean);
    const raw = parts.join("-");
    const base = raw
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    // Add a random suffix to avoid collisons
    const suffix = Math.random().toString(36).substring(2, 8);
    return `${base}-${suffix}`;
}

export async function GET() {
    try {
        const supabase = createClient();
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { data, error } = await supabase
            .from("strategies")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return NextResponse.json({ ok: true, strategies: data });
    } catch (err: any) {
        console.error("GET /api/strategies error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabase = createClient();
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        console.log("[API/Strategies] Auth result:", { userId: user?.id, userError });

        if (userError || !user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await req.json();
        console.log("[API/Strategies] POST body:", body);

        const { name, description, market, asset, timeframe, strategy_style, analysis_id } = body;

        if (!name || typeof name !== "string") {
            return NextResponse.json({ error: "Falta el nombre de la estrategia" }, { status: 400 });
        }

        const slug = generateSlug(name.trim(), asset ? asset.trim() : null, timeframe || null);

        const { data: strategy, error: stratError } = await supabase
            .from("strategies")
            .insert({
                user_id: user.id,
                name: name.trim(),
                description: description ? description.trim() : null,
                market: market || null,
                asset: asset ? asset.trim() : null,
                timeframe: timeframe || null,
                strategy_style: strategy_style || null,
                slug: slug,
            })
            .select()
            .single();

        console.log("[API/Strategies] DB insert result:", { strategy, stratError });

        if (stratError) {
            if (stratError.code === '23505') {
                return NextResponse.json({ error: "Ya existe una estrategia con ese nombre." }, { status: 400 });
            }
            throw stratError;
        }

        // Link to analysis if provided
        if (analysis_id && strategy) {
            const { error: linkError } = await supabase
                .from("trade_analysis")
                .update({ strategy_id: strategy.id })
                .eq("id", analysis_id)
                .eq("user_id", user.id); // Security: ensure user owns the analysis
            
            if (linkError) {
                console.error("[API/Strategies] Error linking analysis:", linkError);
                // We don't fail the whole request because the strategy WAS created
            }
        }

        return NextResponse.json({ ok: true, strategy: strategy });
    } catch (err: any) {
        console.error("POST /api/strategies error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
