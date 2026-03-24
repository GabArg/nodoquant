"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";

interface Props {
    metricsPayload: object;
    basicMetrics: {
        trades_count: number;
        winrate: number;
        profit_factor: number;
        max_drawdown: number;
        sum_profit: number;
    };
    fileName?: string;
    dateRangeStart?: string;
    dateRangeEnd?: string;
    strategyId?: string;
    datasetName?: string;
    isAuthenticated: boolean;
    onUnlocked: (email: string, id: string) => void;
}

export default function EmailGate({
    metricsPayload,
    basicMetrics,
    fileName,
    dateRangeStart,
    dateRangeEnd,
    strategyId,
    datasetName,
    isAuthenticated,
    onUnlocked,
}: Props) {
    const t = useTranslations("analyzer.gate");
    const locale = useLocale();
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Auto-unlock if authenticated
    useEffect(() => {
        if (isAuthenticated && !submitting) {
            handleUnlock();
        }
    }, [isAuthenticated]);

    async function handleUnlock() {
        setError(null);
        setSubmitting(true);

        try {
            const res = await fetch("/api/analyzer/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    trades_count: basicMetrics.trades_count,
                    winrate: basicMetrics.winrate,
                    profit_factor: basicMetrics.profit_factor,
                    max_drawdown: basicMetrics.max_drawdown,
                    metrics_json: metricsPayload,
                    file_name: fileName,
                    date_range_start: dateRangeStart,
                    date_range_end: dateRangeEnd,
                    sum_profit: basicMetrics.sum_profit,
                    strategy_id: strategyId || null,
                    dataset_name: datasetName || 'Dataset',
                }),
            });
            const data = await res.json();
            if (!data.ok) {
                // If the API provided a specific reason string, use it
                const errorMsg = data.reason || data.error || t("form.errorSave");
                throw new Error(errorMsg);
            }
            onUnlocked("", data.id);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : t("form.errorNetwork"));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="w-full max-w-xl mx-auto mt-10">
            {/* Teaser of locked content */}
            <div className="relative rounded-2xl overflow-hidden mb-6"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                {/* Blurred preview rows */}
                <div className="px-6 py-5 select-none" style={{ filter: "blur(4px)", pointerEvents: "none" }}>
                    {[0, 1, 2, 3].map((idx) => (
                        <div key={idx} className="flex justify-between items-center py-3"
                            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <span className="text-sm text-gray-400">{t(`teaserLabels.${idx}`)}</span>
                            <span className="text-sm font-semibold text-white">██████</span>
                        </div>
                    ))}
                </div>
                {/* Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center"
                    style={{ background: "linear-gradient(to bottom, rgba(10,10,15,0.3) 0%, rgba(10,10,15,0.85) 60%)" }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                        style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                    </div>
                    <p className="text-sm font-semibold text-white">{t("title")}</p>
                    <p className="text-xs mt-1" style={{ color: "#6b7280" }}>
                        {t("subtitle")}
                    </p>
                </div>
            </div>

            {/* Auth Actions */}
            {isAuthenticated ? (
                <div className="w-full text-center py-8">
                    <div className="w-8 h-8 mx-auto border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest animate-pulse">
                        {error ? <span className="text-red-400">{error}</span> : "Generando reporte profesional..."}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <button
                        onClick={() => router.push(`/${locale}/signup`)}
                        className="btn-primary w-full justify-center text-[12px] py-4 shadow-[0_10px_30px_-10px_rgba(99,102,241,0.5)]"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mr-2">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        CREAR CUENTA PARA DESBLOQUEAR
                    </button>

                    <p className="text-xs text-center text-gray-400 font-medium">
                        ¿Ya tienes una cuenta?{" "}
                        <button onClick={() => router.push(`/${locale}/login`)} className="text-indigo-400 hover:text-indigo-300 transition-colors">
                            Inicia sesión aquí
                        </button>
                    </p>
                    
                    {error && <p className="text-xs text-red-400 text-center">{error}</p>}
                </div>
            )}
        </div>
    );
}
