import { Metadata } from "next";
import { getSupabaseServer } from "@/lib/supabase";
import StrategyCard from "@/components/strategy/StrategyCard";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Public Strategy Library — NodoQuant",
    description: "Discover top-performing trading strategies. Browse backtested results for Forex, Crypto, Stocks, and Futures from our community.",
};

interface SearchParams {
    market?: string;
    sort?: string;
}

export default async function StrategiesPage({
    params,
    searchParams
}: {
    params: { locale: string };
    searchParams: SearchParams
}) {
    const supabase = getSupabaseServer();
    if (!supabase) return <div>Database configuration error</div>;

    const { market, sort } = searchParams;

    let query = supabase
        .from("public_strategy_profiles")
        .select("*")
        .eq("visibility", "public");

    // Filters
    if (market && market !== "All") {
        query = query.eq("market", market);
    }

    // Sort
    if (sort === "top") {
        query = query.order("score", { ascending: false });
    } else {
        query = query.order("published_at", { ascending: false });
    }

    const { data: strategies, error } = await query.limit(50);

    const markets = ["All", "Forex", "Crypto", "Futures", "Stocks"];

    return (
        <main className="min-h-screen bg-[#07090F] pt-24 pb-20 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Hero / Header */}
                <div className="text-center mb-16 px-4">
                    <h1 className="text-4xl sm:text-6xl font-black text-white mb-6 tracking-tight">
                        Strategy <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">Library</span>
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
                        Explore winning trading edges verified by the NodoQuant algorithm. Real data, real statistics, real consistency.
                    </p>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 py-6 border-y border-white/5">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        {markets.map((m) => (
                            <Link
                                key={m}
                                href={`/${params.locale}/strategies?market=${m}${sort ? `&sort=${sort}` : ""}`}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${(market === m || (!market && m === "All"))
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                                    }`}
                            >
                                {m}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sort by:</span>
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                            <Link
                                href={`/${params.locale}/strategies?sort=recent${market ? `&market=${market}` : ""}`}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${(!sort || sort === "recent") ? "bg-[#0A0D14] text-white shadow-sm" : "text-gray-500 hover:text-gray-300"
                                    }`}
                            >
                                Most Recent
                            </Link>
                            <Link
                                href={`/${params.locale}/strategies?sort=top${market ? `&market=${market}` : ""}`}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${sort === "top" ? "bg-[#0A0D14] text-white shadow-sm" : "text-gray-500 hover:text-gray-300"
                                    }`}
                            >
                                Top Score
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Grid */}
                {strategies && strategies.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {strategies.map((strategy) => (
                            <StrategyCard
                                key={strategy.id}
                                strategy={strategy as any}
                                locale={params.locale}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 px-6 rounded-3xl border border-dashed border-white/10 bg-white/[0.02]">
                        <div className="text-5xl mb-6 opacity-30">🔍</div>
                        <h2 className="text-2xl font-bold text-white mb-3">No strategies found</h2>
                        <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                            We couldn&apos;t find any public strategies matching your current filters. Be the first to publish one!
                        </p>
                        <Link
                            href={`/${params.locale}/analyzer`}
                            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white font-bold px-6 py-3 rounded-xl border border-white/10 transition-all"
                        >
                            Analyze my strategy →
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
}
