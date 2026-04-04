"use client";

import React, { useEffect } from "react";
import { useTranslations } from "next-intl";

interface UnlockProProps {
    onClose: () => void;
}

export default function UnlockPro({ onClose }: UnlockProProps) {
    const t = useTranslations("paywall");

    useEffect(() => {
        console.log("PAYWALL_OPEN");
    }, []);

    const handleUnlock = () => {
        console.log("PRO_ACTIVATED");
        localStorage.setItem("nodoquant_pro_access", "true");
        window.location.reload();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop Blur overlay */}
            <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-[0_0_80px_rgba(99,102,241,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="p-8 space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-3">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-red-500/20 to-red-900/20 border border-red-500/30 flex items-center justify-center mb-4">
                            <span className="text-2xl">🔒</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-white italic tracking-tight">
                            {t("title")}
                        </h2>
                        <p className="text-sm font-medium text-gray-400 leading-relaxed">
                            {t("subtitle")}
                        </p>
                    </div>

                    {/* Features block */}
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                            {t("featuresTitle")}
                        </h3>
                        <ul className="space-y-3">
                            {(t.raw("features") as string[]).map((feature, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm font-medium text-gray-300">
                                    <span className="text-indigo-500">✓</span>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Payment Simulation Area */}
                    <div className="space-y-4">
                        <div className="text-center space-y-2">
                            <h3 className="text-sm font-bold text-white">{t("activateTitle")}</h3>
                            <p className="text-xs text-gray-400">
                                {t.rich("activateSubtitle", {
                                    bold: (chunks) => <strong className="text-white">{chunks}</strong>
                                })}
                            </p>
                        </div>
                        
                        <div className="bg-black/50 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{t("network")}</span>
                            <code className="text-sm text-emerald-400 font-mono text-center break-all">
                                TU_WALLET_AQUI
                            </code>
                        </div>

                        <button 
                            onClick={handleUnlock}
                            className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-[0.2em] shadow-[0_10px_40px_-5px_rgba(99,102,241,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {t("cta")}
                        </button>
                        
                        <p className="text-[10px] text-center text-gray-500 tracking-widest italic pt-2 font-medium">
                            {t("footer")}
                        </p>
                    </div>
                </div>
                
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
    );
}
