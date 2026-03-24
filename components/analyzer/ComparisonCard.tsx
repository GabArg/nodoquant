"use client";

import { useTranslations } from "next-intl";
import type { ComparisonStrategy } from "@/hooks/useComparison";

interface ComparisonCardProps {
    strategy: ComparisonStrategy;
    bestFlags: {
        edgeConfidence: boolean;
        sqn: boolean;
        expectancy: boolean;
        maxDrawdown: boolean;
    };
    onRemove: () => void;
}

export default function ComparisonCard({ strategy, bestFlags, onRemove }: ComparisonCardProps) {
    const t = useTranslations("analyzer.results");
    const compT = useTranslations("analyzer.comparison");
    const robustT = useTranslations("analyzer.diagnostics.robustness");
    const confT = useTranslations("analyzer.diagnostics.edgeConfidence");

    const { metrics, fullMetrics, name } = strategy;
    const robustLevel = fullMetrics.advanced?.robustnessLevel || "fragile";
    const confidence = fullMetrics.advanced?.edgeConfidence || 0;
    const sqn = fullMetrics.advanced?.sqn || 0;

    const BestBadge = () => (
        <div className="absolute -top-3 -right-3 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] z-10 animate-bounce-subtle">
            <span className="text-xs">👑</span>
        </div>
    );

    return (
        <div className="relative group rounded-3xl p-6 transition-all duration-500 border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] backdrop-blur-xl">
            <button 
                onClick={onRemove}
                className="absolute top-4 right-4 text-gray-500 hover:text-red-400 transition-colors z-20"
                title={compT("remove")}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                </svg>
            </button>

            <div className="mb-6">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1">
                    {t("metrics.strategy")}
                </div>
                <h3 className="text-lg font-black text-white truncate max-w-[200px]" title={name}>
                    {name}
                </h3>
            </div>

            <div className="space-y-4">
                {/* Edge Confidence */}
                <div className="relative p-4 rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
                    {bestFlags.edgeConfidence && <BestBadge />}
                    <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">{confT("title")}</div>
                    <div className="flex items-end justify-between">
                        <span className={`text-2xl font-black ${confidence >= 70 ? "text-emerald-400" : confidence >= 30 ? "text-amber-400" : "text-red-400"}`}>
                            {confidence}%
                        </span>
                    </div>
                </div>

                {/* Robustness Level */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">{robustT("title")}</div>
                    <span className={`text-xs font-black uppercase tracking-widest ${
                        robustLevel === "elite" ? "text-indigo-400" :
                        robustLevel === "robust" ? "text-emerald-400" :
                        robustLevel === "moderate" ? "text-amber-400" : "text-red-400"
                    }`}>
                        {robustT(`levels.${robustLevel}`)}
                    </span>
                </div>

                {/* Grid for other metrics */}
                <div className="grid grid-cols-1 gap-3">
                    {/* SQN */}
                    <div className="relative p-3 rounded-2xl bg-white/[0.01] border border-white/5">
                        {bestFlags.sqn && <BestBadge />}
                        <div className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">SQN</div>
                        <div className="text-sm font-black text-white">{sqn.toFixed(2)}</div>
                    </div>

                    {/* Expectancy */}
                    <div className="relative p-3 rounded-2xl bg-white/[0.01] border border-white/5">
                        {bestFlags.expectancy && <BestBadge />}
                        <div className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">{t("metrics.expectancy")}</div>
                        <div className="text-sm font-black text-white">{metrics.expectancy.toFixed(2)}</div>
                    </div>

                    {/* Max Drawdown */}
                    <div className="relative p-3 rounded-2xl bg-white/[0.01] border border-white/5">
                        {bestFlags.maxDrawdown && <BestBadge />}
                        <div className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">{t("metrics.maxDrawdown")}</div>
                        <div className="text-sm font-black text-red-400">{Math.abs(metrics.maxDrawdown).toFixed(1)}%</div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-3px); }
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
