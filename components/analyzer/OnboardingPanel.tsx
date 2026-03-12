"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";

interface Props {
    importSource?: "csv" | "mt4" | "mt5" | "binance" | null;
}

export default function OnboardingPanel({ importSource }: Props) {
    const t = useTranslations("analyzer.onboarding");

    const SOURCE_CONFIG = useMemo(() => ({
        mt4: {
            icon: "📁",
            step1: t("sources.mt4.label"),
            step1Detail: t("sources.mt4.detail"),
            badge: t("sources.mt4.badge"),
        },
        mt5: {
            icon: "📁",
            step1: t("sources.mt5.label"),
            step1Detail: t("sources.mt5.detail"),
            badge: t("sources.mt5.badge"),
        },
        binance: {
            icon: "₿",
            step1: t("sources.binance.label"),
            step1Detail: t("sources.binance.detail"),
            badge: t("sources.binance.badge"),
        },
        csv: {
            icon: "📄",
            step1: t("sources.csv.label"),
            step1Detail: t("sources.csv.detail"),
            badge: t("sources.csv.badge"),
        },
        default: {
            icon: "📊",
            step1: t("sources.default.label"),
            step1Detail: t("sources.default.detail"),
            badge: t("sources.default.badge"),
        },
    }), [t]);

    const TRUST_BADGES = useMemo(() => [
        { icon: "🔒", label: t("trust.noData") },
        { icon: "⚡", label: t("trust.fast") },
        { icon: "🆓", label: t("trust.free") },
    ], [t]);

    const AVATAR_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#3b82f6"];
    const AVATAR_INITIALS = ["TR", "AM", "JC", "KL", "PE"];

    const c = SOURCE_CONFIG[importSource ?? "default"] ?? SOURCE_CONFIG.default;

    return (
        <div className="w-full max-w-2xl mx-auto mb-6 rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>

            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{c.icon}</span>
                    <span className="text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}>
                        {c.badge}
                    </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-2">{t("title")}</h3>
                <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>
                    {t("subtitle")}
                </p>
            </div>

            {/* Steps */}
            <div className="px-6 py-5 space-y-5">
                {[
                    { num: "1", label: c.step1, detail: c.step1Detail },
                    { num: "2", label: t("step2.label"), detail: t("step2.detail") },
                    { num: "3", label: t("step3.label"), detail: t("step3.detail") },
                ].map((s, i) => (
                    <div key={s.num} className="flex gap-4 items-start"
                        style={{ opacity: 0, animation: `fadeSlideIn 0.4s ease ${i * 0.12}s forwards` }}>
                        <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                            style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", color: "#818cf8" }}>
                            {s.num}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">{s.label}</p>
                            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#6b7280" }}>{s.detail}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Trust badges + social proof */}
            <div className="px-6 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t pt-4"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}>

                {/* Trust badges */}
                <div className="flex gap-3 flex-wrap">
                    {TRUST_BADGES.map(b => (
                        <span key={b.label} className="flex items-center gap-1.5 text-xs font-medium"
                            style={{ color: "#4b5563" }}>
                            <span>{b.icon}</span>
                            {b.label}
                        </span>
                    ))}
                </div>

                {/* Social proof */}
                <div className="flex items-center gap-2">
                    <div className="flex -space-x-1.5">
                        {AVATAR_COLORS.map((col, i) => (
                            <div key={i}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white ring-1 ring-black"
                                style={{ background: col }}>
                                {AVATAR_INITIALS[i]}
                            </div>
                        ))}
                    </div>
                    <span className="text-xs" style={{ color: "#6b7280" }}>
                        {t("proof")}
                    </span>
                </div>
            </div>

            <style>{`
                @keyframes fadeSlideIn {
                    from { opacity:0; transform:translateY(6px); }
                    to   { opacity:1; transform:translateY(0); }
                }
            `}</style>
        </div>
    );
}
