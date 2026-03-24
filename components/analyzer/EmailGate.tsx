"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

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
    onUnlocked,
}: Props) {
    const t = useTranslations("analyzer.gate");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim() || !email.trim()) {
            setError(t("form.errorRequired"));
            return;
        }
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
                    user_email: email,
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
            onUnlocked(email, data.id);
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="form-label" htmlFor="gate-name">{t("form.name")}</label>
                    <input
                        id="gate-name"
                        type="text"
                        className="form-input"
                        placeholder={t("form.namePlaceholder")}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={submitting}
                    />
                </div>
                <div>
                    <label className="form-label" htmlFor="gate-email">{t("form.email")}</label>
                    <input
                        id="gate-email"
                        type="email"
                        className="form-input"
                        placeholder={t("form.emailPlaceholder")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={submitting}
                    />
                </div>

                {error && (
                    <p className="text-xs text-red-400">{error}</p>
                )}

                <button
                    type="submit"
                    className="btn-primary w-full justify-center"
                    disabled={submitting}
                >
                    {submitting ? (
                        <>
                            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 12a9 9 0 11-6.219-8.56" />
                            </svg>
                            {t("form.processing")}
                        </>
                    ) : (
                        <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0110 0v4" />
                            </svg>
                            {t("form.submit")}
                        </>
                    )}
                </button>

                <p className="text-xs text-center" style={{ color: "#4b5563" }}>
                    {t("form.noSpam")}
                </p>
            </form>
        </div>
    );
}
