import { createClient } from "@/lib/auth/server";
import { getSupabaseServer } from "@/lib/supabase";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Strategy Lab — NodoQuant",
};

interface StrategyRow {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    analysis_count: number;
    last_analysis_at: string | null;
    avg_profit_factor: number | null;
}

export default async function StrategiesPage() {
    const authClient = createClient();
    const { data: { user } } = await authClient.auth.getUser();
    const dbClient = getSupabaseServer();

    let strategies: StrategyRow[] = [];

    if (dbClient && user) {
        // Single aggregated query to avoid N+1
        const { data, error } = await dbClient.rpc("get_strategies_with_stats", {
            p_user_id: user.id,
        });

        if (!error && data) {
            strategies = data;
        } else {
            // Fallback: basic query if RPC not yet available
            const { data: basicData } = await dbClient
                .from("strategies")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (basicData) {
                strategies = basicData.map((s: any) => ({
                    ...s,
                    analysis_count: 0,
                    last_analysis_at: null,
                    avg_profit_factor: null,
                }));
            }
        }
    }

    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Strategy Lab</h1>
                    <p className="text-gray-400">Organizá tus análisis por estrategia.</p>
                </div>
                <Link href="/analyzer" className="btn-primary text-sm">
                    + Nueva estrategia
                </Link>
            </header>

            {strategies.length === 0 ? (
                <div className="card rounded-2xl border border-white/5 bg-[#111118] p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2">
                            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                            <line x1="12" y1="22.08" x2="12" y2="12" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No tenés estrategias todavía</h3>
                    <p className="text-sm text-gray-500 mb-6">Creá tu primera estrategia desde el Analyzer subiendo un archivo CSV.</p>
                    <Link href="/analyzer" className="btn-primary inline-flex">
                        Ir al Analyzer →
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {strategies.map((s) => (
                        <Link
                            key={s.id}
                            href={`/dashboard/strategies/${s.id}`}
                            className="card rounded-2xl p-6 border border-white/5 bg-[#111118] hover:border-indigo-500/30 transition-all duration-200 group block"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                                    {s.name}
                                </h3>
                                <span className="text-xs text-gray-500 tabular-nums">
                                    {new Date(s.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            {s.description && (
                                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{s.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-400 mt-auto pt-3 border-t border-white/5">
                                <span>
                                    <strong className="text-white">{s.analysis_count}</strong> análisis
                                </span>
                                {s.avg_profit_factor != null && (
                                    <span>
                                        PF avg: <strong className="text-indigo-300">
                                            {Number(s.avg_profit_factor).toFixed(2)}
                                        </strong>
                                    </span>
                                )}
                                {s.last_analysis_at && (
                                    <span className="ml-auto">
                                        Últ: {new Date(s.last_analysis_at).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
