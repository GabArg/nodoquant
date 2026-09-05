import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { calcQuantScore, calcRobustnessScore, calcHealthScore, calcEvolutionScore } from "@/lib/quantScore";
import { calcConfidence } from "@/components/strategy/ConfidenceIndicator";
import { detectOverfitting } from "@/lib/overfittingRisk";
import { calcEdgeScore } from "@/lib/edgeScore";

interface TradeAnalysisRow {
    trades_count: number;
    winrate: number | string | null;
    profit_factor: number | string | null;
    max_drawdown: number | string | null;
    created_at: string;
    is_public: boolean | null;
    metrics_json: unknown;
}

interface EnrichedTradeAnalysis {
    trades_count: number;
    winrate: number;
    profit_factor: number;
    max_drawdown: number;
    created_at: string;
    metrics_json: unknown;
    edge: number;
}

interface LeaderboardEntry {
    id: string;
    slug: string | null;
    name: string | null;
    market: string | null;
    asset: string | null;
    timeframe: string | null;
    strategy_style: string | null;
    category: string | null;
    quant_score: number;
    confidence: string;
    overfitting_risk: string;
    datasets_count: number;
    top_profit_factor: number;
    created_at: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getExpectancy(metrics: unknown): number | undefined {
    if (!isRecord(metrics)) return undefined;

    const value = metrics.expectancy;
    if (value == null) return undefined;

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function isLeaderboardEntry(
    entry: LeaderboardEntry | null
): entry is LeaderboardEntry {
    return entry !== null;
}

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
        .map((strat): LeaderboardEntry | null => {
            // Only consider public datasets for this strategy
            const tradeAnalysis = (strat.trade_analysis ?? []) as TradeAnalysisRow[];
            const publicDatasets = tradeAnalysis.filter((trade) => trade.is_public);
            if (publicDatasets.length === 0) return null;

            // Sort datasets newest first
            publicDatasets.sort(
                (a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            // Normalize numeric fields once and add edge score for quant score calc
            const enriched: EnrichedTradeAnalysis[] = publicDatasets.map((dataset) => {
                const winrate = Number(dataset.winrate);
                const profitFactor = Number(dataset.profit_factor);
                const maxDrawdown = Number(dataset.max_drawdown);

                return {
                    trades_count: dataset.trades_count,
                    winrate,
                    profit_factor: profitFactor,
                    max_drawdown: maxDrawdown,
                    created_at: dataset.created_at,
                    metrics_json: dataset.metrics_json,
                    edge: calcEdgeScore(
                        winrate,
                        profitFactor,
                        maxDrawdown,
                        dataset.trades_count
                    ),
                };
            });

            const bestEdge = enriched.reduce(
                (best, candidate) => candidate.edge > best.edge ? candidate : best,
                enriched[0]
            );
            const preview = enriched[0]; // latest dataset

            const healthScore = calcHealthScore(
                preview.winrate,
                preview.profit_factor,
                preview.max_drawdown,
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
                preview.max_drawdown
            );

            const totalTrades = enriched.reduce(
                (sum, dataset) => sum + dataset.trades_count,
                0
            );
            const oldestDate = enriched[enriched.length - 1].created_at;
            const newestDate = enriched[0].created_at;

            const confResult = calcConfidence({
                totalTrades,
                datasetCount: enriched.length,
                oldestDate,
                newestDate,
            });

            const overfitResult = detectOverfitting({
                profitFactor: preview.profit_factor,
                maxDrawdown: preview.max_drawdown,
                trades: preview.trades_count,
                datasetsCount: enriched.length,
                confidenceScore: confResult.score,
                edgeScores: enriched.map((dataset) => dataset.edge),
                expectancy: getExpectancy(preview.metrics_json),
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
                top_profit_factor: bestEdge.profit_factor,
                created_at: newestDate, // Using latest dataset date or strategy date
            };
        })
        .filter(isLeaderboardEntry);

    // Sort descending by Quant Score
    leaderboard.sort((a, b) => b.quant_score - a.quant_score);

    return NextResponse.json({ data: leaderboard });
}
