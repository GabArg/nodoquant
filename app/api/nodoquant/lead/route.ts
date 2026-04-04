import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { writeFile, readFile } from "fs/promises";
import path from "path";

interface LeadBody {
    name: string;
    contact: string;
    market: string;
    strategy: string;
    link?: string;
}

export async function POST(req: NextRequest) {
    try {
        const body: LeadBody = await req.json();
        const { name, contact, market, strategy, link } = body;

        // Basic validation
        if (!name || !contact || !market || !strategy) {
            return NextResponse.json(
                { ok: false, error: "Campos requeridos incompletos" },
                { status: 400 }
            );
        }

        const ip =
            req.headers.get("x-forwarded-for") ??
            req.headers.get("x-real-ip") ??
            "unknown";
        const userAgent = req.headers.get("user-agent") ?? "unknown";

        const lead = {
            name,
            contact,
            market,
            strategy_text: strategy,
            link: link ?? null,
            ip,
            user_agent: userAgent,
        };

        // Try Supabase first
        const supabaseAdmin = getSupabaseAdmin();
        if (supabaseAdmin) {
            const { error } = await supabaseAdmin.from("nodoquant_leads").insert(lead);
            if (error) {
                console.error("[NodoQuant] Supabase insert error:", error.message);
                return NextResponse.json(
                    { ok: false, error: "Error al guardar en base de datos" },
                    { status: 500 }
                );
            }
            // TODO telemetry: nodoquant_lead_submitted
            console.log("[NodoQuant] Event: nodoquant_lead_submitted (Supabase)", { market });
            return NextResponse.json({ ok: true });
        }

        // Fallback: save to leads-dev.json (dev only)
        console.warn(
            "[NodoQuant] TODO: Configure SUPABASE_SERVICE_ROLE_KEY for production. Saving to leads-dev.json (dev fallback)"
        );
        const filePath = path.join(process.cwd(), "leads-dev.json");
        let existing: object[] = [];
        try {
            const raw = await readFile(filePath, "utf-8");
            existing = JSON.parse(raw);
        } catch {
            // File doesn't exist yet — start fresh
        }

        existing.push({ ...lead, created_at: new Date().toISOString() });
        await writeFile(filePath, JSON.stringify(existing, null, 2), "utf-8");

        // TODO telemetry: nodoquant_lead_submitted
        console.log("[NodoQuant] Event: nodoquant_lead_submitted (local fallback)", { market });
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("[NodoQuant] Lead route error:", err);
        return NextResponse.json(
            { ok: false, error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
