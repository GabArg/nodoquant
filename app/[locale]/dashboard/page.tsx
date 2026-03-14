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
import { getTranslations } from "next-intl/server";
import TrialBanner from "@/components/nodoquant/TrialBanner";

export const dynamic = "force-dynamic";

function computeQuantScore100(winrate: number, pf: number, dd: number, trades: number): number {
    const edge = calcEdgeScore(winrate, pf, dd, trades);
    const health = calcHealthScore(winrate, pf, dd, trades, edge);
    const quant = calcQuantScoreSimple(edge, health, trades, dd);
    return Math.round(quant * 10); // 0–100
}

export default async function DashboardPage({ params }: { params: { locale: string } }) {
    const t = await getTranslations({ locale: params.locale, namespace: "dashboard" });
    const authClient = createClient();
    const { data: { user } } = await authClient.auth.getUser();

    const dbClient = getSupabaseServer();

    // Check Plan Status
    let isPro = false;
    let planStatus: any = null;
    if (user) {
        const { getUserPlanStatus } = await import("@/lib/payments/subscription");
        planStatus = await getUserPlanStatus(user.id);
        isPro = planStatus.isPro;
    }

    let statsList = { projects: 0, analyses: 0, winrateAvg: 0, strategies: 0, bestPF: 0, bestPFName: '' };
    let recentAnalyses: any[] = [];

    if (dbClient && user) {
        const { count: projectsCount } = await dbClient
            .from("projects")
            .select("id", { count: "exact" })
            .eq("user_id", user.id);

        const { data: analyses, count: analysesCount } = await dbClient
            .from("trade_analysis")
            .select("id, created_at, file_name, winrate, profit_factor, max_drawdown, trades_count, metrics_json", { count: "exact" })
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        statsList.projects = projectsCount || 0;
        statsList.analyses = analysesCount || 0;

        if (analyses && analyses.length > 0) {
            recentAnalyses = analyses.slice(0, 5);
            const sumWinrate = analyses.reduce((acc, curr) => acc + Number(curr.winrate), 0);
            statsList.winrateAvg = sumWinrate / analyses.length;

            const bestAnalysis = analyses.reduce((best, curr) =>
                Number(curr.profit_factor) > Number(best.profit_factor) ? curr : best
                , analyses[0]);
            statsList.bestPF = Number(bestAnalysis.profit_factor);
            statsList.bestPFName = bestAnalysis.file_name || '';
        }

        const { count: strategiesCount } = await dbClient
            .from("strategies")
            .select("id", { count: "exact" })
            .eq("user_id", user.id);

        statsList.strategies = strategiesCount || 0;
    }

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
            {planStatus?.isTrial && (
                <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 mb-8">
                    <TrialBanner daysRemaining={planStatus.trialDaysRemaining} plan={planStatus.plan} />
                </div>
            )}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        {t("greeting")}
                        {isPro && <span className="text-xs px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded-full uppercase tracking-widest">Pro</span>}
                    </h1>
                    <p className="text-gray-400">{t("subtitle")}</p>
                </div>
                {!isPro && (
                    <Link href={`/${params.locale}/pricing`} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg flex items-center gap-2">
                        {t("upgrade")}
                    </Link>
                )}
            </header>

            {bestQuantScore !== null && (
                <ConversionBanner bestScore={bestQuantScore} locale={params.locale} />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card rounded-2xl p-6 border border-indigo-500/20 bg-indigo-500/5">
                    <h3 className="text-sm font-medium text-indigo-400 uppercase tracking-wider mb-2">{t("stats.strategies")}</h3>
                    <p className="text-3xl font-bold text-white">{statsList.strategies}</p>
                </div>
                <div className="card rounded-2xl p-6 border border-white/5 bg-[#111118]">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">{t("stats.totalAnalyses")}</h3>
                    <p className="text-3xl font-bold text-white">{statsList.analyses}</p>
                </div>
                <div className="card rounded-2xl p-6 border border-white/5 bg-[#111118]">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">{t("stats.avgWinrate")}</h3>
                    <p className="text-3xl font-bold text-[#34d399]">{statsList.winrateAvg > 0 ? `${statsList.winrateAvg.toFixed(1)}%` : "-"}</p>
                </div>
                <div className="card rounded-2xl p-6 border border-white/5 bg-[#111118]">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">{t("stats.bestPF")}</h3>
                    <p className="text-3xl font-bold text-white">{statsList.bestPF > 0 ? statsList.bestPF.toFixed(2) : "-"}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <ScoreEvolutionChart data={chartData} />
                    <StrategyEvolution 
                        evolution={(latestReport?.metrics_json as any)?.evolution} 
                    />
                </div>
                <div className="space-y-6">
                    <EdgeAlerts latestReport={latestReport} />
                    {latestReport && <WeeklySummary latestReport={latestReport} />}
                </div>
            </div>

            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">{t("history.title")}</h2>
                    <Link href={`/${params.locale}/analyzer`} className="text-sm text-indigo-400 hover:text-indigo-300 font-medium bg-indigo-500/10 px-4 py-2 rounded-lg transition-colors">{t("history.analyzeNew")}</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentAnalyses.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 border border-white/5 rounded-2xl bg-[#111118] col-span-full">
                            {t("history.empty")}<br />
                            <Link href={`/${params.locale}/analyzer`} className="text-indigo-400 hover:text-indigo-300 font-medium mt-2 inline-block">{t("history.tryAnalyzer")}</Link>
                        </div>
                    ) : (
                        recentAnalyses.map(analysis => {
                            const score = computeQuantScore100(Number(analysis.winrate), Number(analysis.profit_factor), Number(analysis.max_drawdown), Number(analysis.trades_count || 0));
                            return (
                                <Link href={`/${params.locale}/report/${analysis.id}`} key={analysis.id} className="card rounded-2xl p-5 border border-white/5 bg-[#111118] hover:border-indigo-500/30 transition-all group block">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-white truncate max-w-[180px]">{analysis.file_name || t("history.analysis")}</h3>
                                            <p className="text-xs text-gray-500">{new Date(analysis.created_at).toLocaleDateString(params.locale)}</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: score >= 60 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444' }}>
                                            {score}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                        <div className="bg-white/5 rounded p-2">
                                            <span className="block text-gray-500 mb-1">{t("history.trades")}</span>
                                            <span className="text-white font-medium">{analysis.trades_count || '-'}</span>
                                        </div>
                                        <div className="bg-white/5 rounded p-2">
                                            <span className="block text-gray-500 mb-1">{t("history.winrate")}</span>
                                            <span className="text-emerald-400 font-medium">{Number(analysis.winrate).toFixed(1)}%</span>
                                        </div>
                                        <div className="bg-white/5 rounded p-2">
                                            <span className="block text-gray-500 mb-1">{t("history.profitFactor")}</span>
                                            <span className="text-white font-medium">{Number(analysis.profit_factor).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </div>
            </section>
        </div>
    );
}
