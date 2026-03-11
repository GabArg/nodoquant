import { Metadata } from "next";
import { getSupabaseServer } from "@/lib/supabase";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Global Strategy Leaderboard — NodoQuant",
    description: "The world's most consistent trading strategies, ranked by the NodoQuant algorithm. Compare Forex, Crypto, and Stocks performance.",
};

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
                        <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Global Ranking</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
                        Strategy <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">Leaderboard</span>
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg font-medium leading-relaxed">
                        Comparing the most robust trading edges in the world. Ranked by the proprietary NodoQuant consistency score.
                    </p>
                </div>

                {/* Filters Row */}
                <div className="flex justify-center flex-wrap gap-2 mb-12">
                    {markets.map((m) => (
                        <Link
                            key={m}
                            href={`/${params.locale}/strategy-leaderboard?market=${m}`}
                            className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${(market === m || (!market && m === "All"))
                                    ? "bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-600/20"
                                    : "bg-white/5 border-white/5 text-gray-500 hover:text-white hover:bg-white/10"
                                }`}
                        >
                            {m}
                        </Link>
                    ))}
                </div>

                {/* Leaderboard Table Container */}
                <div className="bg-[#0A0D14] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/[0.02]">
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] w-20">Rank</th>
                                    <th className="px-6 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Strategy Name</th>
                                    <th className="px-6 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Market</th>
                                    <th className="px-6 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-center">Score</th>
                                    <th className="px-6 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-center">Win Rate</th>
                                    <th className="px-6 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-center">PF</th>
                                    <th className="px-6 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-center">Trades</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {strategies && strategies.length > 0 ? (
                                    strategies.map((strategy, index) => (
                                        <tr key={strategy.id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="px-8 py-6">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${index === 0 ? "bg-amber-500/20 text-amber-500 border border-amber-500/30" :
                                                        index === 1 ? "bg-gray-400/20 text-gray-300 border border-gray-400/30" :
                                                            index === 2 ? "bg-orange-600/20 text-orange-500 border border-orange-600/30" :
                                                                "bg-white/5 text-gray-500 border border-white/5"
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold group-hover:text-indigo-400 transition-colors">{strategy.strategy_name}</span>
                                                    <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{strategy.symbol}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                                                    {strategy.market}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <span className={`text-lg font-black ${strategy.score >= 80 ? "text-emerald-400" :
                                                        strategy.score >= 60 ? "text-amber-400" :
                                                            "text-red-400"
                                                    }`}>
                                                    {strategy.score}
                                                </span>
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
                                                    View Profile
                                                    <svg className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-8 py-20 text-center">
                                            <p className="text-gray-500 font-medium italic">No strategies found for this market ranking.</p>
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
                        <span className="text-indigo-400 font-bold">Note:</span> Rankings are recalculated every 24 hours based on Strategy Score, Risk-Adjusted Return, and Statistical Robustness. Only strategies with verified trade history are eligible for the Global Leaderboard.
                    </p>
                </div>
            </div>
        </main>
    );
}
