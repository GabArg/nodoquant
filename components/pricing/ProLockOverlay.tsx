"use client";

import React from "react";
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
            <div className="flex min-h-48 flex-col items-center justify-center p-8 bg-white/[0.02] border border-white/5">
                <div className="max-w-xs text-center">
                    <h3 className="text-lg font-bold text-white mb-3 tracking-tight">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-400 font-medium leading-relaxed mb-3">
                        {description}
                    </p>
                    <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">
                        {locale === "es" ? "Módulo avanzado · Próximamente" : "Advanced module · Coming soon"}
                    </p>
                </div>
            </div>
        </div>
    );
}
