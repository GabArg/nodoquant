"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import ComparisonCard from "./ComparisonCard";
import ComparisonChart from "./ComparisonChart";
import type { ComparisonStrategy } from "@/hooks/useComparison";

interface ComparisonDashboardProps {
    strategies: ComparisonStrategy[];
    onRemove: (id: string) => void;
    onBack: () => void;
}

export default function ComparisonDashboard({ strategies, onRemove, onBack }: ComparisonDashboardProps) {
    const t = useTranslations("analyzer.comparison");

    const bestFlags = useMemo(() => {
        if (strategies.length < 2) {
            return strategies.map(() => ({
                edgeConfidence: false,
                sqn: false,
                expectancy: false,
                maxDrawdown: false
            }));
        }

        const maxConf = Math.max(...strategies.map(s => s.fullMetrics.advanced?.edgeConfidence || 0));
        const maxSqn = Math.max(...strategies.map(s => s.fullMetrics.advanced?.sqn || 0));
        const maxExp = Math.max(...strategies.map(s => s.metrics.expectancy));
        // Max Drawdown is best when it's closest to zero (least negative)
        const minDD = Math.max(...strategies.map(s => s.metrics.maxDrawdown));

        return strategies.map(s => ({
            edgeConfidence: (s.fullMetrics.advanced?.edgeConfidence || 0) === maxConf && maxConf > 0,
            sqn: (s.fullMetrics.advanced?.sqn || 0) === maxSqn && maxSqn > 0,
            expectancy: s.metrics.expectancy === maxExp && maxExp > 0,
            maxDrawdown: s.metrics.maxDrawdown === minDD && minDD < 0
        }));
    }, [strategies]);

    return (
        <div className="space-y-10 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-center sm:text-left">
                    <h2 className="text-2xl font-black text-white mb-2 tracking-tight uppercase">
                        {t("title")}
                    </h2>
                    <p className="text-sm text-gray-500 font-medium">
                        {t("subtitle")}
                    </p>
                </div>
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/[0.05] border border-white/[0.1] text-indigo-300 text-[10px] font-black uppercase tracking-widest hover:bg-white/[0.1] transition-all shadow-lg"
                >
                    <span>←</span> {t("back")}
                </button>
            </div>

            {strategies.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {strategies.map((strat, i) => (
                            <ComparisonCard
                                key={strat.id}
                                strategy={strat}
                                bestFlags={bestFlags[i]}
                                onRemove={() => onRemove(strat.id)}
                            />
                        ))}
                    </div>

                    <div className="space-y-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-center text-gray-600">
                            Equidad Comparada (Normalizada)
                        </div>
                        <ComparisonChart strategies={strategies} />
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 px-6 rounded-3xl border border-dashed border-white/10 bg-white/[0.01]">
                    <div className="w-16 h-16 rounded-3xl bg-white/[0.02] flex items-center justify-center text-3xl mb-4 grayscale opacity-50">
                        📊
                    </div>
                    <p className="text-gray-500 font-medium text-sm text-center">
                        {t("empty")}
                    </p>
                    <button
                        onClick={onBack}
                        className="mt-6 text-indigo-400 font-black text-[10px] uppercase tracking-widest hover:text-indigo-300 transition-colors"
                    >
                        {t("back")}
                    </button>
                </div>
            )}
        </div>
    );
}
