"use client";

import React, { useEffect, useState } from "react";
import BasicResults from "@/components/analyzer/BasicResults";
import FullReport from "@/components/analyzer/FullReport";
import type { BasicMetrics, FullMetrics } from "@/lib/analyzer/metrics";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface PublicReportProps {
    id: string;
    file_name: string | null;
    trades_count: number;
    winrate: number;
    profit_factor: number;
    max_drawdown: number;
    sum_profit: number; // Might not be saved in root, but metrics_json has it
    metrics_json: FullMetrics;
    created_at: string;
}

export default function PublicReportView({ report }: { report: PublicReportProps }) {
    const t = useTranslations("publicReport");
    const [isProAccess, setIsProAccess] = useState(false);

    useEffect(() => {
        setIsProAccess(localStorage.getItem("nodoquant_pro_access") === "true");
    }, []);

    // Extract basic metrics from the root column or deep json if possible
    const basicMetrics: BasicMetrics = {
        totalTrades: report.trades_count,
        winrate: report.winrate,
        profitFactor: report.profit_factor,
        maxDrawdown: report.max_drawdown,
        maxDrawdownAbs: 0,
        expectancy: report.metrics_json?.expectancy || 0,
        sumProfit: report.metrics_json?.expectancy ? (report.metrics_json.expectancy * report.trades_count) : 0, 
    };

    return (
        <div className="w-full min-h-screen bg-[#050505] text-white pt-24 pb-32">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-16">
                
                {/* 1. Unlisted Header Banner */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-sm">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded bg-indigo-500/20 text-indigo-400">👁️</span>
                        <div>
                            <p className="font-semibold text-indigo-100">{t("header.title")}</p>
                            <p className="text-[10px] text-indigo-300">{t("header.subtitle")}</p>
                        </div>
                    </div>
                </div>

                {/* 2. Basic Results Header (Without viewFullReport action) */}
                <BasicResults
                    metrics={basicMetrics}
                    fullMetrics={report.metrics_json}
                    format="ANALYSIS"
                    fileName={report.file_name || t("defaultFileName")}
                    trades={[]}
                />

                {/* 2.5 Emotional Hook Banner */}
                <div className="text-center p-4 rounded-xl border border-red-500/20 bg-red-500/5 relative overflow-hidden -mt-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0"></div>
                    <div className="relative font-medium text-red-100 text-sm md:text-base">
                        {t.rich("hook", {
                            bold: (chunks) => <strong className="text-red-400 italic font-black">{chunks}</strong>
                        })}
                    </div>
                </div>

                {/* 3. The Full Report Body (Read-Only) */}
                <div className="mt-16">
                    <FullReport
                        metrics={report.metrics_json}
                        trades={[]} // Omitted for public view to reduce payload
                        email={t("anonymousUser")}
                        analysisId={report.id}
                        isPro={isProAccess} // Simulated mock paywall logic
                        isInComparison={false}
                    />
                </div>

                {/* 4. Viral Growth CTA Block (Crucial) */}
                <div className="mt-32 pt-16 border-t border-white/5 flex flex-col items-center text-center space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.3)] mb-2">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" />
                        </svg>
                    </div>
                    
                    <h2 className="text-2xl sm:text-4xl font-black italic tracking-tight text-white mb-2 leading-none uppercase">
                        {t("ctaTitle")} <br className="hidden sm:block" />
                        <span className="text-red-400">{t("ctaWarning")}</span>
                    </h2>
                    
                    <p className="text-sm text-gray-400 max-w-lg mx-auto leading-relaxed font-medium">
                        {t("urgency")}
                    </p>

                    <div className="pt-6 flex flex-col items-center gap-2 w-full sm:w-auto">
                        <Link href="/analyzer" onClick={() => console.log("CTA_CLICK_ANALYZER")} className="px-10 py-5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_10px_40px_-10px_rgba(99,102,241,0.6)] hover:scale-105 transition-all active:scale-95">
                            {t("cta")}
                        </Link>
                        
                        <div className="flex flex-col items-center mt-6">
                            <span className="opacity-40 text-xs font-semibold text-gray-300 tracking-wider">
                                {t("socialProof")}
                            </span>
                            <Link href="/" className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600 hover:text-indigo-400 mt-3 transition-colors">
                                {t("poweredBy")}
                            </Link>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
