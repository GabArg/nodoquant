"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { useTranslations, useLocale } from "next-intl";

interface PublishModalProps {
    reportId: string;
    metrics: {
        score: number;
        win_rate: number;
        profit_factor: number;
        trades: number;
        symbol?: string;
        market?: string;
    };
    onClose: () => void;
}

export default function PublishModal({ reportId, metrics, onClose }: PublishModalProps) {
    const t = useTranslations("fullReport.publishModal");
    const locale = useLocale();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [market, setMarket] = useState(metrics.market || "Forex");
    const [symbol, setSymbol] = useState(metrics.symbol || "");
    const [visibility, setVisibility] = useState<"public" | "private" | "unlisted">("public");
    const [isPublishing, setIsPublishing] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handlePublish = async () => {
        if (!name) {
            setError(t("errorRequired"));
            return;
        }

        setIsPublishing(true);
        setError("");

        try {
            const res = await fetch("/api/strategies/publish", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    report_id: reportId,
                    strategy_name: name,
                    description,
                    visibility,
                    market,
                    symbol,
                    score: metrics.score,
                    win_rate: metrics.win_rate,
                    profit_factor: metrics.profit_factor,
                    trades_count: metrics.trades,
                    expectancy: (metrics as any).expectancy_r || (metrics as any).expectancy || 0,
                    max_drawdown: (metrics as any).max_drawdown || 0,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || t("errorFailed"));
            }

            // Track strategy publish
            trackEvent('strategy_publish', {
                report_id: reportId,
                strategy_name: name,
                market,
                symbol,
                visibility,
                ...metrics
            });

            // Redirect to the new public strategy page
            router.push(`/${locale}/strategy/${data.slug}`);
        } catch (err: any) {
            setError(err.message);
            setIsPublishing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0A0D14] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-indigo-500/10 to-transparent">
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tight">{t("title")}</h2>
                        <p className="text-xs text-gray-500 font-medium">{t("subtitle")}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-xl">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold animate-shake">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{t("nameLabel")}</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t("namePlaceholder")}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-gray-700"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{t("descLabel")}</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t("descPlaceholder")}
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none placeholder:text-gray-700"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{t("marketLabel")}</label>
                            <div className="relative">
                                <select
                                    value={market}
                                    onChange={(e) => setMarket(e.target.value)}
                                    className="w-full bg-[#0A0D14] border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="Forex">{t("markets.Forex")}</option>
                                    <option value="Crypto">{t("markets.Crypto")}</option>
                                    <option value="Futures">{t("markets.Futures")}</option>
                                    <option value="Stocks">{t("markets.Stocks")}</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{t("symbolLabel")}</label>
                            <input
                                type="text"
                                value={symbol}
                                onChange={(e) => setSymbol(e.target.value)}
                                placeholder={t("symbolPlaceholder")}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-gray-700 uppercase"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">{t("visibilityLabel")}</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setVisibility("public")}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 text-center group ${visibility === "public" ? "border-indigo-500 bg-indigo-500/10" : "border-white/5 bg-white/2"
                                    }`}
                            >
                                <svg className={`w-5 h-5 ${visibility === "public" ? "text-indigo-400" : "text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h4.5m-3.935 9a2 2 0 01-1.065-2.572 2 2 0 011.065-2.572" />
                                </svg>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${visibility === "public" ? "text-white" : "text-gray-500"}`}>{t("publicProfile")}</span>
                            </button>
                            <button
                                onClick={() => setVisibility("private")}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 text-center group ${visibility === "private" ? "border-indigo-500 bg-indigo-500/10" : "border-white/5 bg-white/2"
                                    }`}
                            >
                                <svg className={`w-5 h-5 ${visibility === "private" ? "text-indigo-400" : "text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${visibility === "private" ? "text-white" : "text-gray-500"}`}>{t("privateProfile")}</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-indigo-600/5 border border-indigo-500/10 rounded-2xl p-4 flex items-start gap-3">
                        <svg className="w-4 h-4 text-indigo-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                            {t("infoBox")}
                        </p>
                    </div>
                </div>

                <div className="p-6 border-t border-white/5 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-all"
                    >
                        {t("cancel")}
                    </button>
                    <button
                        onClick={handlePublish}
                        disabled={isPublishing}
                        className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${isPublishing ? "bg-indigo-600/50 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
                            }`}
                    >
                        {isPublishing ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                {t("publishing")}
                            </>
                        ) : (
                            t("confirm")
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
