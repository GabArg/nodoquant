"use client";

import React from "react";
import Link from "next/link";
import { useLocale } from "next-intl";

interface Props {
    title: string;
    description: string;
    isPro: boolean;
    children: React.ReactNode;
}

export default function ProLockOverlay({ title, description, isPro, children }: Props) {
    const locale = useLocale();

    if (isPro) {
        return <>{children}</>;
    }

    return (
        <div className="relative overflow-hidden rounded-2xl group">
            {/* The blurred content (The "Tease" Effect) */}
            <div className="filter blur-sm opacity-[0.45] select-none pointer-events-none transition-all duration-500">
                {children}
            </div>

            {/* The Lock Overlay (Minimalist Typography-First Style) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-black/5 backdrop-blur-[2px]">
                <div className="max-w-xs text-center">
                    <h3 className="text-lg font-bold text-white mb-3 tracking-tight">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-400 font-medium leading-relaxed mb-6">
                        {description}
                    </p>
                    <Link href={`/${locale}/pricing`}
                        className="inline-flex items-center justify-center px-6 py-2.5 bg-white text-black text-sm font-bold rounded-lg transition-all hover:bg-gray-200 active:scale-95">
                        Unlock Analysis
                    </Link>
                </div>
            </div>
        </div>
    );
}
