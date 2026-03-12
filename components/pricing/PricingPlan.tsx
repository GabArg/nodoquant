"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";

interface PricingPlanProps {
    isPro?: boolean;
}

export default function PricingPlan({ isPro = false }: PricingPlanProps) {
    const t = useTranslations("pricing");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUpgrade = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/payments/create-checkout", { method: "POST" });
            const data = await res.json();
            if (data.checkout_url) {
                window.location.href = data.checkout_url;
            } else {
                setError(data.error || t("errorCheckout"));
                setLoading(false);
            }
        } catch (e) {
            setError(t("errorNetwork"));
            setLoading(false);
        }
    };

    return (
        <div className="py-24 max-w-5xl mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 text-balance">
                {t.rich("title", {
                    brand: (chunks) => <span className="text-indigo-400">{chunks}</span>
                })}
            </h1>
            <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
                {t("desc")}
            </p>

            {error && (
                <div className="max-w-md mx-auto mb-8 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                    {error}
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
                {/* Free Plan */}
                <div className="rounded-3xl p-8 border border-white/10 bg-[#111118]">
                    <h3 className="text-xl font-bold text-white mb-2">{t("free.name")}</h3>
                    <div className="text-3xl font-black text-white mb-6">$0<span className="text-lg text-gray-500 font-medium">/{t("month")}</span></div>
                    <ul className="space-y-4 mb-8 text-gray-300 text-sm">
                        {t.raw("free.features").map((feature: string, i: number) => (
                            <li key={i} className={`flex gap-3 items-start ${i > 2 ? 'opacity-50' : ''}`}>
                                <span className={`${i > 2 ? 'text-gray-600' : 'text-emerald-400'} mt-0.5`}>
                                    {i > 2 ? '✗' : '✓'}
                                </span> 
                                {feature}
                            </li>
                        ))}
                    </ul>
                    <button disabled className="w-full py-3 rounded-xl bg-white/5 text-gray-400 font-semibold cursor-not-allowed">
                        {isPro ? t("basePlan") : t("currentPlan")}
                    </button>
                </div>

                {/* Pro Plan */}
                <div className="rounded-3xl p-8 border border-indigo-500/40 bg-indigo-500/5 relative overflow-hidden ring-2 ring-indigo-500 shadow-[0_0_50px_rgba(99,102,241,0.2)]">
                    <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl tracking-wider">
                        {t("recommended")}
                    </div>
                    <h3 className="text-xl font-bold text-indigo-300 mb-2">{t("pro.name")}</h3>
                    <div className="text-3xl font-black text-white mb-1">$19.99<span className="text-lg text-gray-400 font-medium">/{t("month")}</span></div>
                    <p className="text-xs text-gray-500 mb-6">{t("cancelAnytime")}</p>
                    <ul className="space-y-4 mb-8 text-white text-sm">
                        {t.raw("pro.features").map((feature: string, i: number) => (
                            <li key={i} className="flex gap-3 items-start">
                                <span className="text-emerald-400 mt-0.5">✓</span> 
                                {feature}
                            </li>
                        ))}
                    </ul>
                    {isPro ? (
                        <div className="w-full py-3 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-center">
                            ✓ {t("activePlan")}
                        </div>
                    ) : (
                        <button
                            onClick={handleUpgrade}
                            disabled={loading}
                            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-500/25 flex justify-center items-center gap-2 disabled:opacity-70"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : t("upgradeBtn")}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
