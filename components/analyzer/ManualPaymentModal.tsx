"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/trackEvent";

interface ManualPaymentModalProps {
    onClose: () => void;
    onSuccess: () => void;
    metadata?: any;
}

type ModalState = "DECISION" | "PAYMENT" | "VERIFYING";

export default function ManualPaymentModal({ onClose, onSuccess, metadata }: ManualPaymentModalProps) {
    const t = useTranslations("manualPayment");
    const [state, setState] = useState<ModalState>("DECISION");

    useEffect(() => {
        // Track modal open
        trackEvent("PAYWALL_OPEN", metadata);
    }, [metadata]);

    const handleContinueToPayment = async () => {
        await trackEvent("UNLOCK_CLICK", metadata);
        setState("PAYMENT");
    };

    const handlePaid = async () => {
        setState("VERIFYING");
        await trackEvent("PRO_ACTIVATED", metadata);
        
        // MVP: Simulate verification delay and then unlock
        setTimeout(() => {
            localStorage.setItem("nodoquant_pro_access", "true");
            onSuccess();
            onClose();
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Container */}
            <div className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[32px] shadow-[0_0_100px_rgba(99,102,241,0.2)] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="p-8 md:p-12">
                    
                    {/* State 1: DECISION */}
                    {state === "DECISION" && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="space-y-4 text-center">
                                <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-4xl shadow-inner">
                                    👁️
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black text-white italic tracking-tight leading-tight uppercase">
                                    {t("decision.title")}
                                </h2>
                            </div>

                            <div className="space-y-4">
                                {Array.isArray(t.raw("decision.points")) && (t.raw("decision.points") as string[]).map((point, i) => (
                                    <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 transition-colors hover:bg-white/[0.04]">
                                        <span className="text-indigo-500 font-black mt-0.5">→</span>
                                        <p className="text-sm md:text-base font-bold text-gray-300">{point}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="text-center space-y-2">
                                <p className="text-sm font-black text-indigo-400 uppercase tracking-widest italic font-medium">
                                    {t("decision.hook")}
                                </p>
                                <div className="py-6">
                                    <div className="text-5xl font-black text-white italic tracking-tighter">
                                        {t("decision.price")}
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mt-2">
                                        {t("decision.footer")}
                                    </p>
                                </div>
                            </div>

                            <button 
                                onClick={handleContinueToPayment}
                                className="w-full py-6 rounded-3xl bg-indigo-600 hover:bg-indigo-500 text-white text-[15px] font-black uppercase tracking-[0.2em] shadow-[0_20px_50px_-10px_rgba(99,102,241,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {t("decision.cta")}
                            </button>
                        </div>
                    )}

                    {/* State 2: PAYMENT */}
                    {state === "PAYMENT" && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <div className="text-center space-y-2">
                                <h2 className="text-xl font-black text-white uppercase tracking-widest italic">{t("payment.title")}</h2>
                                <div className="flex justify-center gap-4">
                                    <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                        {t("payment.amount")}
                                    </span>
                                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                                        {t("payment.network")}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-black/50 border border-white/10 rounded-3xl p-8 space-y-6 flex flex-col items-center">
                                {/* Simplified QR Placeholder */}
                                <div className="w-48 h-48 bg-white p-4 rounded-2xl shadow-2xl">
                                    <div className="w-full h-full border-4 border-black/5 flex items-center justify-center text-[10px] text-black font-black uppercase text-center leading-none tracking-tighter opacity-20 select-none">
                                        USDT TRC20<br/>QR-CODE<br/>GENERATED<br/>DYN
                                    </div>
                                </div>
                                <div className="w-full space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 block text-center">Wallet TRC20 Address</span>
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 font-mono text-xs text-indigo-300 break-all text-center select-all cursor-pointer hover:bg-white/10 transition-colors">
                                        {t("payment.address")}
                                    </div>
                                </div>
                            </div>

                            <div className="text-center space-y-4">
                                <p className="text-sm font-bold text-gray-300 leading-relaxed px-4">
                                    {t("payment.instruction")}
                                    <br/>
                                    <span className="text-indigo-400">{t("payment.confirmation")}</span>
                                </p>
                            </div>

                            <div className="space-y-6">
                                <button 
                                    onClick={handlePaid}
                                    className="w-full py-6 rounded-3xl bg-emerald-600 hover:bg-emerald-500 text-white text-[15px] font-black uppercase tracking-[0.2em] shadow-[0_20px_50px_-10px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {t("payment.cta")}
                                </button>
                                
                                <div className="flex flex-col items-center gap-2 text-center">
                                    <p className="text-[11px] font-black text-indigo-400 uppercase tracking-widest animate-pulse">
                                        {t("payment.urgency1")}
                                    </p>
                                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                                        {t("payment.urgency2")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* State 3: VERIFYING */}
                    {state === "VERIFYING" && (
                        <div className="py-20 flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-1000">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center text-2xl">⏳</div>
                            </div>
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">{t("verifying.title")}</h2>
                                <p className="text-sm font-medium text-gray-500">{t("verifying.subtitle")}</p>
                            </div>
                        </div>
                    )}

                </div>

                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
    );
}
