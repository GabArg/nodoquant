"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { BasicMetrics } from "@/lib/analyzer/metrics";

interface Props {
    evolution?: {
        last100?: BasicMetrics;
        last50?: BasicMetrics;
        last30?: BasicMetrics;
    };
}

function EvolColumn({ label, metrics, req }: { label: string; metrics?: BasicMetrics; req: number }) {
    const t = useTranslations("analyzer.report");
    if (!metrics) {
        return (
            <div className="flex-1 p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center opacity-40">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</span>
                <span className="text-[9px] font-medium text-gray-600 mt-2 italic text-center">
                    {t("evolution.reqTrades", { count: req })}
                </span>
            </div>
        );
    }

    return (
        <div className="flex-1 p-4 rounded-2xl bg-white/[0.03] border border-indigo-500/20 flex flex-col items-center">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">{label}</span>
            <div className="space-y-2 w-full">
                <div className="flex justify-between items-center text-[10px]">
                    <span className="text-gray-500 font-bold">PF</span>
                    <span className={`font-black ${metrics.profitFactor >= 1 ? 'text-green-400' : 'text-red-400'}`}>{metrics.profitFactor}</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                    <span className="text-gray-500 font-bold">WR</span>
                    <span className="text-white font-black">{metrics.winrate}%</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                    <span className="text-gray-500 font-bold">DD</span>
                    <span className="text-red-400 font-black">{metrics.maxDrawdown}%</span>
                </div>
            </div>
        </div>
    );
}

export default function StrategyEvolution({ evolution }: Props) {
    const t = useTranslations("analyzer.report");
    return (
        <div className="card rounded-[32px] p-8 border border-white/[0.06] bg-white/[0.01] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[60px] rounded-full -mr-16 -mt-16" />
            
            <div className="flex flex-col mb-8">
                <h3 className="text-xl font-black text-white italic uppercase tracking-tight">{t("evolution.title")}</h3>
                <p className="text-[11px] text-gray-500 font-medium">{t("evolution.desc")}</p>
            </div>

            <div className="flex gap-3">
                <EvolColumn label="Last 100" metrics={evolution?.last100} req={100} />
                <EvolColumn label="Last 50" metrics={evolution?.last50} req={50} />
                <EvolColumn label="Last 30" metrics={evolution?.last30} req={30} />
            </div>
        </div>
    );
}
