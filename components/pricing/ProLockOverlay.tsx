"use client";

import React from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";

interface Props {
    title: string;
    description: string;
    isPro: boolean;
    children: React.ReactNode;
}

export default function ProLockOverlay({ title, description, isPro, children }: Props) {
    const t = useTranslations("pricing");
    const locale = useLocale();

    if (isPro) {
        return <>{children}</>;
    }

    return (
        <div className="relative overflow-hidden rounded-2xl group">
            {/* The blurred content */}
            <div className="filter blur-md opacity-40 select-none pointer-events-none transition-all duration-300">
                {children}
            </div>

            {/* The lock overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black/40 backdrop-blur-sm border-2 border-dashed border-indigo-500/30 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0110 0v4"></path>
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-300 text-center max-w-sm mb-6">
                    {description}
                </p>
                <Link href={`/${locale}/pricing`}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors flex items-center gap-2">
                    {t("upgradeBtn")}
                </Link>
            </div>
        </div>
    );
}
