import { Metadata } from "next";
import { getSupabaseServer } from "@/lib/supabase";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
    const t = await getTranslations({ locale: params.locale, namespace: "leaderboard.metadata" });
    return {
        title: t("title"),
        description: t("description"),
    };
}

interface SearchParams {
    market?: string;
}

export default async function LeaderboardPage({
    params,
    searchParams
}: {
    params: { locale: string };
    searchParams: SearchParams
}) {
    const t = await getTranslations({ locale: params.locale, namespace: "leaderboard" });
    const tCommon = await getTranslations({ locale: params.locale, namespace: "fullReport.publishModal" });
    const supabase = getSupabaseServer();
    
    if (!supabase) return <div>Database configuration error</div>;

    const { market } = searchParams;

    let query = supabase
        .from("public_strategies")
        .select("*")
        .order("score", { ascending: false })
        .order("profit_factor", { ascending: false })
        .order("trades", { ascending: false });

    if (market && market !== "All") {
        query = query.eq("market", market);
    }

    const { data: strategies } = await query.limit(100);

    const markets = ["All", "Forex", "Crypto", "Futures", "Stocks"];

    return (
        <main className="min-h-screen bg-[#07090F] pt-24 pb-20 px-4">
            <div className="max-w-6xl mx-auto">

                {/* Header Section */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
                        <svg className="w-4 h-4 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">{t("hero.badge")}</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
                        {t("hero.title")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">{t("hero.titleAccent")}</span>
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg font-medium leading-relaxed">
                        {t("hero.subtitle")}
                    </p>
                </div>

                {/* Filters Row */}
                <div className="flex justify-center flex-wrap gap-2 mb-12">
                    {markets.map((m) => (
                        <Link
                            key={m}
                            href={`/${params.locale}/leaderboard?market=${m}`}
                            className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${(market === m || (!market && m === "All"))
                                    ? "bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-600/20"
                                    : "bg-white/5 border-white/5 text-gray-500 hover:text-white hover:bg-white/10"
                                }`}
                        >
                            {m === "All" ? "All" : (tCommon(`markets.${m}`) || m)}
                        </Link>
                    ))}
                </div>

                {/* Leaderboard Table Container */}
                <div className="bg-[#0A0D14] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/[0.02]">
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] w-20">{t("table.rank")}</th>
                                    <th className="px-6 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{t("table.name")}</th>
                                    <th className="px-6 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-center">{t("table.score")}</th>
                                    <th className="px-6 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-center">{t("table.winRate")}</th>
                                    <th className="px-6 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-center">{t("table.pf")}</th>
                                    <th className="px-6 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-center">{t("table.trades")}</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-right">{t("table.action")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {strategies && strategies.length > 0 ? (
                                    strategies.map((strategy, index) => {
                                        const score = strategy.score;
                                        let scoreTier = { label: t("tiers.weak"), color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" };
                                        if (score >= 90) scoreTier = { label: t("tiers.elite"), color: "text-indigo-400", bg: "bg-indigo-500/15", border: "border-indigo-500/30" };
                                        else if (score >= 75) scoreTier = { label: t("tiers.strong"), color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
                                        else if (score >= 60) scoreTier = { label: t("tiers.moderate"), color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" };

                                        return (
                                            <tr key={strategy.id} className="group hover:bg-white/[0.02] transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm relative ${index === 0 ? "bg-amber-500/20 text-amber-500 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]" :
                                                            index === 1 ? "bg-slate-300/20 text-slate-300 border border-slate-300/30" :
                                                                index === 2 ? "bg-orange-600/20 text-orange-500 border border-orange-600/30" :
                                                                    "bg-white/5 text-gray-500 border border-white/5"
                                                        }`}>
                                                        {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                                                        {index < 3 && (
                                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping opacity-20" />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-white font-bold group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{strategy.strategy_name}</span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest leading-none">{strategy.symbol}</span>
                                                            <span className="w-1 h-1 rounded-full bg-gray-800" />
                                                            <span className="text-[9px] font-bold py-1 px-2 rounded-md bg-white/5 text-gray-500 uppercase tracking-tight leading-none">{tCommon(`markets.${strategy.market}`) || strategy.market}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className={`text-xl font-black ${scoreTier.color} tabular-nums`}>
                                                            {score}
                                                        </span>
                                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${scoreTier.bg} ${scoreTier.color} ${scoreTier.border}`}>
                                                            {scoreTier.label}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-center text-sm font-bold text-gray-300 tabular-nums">
                                                    {(strategy.win_rate > 1 ? strategy.win_rate : strategy.win_rate * 100).toFixed(1)}%
                                                </td>
                                                <td className="px-6 py-6 text-center text-sm font-bold text-gray-300 tabular-nums">
                                                    {strategy.profit_factor.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-6 text-center text-sm font-bold text-gray-300 tabular-nums">
                                                    {strategy.trades}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <Link
                                                        href={`/${params.locale}/strategy/${strategy.slug}`}
                                                        className="inline-flex items-center gap-2 text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors group/link"
                                                    >
                                                        {t("table.action")}
                                                        <svg className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-8 py-20 text-center">
                                            <p className="text-gray-500 font-medium italic">{t("empty")}</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Insight */}
                <div className="mt-12 text-center p-8 rounded-3xl border border-white/5 bg-indigo-500/[0.02]">
                    <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-3xl mx-auto">
                        <span className="text-indigo-400 font-bold">Note:</span> {t("note")}
                    </p>
                </div>
            </div>
        </main>
    );
}
