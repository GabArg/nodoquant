import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { createClient } from "@/lib/auth/server";
import { getUserSubscription, isProUser } from "@/lib/payments/subscription";

export const dynamic = "force-dynamic";

interface StrategySummary {
    name: string | null;
    category: string | null;
}

type MetricsRecord = Record<string, unknown>;

function isRecord(value: unknown): value is MetricsRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNumber(record: MetricsRecord, key: string): number | undefined {
    const value = record[key];
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function getNumberArray(record: MetricsRecord, key: string): number[] | undefined {
    const value = record[key];
    if (!Array.isArray(value)) return undefined;

    const numbers = value.filter(
        (item): item is number => typeof item === "number" && Number.isFinite(item)
    );

    return numbers.length === value.length ? numbers : undefined;
}

export async function GET(
    _req: NextRequest,
    { params }: { params: { public_id: string } }
) {
    try {
        const supabase = getSupabaseServer();
        if (!supabase) {
            return NextResponse.json({ error: "DB not configured" }, { status: 500 });
        }

        const { public_id } = params;

        const { data, error } = await supabase
            .from("trade_analysis")
            .select(`
                id,
                public_id,
                user_id,
                dataset_name,
                file_name,
                trades_count,
                winrate,
                profit_factor,
                max_drawdown,
                metrics_json,
                notes,
                created_at,
                strategies ( name, category )
            `)
            .eq("public_id", public_id)
            .eq("is_public", true)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: "Report not found" }, { status: 404 });
        }

        const metrics = isRecord(data.metrics_json) ? data.metrics_json : {};
        const strategy = (data.strategies as StrategySummary[] | null)?.[0] ?? null;

        // Build the equity curve from metrics_json if available
        const equityCurve = getNumberArray(metrics, "equity_curve") ?? [];

        const authClient = createClient();
        const { data: { user } } = await authClient.auth.getUser();
        const can_edit = Boolean(user && user.id === data.user_id);

        let reportIsPro = false;
        if (data.user_id) {
            const sub = await getUserSubscription(data.user_id);
            reportIsPro = isProUser(sub);
        }

        // Check if it's already publicized
        const { data: publicStrategy } = await supabase
            .from("public_strategies")
            .select("slug")
            .eq("report_id", data.id)
            .single();

        const result = {
            id: data.id,
            public_id: data.public_id,
            public_slug: publicStrategy?.slug ?? null,
            strategy_name: strategy?.name ?? null,
            dataset_name: data.dataset_name ?? data.file_name ?? "Report",
            category: strategy?.category ?? "forex",
            created_at: data.created_at,
            metrics: {
                strategy_score:
                    getNumber(metrics, "strategy_score") ??
                    getNumber(metrics, "quant_score") ??
                    0,
                total_trades:
                    data.trades_count ??
                    getNumber(metrics, "total_trades") ??
                    0,
                win_rate:
                    data.winrate ??
                    getNumber(metrics, "win_rate") ??
                    getNumber(metrics, "winrate") ??
                    0,
                profit_factor:
                    data.profit_factor ??
                    getNumber(metrics, "profit_factor") ??
                    0,
                max_drawdown:
                    data.max_drawdown ??
                    getNumber(metrics, "max_drawdown") ??
                    0,
                expectancy_r:
                    getNumber(metrics, "expectancy_r") ??
                    getNumber(metrics, "expectancy") ??
                    0,
                average_r: getNumber(metrics, "average_r") ?? 0,
            },
            equity_curve: equityCurve,
            notes: data.notes ?? "",
            can_edit,
            is_pro: reportIsPro,
            raw_metrics_json: data.metrics_json ?? {},
        };

        return NextResponse.json({ ok: true, data: result });
    } catch (err: unknown) {
        console.error("[PublicReport] Error:", err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
