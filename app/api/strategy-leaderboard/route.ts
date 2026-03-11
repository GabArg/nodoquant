import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { calcQuantScore, calcRobustnessScore, calcHealthScore, calcEvolutionScore } from "@/lib/quantScore";
import { calcConfidence } from "@/components/strategy/ConfidenceIndicator";
import { detectOverfitting } from "@/lib/overfittingRisk";
import { calcEdgeScore } from "@/lib/edgeScore";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "all";

    const supabase = getSupabaseServer();
    if (!supabase) {
        return NextResponse.json({ error: "No DB" }, { status: 500 });
    }

    let query = supabase
        .from("strategies")
        .select(`
            id, name, slug, market, asset, timeframe, strategy_style, category,
            trade_analysis (
                trades_count, winrate, profit_factor, max_drawdown, created_at, is_public, metrics_json
            )
        `);

    if (category !== "all") {
        query = query.eq("category", category);
    }

    const { data: strategies, error } = await query;

    if (error || !strategies) {
        return NextResponse.json({ error: error?.message || "Error fetching strategies" }, { status: 500 });
    }

    const leaderboard = strategies
        .map((strat) => {
            // Only consider public datasets for this strategy
            const publicDatasets = strat.trade_analysis?.filter((t: any) => t.is_public) || [];
            if (publicDatasets.length === 0) return null;

            // Sort datasets newest first
            publicDatasets.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            // Add edge score to each dataset for quant score calc
            const enriched = publicDatasets.map((d: any) => ({
                ...d,
                edge: calcEdgeScore(Number(d.winrate), Number(d.profit_factor), Number(d.max_drawdown), d.trades_count),
            }));

            const bestEdge = enriched.reduce((a: any, b: any) => (b.edge > a.edge ? b : a), enriched[0]);
            const preview = enriched[0]; // latest dataset

            const healthScore = calcHealthScore(
                Number(preview.winrate),
                Number(preview.profit_factor),
                Number(preview.max_drawdown),
                preview.trades_count,
                preview.edge
            );
            const robustnessScore = calcRobustnessScore(enriched);
            const evolutionScore = calcEvolutionScore(enriched);

            const quantResult = calcQuantScore(
                bestEdge.edge,
                robustnessScore,
                healthScore,
                evolutionScore,
                preview.trades_count,
                Number(preview.max_drawdown)
            );

            const totalTrades = enriched.reduce((s: number, d: any) => s + d.trades_count, 0);
            const oldestDate = enriched[enriched.length - 1].created_at;
            const newestDate = enriched[0].created_at;

            const confResult = calcConfidence({
                totalTrades,
                datasetCount: enriched.length,
                oldestDate,
                newestDate,
            });

            const overfitResult = detectOverfitting({
                profitFactor: Number(preview.profit_factor),
                maxDrawdown: Number(preview.max_drawdown),
                trades: preview.trades_count,
                datasetsCount: enriched.length,
                confidenceScore: confResult.score,
                edgeScores: enriched.map((d: any) => d.edge),
                expectancy: preview.metrics_json?.expectancy != null ? Number(preview.metrics_json.expectancy) : undefined,
            });

            return {
                id: strat.id,
                slug: strat.slug,
                name: strat.name,
                market: strat.market,
                asset: strat.asset,
                timeframe: strat.timeframe,
                strategy_style: strat.strategy_style,
                category: strat.category,
                quant_score: quantResult.score,
                confidence: confResult.level, // "Low" | "Moderate" | "High"
                overfitting_risk: overfitResult.riskLevel, // "Low" | "Moderate" | "High"
                datasets_count: enriched.length,
                top_profit_factor: Number(bestEdge.profit_factor),
                created_at: newestDate, // Using latest dataset date or strategy date
            };
        })
        .filter(Boolean);

    // Sort descending by Quant Score
    leaderboard.sort((a: any, b: any) => b.quant_score - a.quant_score);

    return NextResponse.json({ data: leaderboard });
}
