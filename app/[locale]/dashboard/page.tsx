import { createClient } from "@/lib/auth/server";
import { getSupabaseServer } from "@/lib/supabase";
import { calcEdgeScore } from "@/lib/edgeScore";
import { calcHealthScore, calcQuantScoreSimple } from "@/lib/quantScore";
import ConversionBanner from "@/components/dashboard/ConversionBanner";
import StrategyEvolution from "@/components/analyzer/Dashboard/StrategyEvolution";
import ScoreEvolutionChart from "@/components/analyzer/Dashboard/ScoreEvolutionChart";
import EdgeAlerts from "@/components/analyzer/Dashboard/EdgeAlerts";
import WeeklySummary from "@/components/analyzer/Dashboard/WeeklySummary";
import { getUserSubscription, isProUser } from "@/lib/payments/subscription";
import Link from "next/link";

export const dynamic = "force-dynamic";

function computeQuantScore100(winrate: number, pf: number, dd: number, trades: number): number {
    const edge = calcEdgeScore(winrate, pf, dd, trades);
    const health = calcHealthScore(winrate, pf, dd, trades, edge);
    const quant = calcQuantScoreSimple(edge, health, trades, dd);
    return Math.round(quant * 10); // 0–100
}

export default async function DashboardPage() {
    const authClient = createClient();
    const { data: { user } } = await authClient.auth.getUser();

    // Server data fetch - protected by RLS if queries use user_id, 
    // but we use getSupabaseServer() with service role historically, wait:
    // If we use service role we bypass RLS, so we explicitly filter by user_id here.
    const dbClient = getSupabaseServer();

    // Check Pro Status
    let isPro = false;
    if (user) {
        const sub = await getUserSubscription(user.id);
        isPro = isProUser(sub);
    }

    let stats = { projects: 0, analyses: 0, winrateAvg: 0, strategies: 0, bestPF: 0, bestPFName: '' };
    let recentAnalyses: any[] = [];

    if (dbClient && user) {
        // Fetch projects count
        const { count: projectsCount } = await dbClient
            .from("projects")
            .select("id", { count: "exact" })
            .eq("user_id", user.id);

        // Fetch analyses count and stats
        const { data: analyses, count: analysesCount } = await dbClient
            .from("trade_analysis")
            .select("id, created_at, file_name, winrate, profit_factor, max_drawdown, trades_count, metrics_json", { count: "exact" })
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        stats.projects = projectsCount || 0;
        stats.analyses = analysesCount || 0;

        if (analyses && analyses.length > 0) {
            recentAnalyses = analyses.slice(0, 5);
            const sumWinrate = analyses.reduce((acc, curr) => acc + Number(curr.winrate), 0);
            stats.winrateAvg = sumWinrate / analyses.length;

            // Best PF
            const bestAnalysis = analyses.reduce((best, curr) =>
                Number(curr.profit_factor) > Number(best.profit_factor) ? curr : best
                , analyses[0]);
            stats.bestPF = Number(bestAnalysis.profit_factor);
            stats.bestPFName = bestAnalysis.file_name || '';
        }

        // Fetch strategies count
        const { count: strategiesCount } = await dbClient
            .from("strategies")
            .select("id", { count: "exact" })
            .eq("user_id", user.id);

        stats.strategies = strategiesCount || 0;
    }

    // Compute best quant score (0-100) from all analyses
    let bestQuantScore: number | null = null;
    if (recentAnalyses.length > 0) {
        const scores = recentAnalyses.map((a) =>
            computeQuantScore100(
                Number(a.winrate),
                Number(a.profit_factor),
                Number(a.max_drawdown),
                Number(a.trades_count ?? 0)
            )
        );
        bestQuantScore = Math.max(...scores);
    }

    // Derive locale from URL context — fallback to 'en'
    const locale = "en";

    // Data for charts and evolution
    const chartData = [...recentAnalyses].reverse().map(a => ({
        date: a.created_at,
        score: computeQuantScore100(Number(a.winrate), Number(a.profit_factor), Number(a.max_drawdown), Number(a.trades_count || 0))
    }));

    const latestReport = recentAnalyses[0] ? {
        winrate: Number(recentAnalyses[0].winrate),
        profit_factor: Number(recentAnalyses[0].profit_factor),
        max_drawdown: Number(recentAnalyses[0].max_drawdown),
        trades_count: Number(recentAnalyses[0].trades_count || 0),
        quant_score: computeQuantScore100(Number(recentAnalyses[0].winrate), Number(recentAnalyses[0].profit_factor), Number(recentAnalyses[0].max_drawdown), Number(recentAnalyses[0].trades_count || 0)),
        metrics_json: recentAnalyses[0].metrics_json
    } : null;

    const previousReport = recentAnalyses[1] ? {
        winrate: Number(recentAnalyses[1].winrate),
        profit_factor: Number(recentAnalyses[1].profit_factor),
        max_drawdown: Number(recentAnalyses[1].max_drawdown),
        trades_count: Number(recentAnalyses[1].trades_count || 0),
        quant_score: computeQuantScore100(Number(recentAnalyses[1].winrate), Number(recentAnalyses[1].profit_factor), Number(recentAnalyses[1].max_drawdown), Number(recentAnalyses[1].trades_count || 0)),
    } : null;

    return (
        <div className="space-y-8">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        Welcome back
                        {isPro && <span className="text-xs px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded-full uppercase tracking-widest">Pro</span>}
                    </h1>
                    <p className="text-gray-400">Here is the status of your quantitative strategies.</p>
                </div>
                {!isPro && (
                    <Link href="/pricing" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg flex items-center gap-2">
                        Upgrade to Pro ✨
                    </Link>
                )}
            </header>

            {bestQuantScore !== null && (
                <ConversionBanner bestScore={bestQuantScore} locale={locale} />
            )}

            {/* Top Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card rounded-2xl p-6 border border-indigo-500/20 bg-indigo-500/5">
                    <h3 className="text-sm font-medium text-indigo-400 uppercase tracking-wider mb-2">Estrategias</h3>
                    <p className="text-3xl font-bold text-white">{stats.strategies}</p>
                </div>
                <div className="card rounded-2xl p-6 border border-white/5 bg-[#111118]">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Análisis Totales</h3>
                    <p className="text-3xl font-bold text-white">{stats.analyses}</p>
                </div>
                <div className="card rounded-2xl p-6 border border-white/5 bg-[#111118]">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Winrate Promedio</h3>
                    <p className="text-3xl font-bold text-[#34d399]">{stats.winrateAvg > 0 ? `${stats.winrateAvg.toFixed(1)}%` : "-"}</p>
                </div>
                <div className="card rounded-2xl p-6 border border-white/5 bg-[#111118]">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Mejor Profit Factor</h3>
                    <p className="text-3xl font-bold text-white">{stats.bestPF > 0 ? stats.bestPF.toFixed(2) : "-"}</p>
                </div>
            </div>

            {/* Evolution & Insights grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <ScoreEvolutionChart data={chartData} />
                    <StrategyEvolution latest={latestReport} previous={previousReport} />
                </div>
                <div className="space-y-6">
                    <EdgeAlerts latestReport={latestReport} />
                    {latestReport && <WeeklySummary latestReport={latestReport} />}
                </div>
            </div>

            {/* Strategy History Cards */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Historial de Estrategias</h2>
                    <a href="/analyzer" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium bg-indigo-500/10 px-4 py-2 rounded-lg transition-colors">Analizar nueva →</a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentAnalyses.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 border border-white/5 rounded-2xl bg-[#111118] col-span-full">
                            No tenés estrategias analizadas todavía.<br />
                            <a href="/analyzer" className="text-indigo-400 hover:text-indigo-300 font-medium mt-2 inline-block">Probar Analyzer →</a>
                        </div>
                    ) : (
                        recentAnalyses.map(analysis => {
                            const score = computeQuantScore100(Number(analysis.winrate), Number(analysis.profit_factor), Number(analysis.max_drawdown), Number(analysis.trades_count || 0));
                            return (
                                <a href={`/report/${analysis.id}`} key={analysis.id} className="card rounded-2xl p-5 border border-white/5 bg-[#111118] hover:border-indigo-500/30 transition-all group block">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-white truncate max-w-[180px]">{analysis.file_name || 'Análisis'}</h3>
                                            <p className="text-xs text-gray-500">{new Date(analysis.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: score >= 60 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444' }}>
                                            {score}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                        <div className="bg-white/5 rounded p-2">
                                            <span className="block text-gray-500 mb-1">Trades</span>
                                            <span className="text-white font-medium">{analysis.trades_count || '-'}</span>
                                        </div>
                                        <div className="bg-white/5 rounded p-2">
                                            <span className="block text-gray-500 mb-1">Winrate</span>
                                            <span className="text-emerald-400 font-medium">{Number(analysis.winrate).toFixed(1)}%</span>
                                        </div>
                                        <div className="bg-white/5 rounded p-2">
                                            <span className="block text-gray-500 mb-1">Profit F.</span>
                                            <span className="text-white font-medium">{Number(analysis.profit_factor).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </a>
                            );
                        })
                    )}
                </div>
            </section>
        </div>
    );
}
