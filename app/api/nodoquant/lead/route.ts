import { NextRequest, NextResponse } from "next/server";
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

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseLeadBody(value: unknown): LeadBody | null {
    if (!isRecord(value)) return null;

    const { name, contact, market, strategy, link } = value;

    if (
        typeof name !== "string" ||
        typeof contact !== "string" ||
        typeof market !== "string" ||
        typeof strategy !== "string"
    ) {
        return null;
    }

    if (link !== undefined && typeof link !== "string") {
        return null;
    }

    return {
        name: name.trim(),
        contact: contact.trim(),
        market: market.trim(),
        strategy: strategy.trim(),
        link: link?.trim() || undefined,
    };
}

function isObjectArray(value: unknown): value is object[] {
    return Array.isArray(value) && value.every(
        (item) => typeof item === "object" && item !== null && !Array.isArray(item)
    );
}

export async function POST(req: NextRequest) {
    try {
        const body = parseLeadBody(await req.json());

        if (!body) {
            return NextResponse.json(
                { ok: false, error: "Formato de solicitud inválido" },
                { status: 400 }
            );
        }

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

            return NextResponse.json({ ok: true });
        }

        // Never use the local filesystem fallback in production.
        if (process.env.NODE_ENV === "production") {
            console.error(
                "[NodoQuant] Lead storage unavailable: Supabase admin client is not configured."
            );
            return NextResponse.json(
                { ok: false, error: "Servicio de registro no disponible" },
                { status: 500 }
            );
        }

        // Development fallback: save to leads-dev.json.
        const filePath = path.join(process.cwd(), "leads-dev.json");
        let existing: object[] = [];

        try {
            const raw = await readFile(filePath, "utf-8");
            const parsed: unknown = JSON.parse(raw);

            if (isObjectArray(parsed)) {
                existing = parsed;
            }
        } catch {
            // File doesn't exist yet or is invalid — start fresh.
        }

        existing.push({ ...lead, created_at: new Date().toISOString() });
        await writeFile(filePath, JSON.stringify(existing, null, 2), "utf-8");

        return NextResponse.json({ ok: true });
    } catch (err: unknown) {
        console.error("[NodoQuant] Lead route error:", err);
        return NextResponse.json(
            { ok: false, error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
