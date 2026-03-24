"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface PerformanceBreakdownProps {
    symbolData?: any[];
    sessionData?: any[];
    weekdayData?: any[];
}

export default function PerformanceBreakdown({ symbolData = [], sessionData = [], weekdayData = [] }: PerformanceBreakdownProps) {
    const t = useTranslations("analyzer.performanceBreakdown");
    const [activeTab, setActiveTab] = useState<"symbol" | "session" | "weekday">("symbol");

    const renderTable = (data: any[], keyName: string) => {
        if (!data || data.length === 0) {
            return <div className="p-4 text-center text-gray-500">{t("insufficientData")}</div>;
        }

        return (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                    <thead className="text-xs uppercase bg-white/5 text-gray-400">
                        <tr>
                            <th className="px-4 py-3">{keyName}</th>
                            <th className="px-4 py-3">{t("trades")}</th>
                            <th className="px-4 py-3">{t("winRate")}</th>
                            <th className="px-4 py-3">{t("expectancy")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <tr key={i} className="border-b border-white/5">
                                <td className="px-4 py-3 font-medium text-white">{row.name}</td>
                                <td className="px-4 py-3">{row.trades}</td>
                                <td className={`px-4 py-3 ${row.win_rate > 0.5 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {(row.win_rate * 100).toFixed(1)}%
                                </td>
                                <td className={`px-4 py-3 ${row.expectancy > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {row.expectancy.toFixed(2)}R
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="card p-6 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h3 className="text-lg font-semibold text-white">{t("title")}</h3>

                <div className="flex space-x-2 mt-4 sm:mt-0 bg-black/40 p-1 rounded-lg border border-white/10">
                    <button
                        onClick={() => setActiveTab("symbol")}
                        className={`px-4 py-1.5 rounded-md text-sm transition-colors ${activeTab === "symbol" ? "bg-indigo-600/50 text-white" : "text-gray-400 hover:text-white"}`}
                    >
                        {t("tabs.symbol")}
                    </button>
                    <button
                        onClick={() => setActiveTab("session")}
                        className={`px-4 py-1.5 rounded-md text-sm transition-colors ${activeTab === "session" ? "bg-indigo-600/50 text-white" : "text-gray-400 hover:text-white"}`}
                    >
                        {t("tabs.session")}
                    </button>
                    <button
                        onClick={() => setActiveTab("weekday")}
                        className={`px-4 py-1.5 rounded-md text-sm transition-colors ${activeTab === "weekday" ? "bg-indigo-600/50 text-white" : "text-gray-400 hover:text-white"}`}
                    >
                        {t("tabs.weekday")}
                    </button>
                </div>
            </div>

            {activeTab === "symbol" && renderTable(symbolData, t("columns.symbol"))}
            {activeTab === "session" && renderTable(sessionData, t("columns.session"))}
            {activeTab === "weekday" && renderTable(weekdayData, t("columns.weekday"))}
        </div>
    );
}
