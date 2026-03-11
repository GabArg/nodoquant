import { createClient } from "@/lib/auth/server";
import { getSupabaseServer } from "@/lib/supabase";
import Link from "next/link";
import ShareReportButton from "@/components/analyzer/ShareReportButton";

export const dynamic = "force-dynamic";

export default async function StrategyDetailPage({
    params,
}: {
    params: { id: string };
}) {
    const authClient = createClient();
    const { data: { user } } = await authClient.auth.getUser();
    const dbClient = getSupabaseServer();

    let strategy: any = null;
    let analyses: any[] = [];

    if (dbClient && user) {
        const { data: stratData } = await dbClient
            .from("strategies")
            .select("*")
            .eq("id", params.id)
            .eq("user_id", user.id)
            .single();

        strategy = stratData;

        if (strategy) {
            const { data: analysisData } = await dbClient
                .from("trade_analysis")
                .select("id, dataset_name, trades_count, winrate, profit_factor, max_drawdown, created_at, file_name, public_id, is_public, show_strategy_name, show_dataset_name")
                .eq("strategy_id", params.id)
                .order("created_at", { ascending: false });

            analyses = analysisData ?? [];
        }
    }

    if (!strategy) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-white mb-2">Estrategia no encontrada</h2>
                <p className="text-gray-500 mb-6">No existe o no tenés permisos para verla.</p>
                <Link href="/dashboard/strategies" className="btn-primary inline-flex">
                    ← Volver al Lab
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <header>
                <Link href="/dashboard/strategies" className="text-sm text-gray-500 hover:text-indigo-400 transition-colors mb-4 inline-block">
                    ← Volver al Lab
                </Link>
                <h1 className="text-3xl font-bold text-white mb-1">{strategy.name}</h1>
                {strategy.description && (
                    <p className="text-gray-400">{strategy.description}</p>
                )}
            </header>

            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Datasets analizados</h2>
                    <Link href="/analyzer" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">
                        + Nuevo análisis
                    </Link>
                </div>

                <div className="card rounded-2xl border border-white/5 bg-[#111118] overflow-hidden">
                    {analyses.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No hay análisis en esta estrategia todavía.<br />
                            <Link href="/analyzer" className="text-indigo-400 hover:text-indigo-300 font-medium mt-2 inline-block">
                                Subir un CSV →
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-300">
                                <thead className="bg-black/20 text-xs uppercase font-medium text-gray-500 border-b border-white/5">
                                    <tr>
                                        <th className="px-6 py-4">Dataset</th>
                                        <th className="px-6 py-4">Trades</th>
                                        <th className="px-6 py-4 text-right">Winrate</th>
                                        <th className="px-6 py-4 text-right">Profit Factor</th>
                                        <th className="px-6 py-4 text-right">Max DD</th>
                                        <th className="px-6 py-4 text-right">Fecha</th>
                                        <th className="px-6 py-4 text-right">Compartir</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {analyses.map((a) => (
                                        <tr key={a.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 font-medium text-white">
                                                {a.dataset_name || a.file_name || "Dataset"}
                                            </td>
                                            <td className="px-6 py-4 tabular-nums">{a.trades_count}</td>
                                            <td className="px-6 py-4 text-right text-[#34d399] tabular-nums">
                                                {Number(a.winrate).toFixed(1)}%
                                            </td>
                                            <td className="px-6 py-4 text-right tabular-nums">
                                                {Number(a.profit_factor).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-red-400 tabular-nums">
                                                {Number(a.max_drawdown).toFixed(1)}%
                                            </td>
                                            <td className="px-6 py-4 text-right text-gray-500 tabular-nums">
                                                {new Date(a.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <ShareReportButton
                                                    analysisId={a.id}
                                                    currentPublicId={a.public_id}
                                                    isPublic={a.is_public}
                                                    showStrategyName={a.show_strategy_name}
                                                    showDatasetName={a.show_dataset_name}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
