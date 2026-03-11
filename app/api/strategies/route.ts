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

        if (userError || !user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await req.json();
        const { name, description, market, asset, timeframe, strategy_style } = body;

        if (!name || typeof name !== "string") {
            return NextResponse.json({ error: "Falta el nombre de la estrategia" }, { status: 400 });
        }

        const slug = generateSlug(name.trim(), asset ? asset.trim() : null, timeframe || null);

        const { data, error } = await supabase
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

        // Check if it's a unique constraint violation error code from Postgres (23505)
        if (error) {
            if (error.code === '23505') {
                return NextResponse.json({ error: "Ya existe una estrategia con ese nombre." }, { status: 400 });
            }
            throw error;
        }

        return NextResponse.json({ ok: true, strategy: data });
    } catch (err: any) {
        console.error("POST /api/strategies error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
