import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { calcEdgeScore } from "@/lib/edgeScore";
import { calcHealthScore, calcQuantScoreSimple } from "@/lib/quantScore";

export async function GET(req: NextRequest) {
    try {
        const supabase = getSupabaseServer();
        if (!supabase) {
            return NextResponse.json({ error: "DB not configured" }, { status: 500 });
        }

        const category = req.nextUrl.searchParams.get("category") || "all";

        // Fetch public analyses with strategy info
        let query = supabase
            .from("trade_analysis")
            .select("id, dataset_name, file_name, trades_count, winrate, profit_factor, max_drawdown, metrics_json, created_at, public_id, strategies(name, category)")
            .eq("is_public", true)
            .order("created_at", { ascending: false })
            .limit(100);

        const { data, error } = await query;

        if (error) {
            console.error("[Leaderboard] Query error:", error.message);
            return NextResponse.json({ error: "Error al cargar" }, { status: 500 });
        }

        let results = (data ?? []).map((a: any) => {
            const wr = Number(a.winrate);
            const pf = Number(a.profit_factor);
            const dd = Number(a.max_drawdown);
            const n = Number(a.trades_count);

            const edge = calcEdgeScore(wr, pf, dd, n);
            const health = calcHealthScore(wr, pf, dd, n, edge);
            const quant = calcQuantScoreSimple(edge, health, n, dd);

            return {
                id: a.id,
                public_id: a.public_id,
                strategy_name: a.strategies?.name || "Strategy Report",
                dataset_name: a.dataset_name || a.file_name || "Dataset",
                category: a.strategies?.category || "forex",
                trades_count: n,
                winrate: wr,
                profit_factor: pf,
                max_drawdown: dd,
                edge_score: edge,
                quant_score: quant,
                created_at: a.created_at,
            };
        });

        // Filter by category
        if (category !== "all") {
            results = results.filter((r: any) => r.category === category);
        }

        // Sort by Quant Score DESC
        results.sort((a: any, b: any) => b.quant_score - a.quant_score);

        return NextResponse.json({ ok: true, data: results });
    } catch (err: any) {
        console.error("[Leaderboard] Error:", err);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
