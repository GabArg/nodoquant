"use client";

import { ReactNode } from "react";

interface Props {
    isPro: boolean;
    children: ReactNode;
    featureName: string;
}

export default function ReportAccessGuard({ isPro, children, featureName }: Props) {
    if (isPro) return <>{children}</>;

    return (
        <div className="relative group">
            {/* Blurred content preview */}
            <div className="filter blur-md pointer-events-none select-none opacity-40">
                {children}
            </div>
            
            {/* Lock Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/5 rounded-2xl border border-white/5">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">{featureName} bloqueado</h4>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">Disponible en NodoQuant Pro</p>
            </div>
        </div>
    );
}
