"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

interface StrategyCardProps {
    strategy: {
        slug: string;
        strategy_name: string;
        score: number;
        market: string;
        symbol: string;
        win_rate: number;
        profit_factor: number;
        trades_count: number;
        tier?: string;
        published_at: string;
    };
    locale: string;
}

export default function StrategyCard({ strategy, locale }: StrategyCardProps) {
    const t = useTranslations("strategies.card");
    const tCommon = useTranslations("fullReport.publishModal");
    
    const {
        slug,
        strategy_name,
        score,
        tier,
        market,
        symbol,
        win_rate,
        profit_factor,
        trades_count,
        published_at
    } = strategy;

    const wr = win_rate > 1 ? win_rate : win_rate * 100;

    let scoreColor = "text-emerald-400";
    let scoreBg = "bg-emerald-500/10";
    if (score < 40) {
        scoreColor = "text-red-400";
        scoreBg = "bg-red-500/10";
    } else if (score < 70) {
        scoreColor = "text-amber-400";
        scoreBg = "bg-amber-500/10";
    }

    return (
        <Link
            href={`/${locale}/strategy/${slug}`}
            className="group block bg-[#0A0D14] border border-white/5 rounded-2xl overflow-hidden hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 transform hover:-translate-y-1"
        >
            <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap gap-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg w-fit shadow-sm flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
                                {tCommon(`markets.${market}`) || market}
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg w-fit">
                                {symbol}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1 uppercase tracking-tight">
                            {strategy_name}
                        </h3>
                    </div>
                    <div className={`w-14 h-14 rounded-2xl ${scoreBg} flex flex-col items-center justify-center border border-white/5 shadow-inner`}>
                        <span className={`text-xl font-black ${scoreColor}`}>{Math.round(score)}</span>
                        <span className="text-[8px] font-bold uppercase text-gray-500/80">{t("score")}</span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-4 border-y border-white/5">
                    <div className="text-center">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter mb-1">{t("winRate")}</p>
                        <p className="text-sm font-bold text-white tracking-tight">{wr.toFixed(1)}%</p>
                    </div>
                    <div className="text-center border-x border-white/5">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter mb-1">{t("profitFactor")}</p>
                        <p className="text-sm font-bold text-white tracking-tight">{profit_factor.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter mb-1">{t("trades")}</p>
                        <p className="text-sm font-bold text-white tracking-tight">{trades_count}</p>
                    </div>
                </div>

                {tier && (
                    <div className="mt-4 px-3 py-1 bg-white/5 border border-white/5 rounded-lg inline-block text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        {tier}
                    </div>
                )}

                <div className="mt-5 flex justify-between items-center text-[10px] font-bold text-gray-500/60 uppercase tracking-tighter">
                    <span>{t("publishedAt", { date: new Date(published_at).toLocaleDateString() })}</span>
                    <span className="group-hover:text-indigo-400 transition-colors flex items-center gap-1">
                        {t("viewAnalysis")}
                        <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                        </svg>
                    </span>
                </div>
            </div>
        </Link>
    );
}
