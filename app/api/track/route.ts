import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("API TRACK RECEIVED:", body);

    const supabase = getSupabaseAdmin();

    const { error } = await supabase.from("funnel_events").insert([
      {
        event_name: body.event_name,
        metadata: body.metadata || {},
      },
    ]);

    if (error) {
      console.error("SUPABASE INSERT ERROR:", error);
      return NextResponse.json({ ok: false, error: error.message });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("API track error:", e);
    return NextResponse.json({ ok: false });
  }
}
