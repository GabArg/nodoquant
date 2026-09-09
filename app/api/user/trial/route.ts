import { NextResponse } from "next/server";
export async function POST() {
    return NextResponse.json(
        { ok: false, error: "Automatic trials are disabled during the public beta." },
        { status: 410 }
    );
}
