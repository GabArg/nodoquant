import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Minimum viable in-memory rate limiting. 
const rateLimitCache = new Map<string, { count: number; expiresAt: number }>();

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour sliding window
    const maxRequests = 5;

    let record = rateLimitCache.get(ip);
    if (!record || record.expiresAt < now) {
        record = { count: 0, expiresAt: now + windowMs };
    }
    
    if (record.count >= maxRequests) {
        return false;
    }

    record.count += 1;
    rateLimitCache.set(ip, record);
    return true;
}

function isValidFiniteNumber(val: any): boolean {
    return typeof val === 'number' && Number.isFinite(val);
}

export async function POST(req: NextRequest) {
    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "127.0.0.1";

    try {
        if (!checkRateLimit(ip)) {
            console.warn(`[Analyzer Anonymous] Rate limit exceeded for IP: ${ip}`);
            return NextResponse.json(
                { ok: false, error: "Demasiados intentos. Intente más tarde." }, 
                { status: 429 }
            );
        }

        // --- CAPTCHA Placeholder ---
        // const turnstileToken = req.headers.get("x-turnstile-token");
        // if (!turnstileToken) ...

        const body = await req.json();
        const { trades_count, winrate, profit_factor, max_drawdown, metrics_json, file_name, date_range_start, date_range_end } = body;

        // --- Numeric Validation ---
        if (!isValidFiniteNumber(trades_count) || !isValidFiniteNumber(winrate) || 
            !isValidFiniteNumber(profit_factor) || !isValidFiniteNumber(max_drawdown)) {
            console.warn(`[Analyzer Anonymous] Rejected: Invalid non-finite numeric types from IP: ${ip}`);
            return NextResponse.json({ ok: false, error: "Datos numéricos inválidos" }, { status: 400 });
        }

        if (trades_count <= 0 || trades_count > 1000) {
            console.warn(`[Analyzer Anonymous] Rejected: trades_count out of bounds (${trades_count}) from IP: ${ip}`);
            return NextResponse.json({ ok: false, error: "Cantidad de trades fuera de límite (1-1000)" }, { status: 400 });
        }

        if (winrate < 0 || winrate > 100) {
            console.warn(`[Analyzer Anonymous] Rejected: winrate out of bounds (${winrate}) from IP: ${ip}`);
            return NextResponse.json({ ok: false, error: "Winrate fuera de límite (0-100)" }, { status: 400 });
        }

        if (profit_factor < 0 || max_drawdown < 0) {
            console.warn(`[Analyzer Anonymous] Rejected: Negative metrics from IP: ${ip}`);
            return NextResponse.json({ ok: false, error: "Métricas negativas inválidas" }, { status: 400 });
        }

        // --- JSON Size Protection ---
        let safeMetricsJson = {};
        if (metrics_json && typeof metrics_json === 'object') {
            try {
                const stringified = JSON.stringify(metrics_json);
                console.log("[Analyzer Payload Size]", stringified.length);
                if (stringified.length > 51200) { // 50KB
                    console.warn(`[Analyzer Anonymous] Rejected: metrics_json too large (${stringified.length} bytes) from IP: ${ip}`);
                    return NextResponse.json({ ok: false, error: "El objeto de métricas excede el tamaño máximo permitido." }, { status: 400 });
                }
                safeMetricsJson = JSON.parse(stringified);
            } catch (err) {
                console.warn(`[Analyzer Anonymous] Rejected: Malformed metrics_json from IP: ${ip}`);
                return NextResponse.json({ ok: false, error: "Estructura JSON inválida" }, { status: 400 });
            }
        }

        const supabaseAdmin = getSupabaseAdmin();

        // --- Database Insert ---
        const record = {
            trades_count,
            winrate,
            profit_factor,
            max_drawdown,
            metrics_json: safeMetricsJson,
            user_email: null,
            file_name: file_name ? String(file_name).slice(0, 100) : null,
            date_range_start: date_range_start ?? null,
            date_range_end: date_range_end ?? null,
            user_id: null,
            is_public: false, 
        };

        const { data, error } = await supabaseAdmin
            .from("trade_analysis")
            .insert(record)
            .select("id")
            .single();

        if (error) {
            console.error("[Analyzer Anonymous] Database insert error:", error.message);
            return NextResponse.json({ ok: false, error: "Error de guardado en la base de datos" }, { status: 500 });
        }

        console.log(`[Analyzer Anonymous] Success: Saved anonymous analysis ${data.id} from IP: ${ip}`);
        return NextResponse.json({ ok: true, id: data.id });

    } catch (err) {
        console.error(`[Analyzer Anonymous] Unexpected server error from IP: ${ip}`, err);
        return NextResponse.json({ ok: false, error: "Error interno del servidor" }, { status: 500 });
    }
}
