import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { createClient } from "@/lib/auth/server";
import { writeFile, readFile } from "fs/promises";
import path from "path";
import { getUserSubscription, isProUser, canCreateStrategy, FREE_PLAN_LIMITS } from "@/lib/payments/subscription";

export interface SaveAnalysisBody {
    trades_count: number;
    winrate: number;
    profit_factor: number;
    max_drawdown: number;
    metrics_json: object;
    user_email?: string;
    file_name?: string;
    date_range_start?: string; // ISO string
    date_range_end?: string; // ISO string
    sum_profit?: number;
    project_id?: string;
    strategy_id?: string;
    dataset_name?: string;
    user_id?: string;
}

export async function POST(req: NextRequest) {
    try {
        const body: SaveAnalysisBody = await req.json();
        const {
            trades_count,
            winrate,
            profit_factor,
            max_drawdown,
            metrics_json,
            user_email,
            file_name,
            date_range_start,
            date_range_end,
            sum_profit,
            project_id,
            strategy_id,
            dataset_name
        } = body;

        if (
            typeof trades_count !== "number" ||
            typeof winrate !== "number" ||
            typeof profit_factor !== "number" ||
            typeof max_drawdown !== "number"
        ) {
            return NextResponse.json(
                { ok: false, error: "Métricas requeridas incompletas" },
                { status: 400 }
            );
        }

        // Check active session to auto-attach if logged in
        const authClient = createClient();
        const { data: { session } } = await authClient.auth.getSession();

        // Priority: Session > Body (Body used primarily for testing/simulations)
        const user_id = session?.user?.id ?? body.user_id ?? null;

        let isPro = false;
        if (user_id) {
            const sub = await getUserSubscription(user_id);
            isPro = isProUser(sub);
        }

        // Limit Check 1: Max Trades
        if (!isPro && trades_count > FREE_PLAN_LIMITS.MAX_TRADES_PER_ANALYSIS) {
            return NextResponse.json(
                { ok: false, error: "Límite del plan superado", reason: `El plan gratuito permite hasta ${FREE_PLAN_LIMITS.MAX_TRADES_PER_ANALYSIS} transacciones por análisis. Actualizá a Pro para analizar sin límites.` },
                { status: 403 }
            );
        }

        // Limit Check 2: Max Saved Strategies
        if (user_id) {
            const canSave = await canCreateStrategy(user_id, isPro);
            if (!canSave) {
                return NextResponse.json(
                    { ok: false, error: "Límite del plan superado", reason: `El plan gratuito permite hasta ${FREE_PLAN_LIMITS.MAX_SAVED_STRATEGIES} análisis guardado. Actualizá a Pro para guardar análisis ilimitados.` },
                    { status: 403 }
                );
            }
        }

        const record = {
            trades_count,
            winrate,
            profit_factor,
            max_drawdown,
            metrics_json: metrics_json ?? {},
            user_email: user_email ?? session?.user?.email ?? null,
            file_name: file_name ?? null,
            date_range_start: date_range_start ?? null,
            date_range_end: date_range_end ?? null,
            sum_profit: sum_profit ?? null,
            user_id,
            project_id: project_id ?? null,
            strategy_id: strategy_id ?? null,
            dataset_name: dataset_name ?? 'Dataset',
        };

        // Try Supabase first
        const supabase = getSupabaseServer();
        if (supabase) {
            const { data, error } = await supabase
                .from("trade_analysis")
                .insert(record)
                .select("id")
                .single();

            if (error) {
                console.error("[Analyzer] Supabase insert error:", error.message);
                return NextResponse.json(
                    { ok: false, error: "Error al guardar análisis" },
                    { status: 500 }
                );
            }
            console.log("[Analyzer] Event: analysis_saved (Supabase)", {
                id: data?.id,
                trades_count,
            });
            return NextResponse.json({ ok: true, id: data?.id ?? null });
        }

        // Fallback: local JSON file
        console.warn(
            "[Analyzer] Supabase not configured — saving to analysis-dev.json (dev fallback)"
        );
        const filePath = path.join(process.cwd(), "analysis-dev.json");
        let existing: object[] = [];
        try {
            const raw = await readFile(filePath, "utf-8");
            existing = JSON.parse(raw);
        } catch {
            // file doesn't exist yet
        }

        const id = crypto.randomUUID();
        existing.push({ id, created_at: new Date().toISOString(), ...record });
        await writeFile(filePath, JSON.stringify(existing, null, 2), "utf-8");

        console.log("[Analyzer] Event: analysis_saved (local fallback)", {
            id,
            trades_count,
        });
        return NextResponse.json({ ok: true, id });
    } catch (err) {
        console.error("[Analyzer] Save route error:", err);
        return NextResponse.json(
            { ok: false, error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
