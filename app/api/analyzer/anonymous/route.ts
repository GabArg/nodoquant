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

function isValidFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
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

        // --- Numeric Validation (allows null for PF/DD, strictly validates finite bounds) ---
        const isPFValid =
            profit_factor === null ||
            (isValidFiniteNumber(profit_factor) && profit_factor >= 0);
        const isDDValid =
            max_drawdown === null ||
            (isValidFiniteNumber(max_drawdown) && max_drawdown >= 0);

        if (
            !isValidFiniteNumber(trades_count) ||
            !Number.isInteger(trades_count) ||
            !isValidFiniteNumber(winrate) ||
            !isPFValid ||
            !isDDValid
        ) {
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

        // --- JSON Size Protection ---
        let safeMetricsJson = {};
        if (metrics_json && typeof metrics_json === "object") {
            try {
                const stringified = JSON.stringify(metrics_json);
                if (stringified.length > 51200) { // 50KB
                    console.warn(`[Analyzer Anonymous] Rejected: metrics_json too large (${stringified.length} bytes) from IP: ${ip}`);
                    return NextResponse.json({ ok: false, error: "El objeto de métricas excede el tamaño máximo permitido." }, { status: 400 });
                }
                safeMetricsJson = JSON.parse(stringified);
            } catch {
                console.warn(`[Analyzer Anonymous] Rejected: Malformed metrics_json from IP: ${ip}`);
                return NextResponse.json({ ok: false, error: "Estructura JSON inválida" }, { status: 400 });
            }
        }

        const isInfinite = Boolean(
            body.profitFactorInfinite ||
            (safeMetricsJson as any).profitFactorInfinite ||
            (safeMetricsJson as any).basic?.profitFactorInfinite
        );
        if (isInfinite) {
            (safeMetricsJson as any).profitFactorInfinite = true;
            if ((safeMetricsJson as any).basic && typeof (safeMetricsJson as any).basic === "object") {
                (safeMetricsJson as any).basic.profitFactorInfinite = true;
            }
        }
        const effectiveInitialCapital =
            body.initial_capital !== undefined
                ? body.initial_capital
                : (safeMetricsJson as any).initial_capital !== undefined
                ? (safeMetricsJson as any).initial_capital
                : (safeMetricsJson as any).basic?.initialCapital !== undefined
                ? (safeMetricsJson as any).basic.initialCapital
                : null;

        const effectiveCurrency =
            typeof body.account_currency === "string" && body.account_currency.trim().length > 0
                ? body.account_currency.trim().slice(0, 10).toUpperCase()
                : typeof (safeMetricsJson as any).account_currency === "string" && (safeMetricsJson as any).account_currency.trim().length > 0
                ? (safeMetricsJson as any).account_currency.trim().slice(0, 10).toUpperCase()
                : null;

        (safeMetricsJson as any).schema_version = "2.0";
        (safeMetricsJson as any).methodology_version = "v2-contract";
        (safeMetricsJson as any).initial_capital = effectiveInitialCapital;
        (safeMetricsJson as any).account_currency = effectiveCurrency;
        (safeMetricsJson as any).metadata = {
            schema_version: "2.0",
            methodology_version: "v2-contract",
            initial_capital: effectiveInitialCapital,
            account_currency: effectiveCurrency,
        };

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

        return NextResponse.json({ ok: true, id: data.id });

    } catch (err) {
        console.error(`[Analyzer Anonymous] Unexpected server error from IP: ${ip}`, err);
        return NextResponse.json({ ok: false, error: "Error interno del servidor" }, { status: 500 });
    }
}
