import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { createClient } from "@/lib/auth/server";
import { getUserSubscription, isProUser } from "@/lib/payments/subscription";

export const dynamic = "force-dynamic";

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

        const metrics = data.metrics_json as any ?? {};

        // Build the equity curve from metrics_json if available
        const equityCurve: number[] = metrics?.equity_curve ?? [];

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
            strategy_name: (data.strategies as any)?.name ?? null,
            dataset_name: data.dataset_name ?? data.file_name ?? "Report",
            category: (data.strategies as any)?.category ?? "forex",
            created_at: data.created_at,
            metrics: {
                strategy_score: metrics?.strategy_score ?? metrics?.quant_score ?? 0,
                total_trades: data.trades_count ?? metrics?.total_trades ?? 0,
                win_rate: data.winrate ?? metrics?.win_rate ?? metrics?.winrate ?? 0,
                profit_factor: data.profit_factor ?? metrics?.profit_factor ?? 0,
                max_drawdown: data.max_drawdown ?? metrics?.max_drawdown ?? 0,
                expectancy_r: metrics?.expectancy_r ?? metrics?.expectancy ?? 0,
                average_r: metrics?.average_r ?? 0,
            },
            equity_curve: equityCurve,
            notes: data.notes ?? "",
            can_edit,
            is_pro: reportIsPro,
            raw_metrics_json: data.metrics_json ?? {}
        };

        return NextResponse.json({ ok: true, data: result });
    } catch (err: any) {
        console.error("[PublicReport] Error:", err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
