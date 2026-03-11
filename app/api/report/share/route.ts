import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/auth/server";
import { getSupabaseServer } from "@/lib/supabase";

function generatePublicId(length = 10): string {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    const arr = new Uint8Array(length);
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => chars[b % chars.length]).join("");
}

export async function POST(req: NextRequest) {
    try {
        const authClient = createClient();
        const { data: { user }, error: userError } = await authClient.auth.getUser();
        if (userError || !user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await req.json();
        const { analysis_id, show_strategy_name, show_dataset_name } = body;

        if (!analysis_id) {
            return NextResponse.json({ error: "Falta analysis_id" }, { status: 400 });
        }

        const supabase = getSupabaseServer();
        if (!supabase) {
            return NextResponse.json({ error: "DB no configurada" }, { status: 500 });
        }

        // Verify ownership
        const { data: analysis, error: fetchError } = await supabase
            .from("trade_analysis")
            .select("id, user_id, public_id")
            .eq("id", analysis_id)
            .single();

        if (fetchError || !analysis) {
            return NextResponse.json({ error: "Análisis no encontrado" }, { status: 404 });
        }

        if (analysis.user_id !== user.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        // Generate public_id if not already set
        const publicId = analysis.public_id || generatePublicId(10);

        const { error: updateError } = await supabase
            .from("trade_analysis")
            .update({
                public_id: publicId,
                is_public: true,
                show_strategy_name: show_strategy_name ?? false,
                show_dataset_name: show_dataset_name ?? false,
            })
            .eq("id", analysis_id);

        if (updateError) {
            console.error("[Report] Share error:", updateError.message);
            return NextResponse.json({ error: "Error al compartir" }, { status: 500 });
        }

        const baseUrl = req.headers.get("origin") || req.headers.get("host") || "";
        const publicUrl = `${baseUrl}/report/${publicId}`;

        return NextResponse.json({ ok: true, public_url: publicUrl, public_id: publicId });
    } catch (err: any) {
        console.error("[Report] Share route error:", err);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
