export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { calcEdgeScore } from "@/lib/edgeScore";
import { calcHealthScore, calcQuantScoreSimple } from "@/lib/quantScore";

interface StrategySummary {
    name: string | null;
    category: string | null;
}

interface LeaderboardAnalysisRow {
    id: string;
    public_id: string | null;
    dataset_name: string | null;
    file_name: string | null;
    trades_count: number | string | null;
    winrate: number | string | null;
    profit_factor: number | string | null;
    max_drawdown: number | string | null;
    metrics_json: unknown;
    created_at: string;
    strategies: StrategySummary[] | null;
}

interface LeaderboardResult {
    id: string;
    public_id: string | null;
    strategy_name: string;
    dataset_name: string;
    category: string;
    trades_count: number;
    winrate: number;
    profit_factor: number;
    max_drawdown: number;
    edge_score: number;
    quant_score: number;
    created_at: string;
}

export async function GET(req: NextRequest) {
    try {
        const supabase = getSupabaseServer();
        if (!supabase) {
            return NextResponse.json({ error: "DB not configured" }, { status: 500 });
        }

        const category = req.nextUrl.searchParams.get("category") || "all";

        // Fetch public analyses with strategy info
        const query = supabase
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

        const rows = (data ?? []) as LeaderboardAnalysisRow[];

        let results: LeaderboardResult[] = rows.map((analysis) => {
            const wr = Number(analysis.winrate);
            const pf = Number(analysis.profit_factor);
            const dd = Number(analysis.max_drawdown);
            const n = Number(analysis.trades_count);
            const strategy = analysis.strategies?.[0] ?? null;

            const edge = calcEdgeScore(wr, pf, dd, n);
            const health = calcHealthScore(wr, pf, dd, n, edge);
            const quant = calcQuantScoreSimple(edge, health, n, dd);

            return {
                id: analysis.id,
                public_id: analysis.public_id,
                strategy_name: strategy?.name || "Strategy Report",
                dataset_name: analysis.dataset_name || analysis.file_name || "Dataset",
                category: strategy?.category || "forex",
                trades_count: n,
                winrate: wr,
                profit_factor: pf,
                max_drawdown: dd,
                edge_score: edge,
                quant_score: quant,
                created_at: analysis.created_at,
            };
        });

        // Filter by category
        if (category !== "all") {
            results = results.filter((result) => result.category === category);
        }

        // Sort by Quant Score DESC
        results.sort((a, b) => b.quant_score - a.quant_score);

        return NextResponse.json({ ok: true, data: results });
    } catch (err: unknown) {
        console.error("[Leaderboard] Error:", err);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
