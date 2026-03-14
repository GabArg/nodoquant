"use client";

import React from "react";
import { useTranslations } from "next-intl";

interface TrialBannerProps {
    daysRemaining: number;
    plan: string;
}

export default function TrialBanner({ daysRemaining, plan }: TrialBannerProps) {
    const t = useTranslations("common");

    if (plan !== "pro_trial") return null;

    return (
        <div className="w-full bg-gradient-to-r from-indigo-600 to-violet-700 py-2.5 px-4 text-center">
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
                <span className="text-sm font-bold text-white tracking-wide">
                    🎁 You are currently using <span className="underline decoration-indigo-300 underline-offset-4 decoration-2">PRO features</span> during your 30-day trial.
                </span>
                <div className="h-4 w-px bg-white/20 mx-1 hidden sm:block" />
                <span className="bg-white/10 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-widest text-white border border-white/20">
                    {daysRemaining} days of PRO remaining
                </span>
            </div>
        </div>
    );
}
