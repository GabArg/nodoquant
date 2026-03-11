import { createClient } from "@/lib/auth/server";
import { getSupabaseServer } from "@/lib/supabase";
import Link from "next/link";
import CompareClient from "./CompareClient";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Strategy Comparison — NodoQuant",
};

export default async function ComparePage() {
    const authClient = createClient();
    const { data: { user } } = await authClient.auth.getUser();
    const dbClient = getSupabaseServer();

    let analyses: any[] = [];

    if (dbClient && user) {
        const { data } = await dbClient
            .from("trade_analysis")
            .select("id, strategy_id, dataset_name, file_name, trades_count, winrate, profit_factor, max_drawdown, metrics_json, created_at, strategies(name)")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        analyses = data ?? [];
    }

    if (analyses.length < 2) {
        return (
            <div className="space-y-8">
                <header>
                    <h1 className="text-3xl font-bold text-white mb-2">Strategy Comparison</h1>
                    <p className="text-gray-400">Compará estrategias y datasets lado a lado.</p>
                </header>
                <div className="card rounded-2xl border border-white/5 bg-[#111118] p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2">
                            <line x1="18" y1="20" x2="18" y2="10" />
                            <line x1="12" y1="20" x2="12" y2="4" />
                            <line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Necesitás al menos 2 análisis</h3>
                    <p className="text-sm text-gray-500 mb-6">Subí datasets desde el Analyzer para poder comparar.</p>
                    <Link href="/analyzer" className="btn-primary inline-flex">
                        Ir al Analyzer →
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-white mb-2">Strategy Comparison</h1>
                <p className="text-gray-400">Seleccioná hasta 4 análisis y comparalos lado a lado.</p>
            </header>
            <CompareClient analyses={analyses} />
        </div>
    );
}
