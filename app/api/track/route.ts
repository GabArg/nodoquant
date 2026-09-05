import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

interface TrackEventBody {
    event_name: string;
    metadata: Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseTrackEventBody(value: unknown): TrackEventBody | null {
    if (!isRecord(value)) return null;

    const eventName = value.event_name;
    const metadata = value.metadata;

    if (typeof eventName !== "string" || !eventName.trim()) {
        return null;
    }

    if (metadata !== undefined && !isRecord(metadata)) {
        return null;
    }

    return {
        event_name: eventName.trim(),
        metadata: metadata ?? {},
    };
}

export async function POST(req: Request) {
    try {
        const body = parseTrackEventBody(await req.json());

        if (!body) {
            return NextResponse.json(
                { ok: false, error: "Invalid event payload" },
                { status: 400 }
            );
        }

        const supabase = getSupabaseAdmin();

        const { error } = await supabase.from("funnel_events").insert([
            {
                event_name: body.event_name,
                metadata: body.metadata,
            },
        ]);

        if (error) {
            console.error("[API /track] Supabase insert error:", error);
            return NextResponse.json(
                { ok: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ ok: true });
    } catch (error: unknown) {
        console.error("[API /track] Unexpected error:", error);
        return NextResponse.json(
            { ok: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
