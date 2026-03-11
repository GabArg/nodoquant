import { NextResponse } from "next/server";
import { createClient } from "@/lib/auth/server";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("strategies")
            .select("*")
            .eq("id", params.id)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ ok: true, strategy: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { market, asset, timeframe, strategy_style } = body;

        const { data, error } = await supabase
            .from("strategies")
            .update({
                market: market !== undefined ? market : undefined,
                asset: asset !== undefined ? asset : undefined,
                timeframe: timeframe !== undefined ? timeframe : undefined,
                strategy_style: strategy_style !== undefined ? strategy_style : undefined,
            })
            .eq("id", params.id)
            .eq("user_id", user.id) // Ensure user owns it
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ ok: true, strategy: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
