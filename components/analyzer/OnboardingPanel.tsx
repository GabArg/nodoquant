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
        <div className="w-full max-w-2xl mx-auto mb-10 rounded-3xl overflow-hidden relative group"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            
            {/* Background accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] pointer-events-none transition-opacity group-hover:opacity-20" />

            <div className="px-8 py-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xl">{c.icon}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full"
                                style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}>
                                {c.badge}
                            </span>
                        </div>
                        <h3 className="text-2xl font-black text-white tracking-tight uppercase italic">{t("title")}</h3>
                        <p className="text-xs font-medium mt-1 text-gray-500">
                            {t("subtitle")}
                        </p>
                    </div>
                </div>

                {/* Steps Horizontal Flow */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
                    {[
                        { num: "01", label: c.step1, detail: c.step1Detail, icon: "🔍" },
                        { num: "02", label: t("step2.label"), detail: t("step2.detail"), icon: "📤" },
                        { num: "03", label: t("step3.label"), detail: t("step3.detail"), icon: "📈" },
                    ].map((s, i) => (
                        <div key={s.num} className="relative z-10 animate-fade-in"
                            style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-[10px] font-black text-indigo-500/50 tabular-nums tracking-widest">
                                    {s.num}
                                </span>
                                <div className="h-px flex-1 bg-white/5" />
                            </div>
                            <p className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                <span className="opacity-50 grayscale">{s.icon}</span>
                                {s.label}
                            </p>
                            <p className="text-[11px] leading-relaxed text-gray-500 font-medium">{s.detail}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom bar - Privacy & Proof */}
            <div className="px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5"
                style={{ background: "rgba(255,255,255,0.01)" }}>
                
                <div className="flex items-center gap-6">
                    <span className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <span className="text-emerald-500/50">🔒</span> {t("trust.noData")}
                    </span>
                    <span className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <span className="text-indigo-500/50">⚡</span> {t("trust.fast")}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                        {AVATAR_COLORS.slice(0, 3).map((col, i) => (
                            <div key={i}
                                className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-white border-2 border-[#050505]"
                                style={{ background: col }}>
                                {AVATAR_INITIALS[i]}
                            </div>
                        ))}
                    </div>
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
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
