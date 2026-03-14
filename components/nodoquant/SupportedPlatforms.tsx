"use client";

import { useTranslations } from "next-intl";

import { brokers } from '@/data/brokers';

const PLATFORMS = [
    ...brokers,
    { name: "CSV", logo: null } 
];

export default function SupportedPlatforms() {
    const t = useTranslations("platforms");

    return (
        <section className="py-20 border-y border-white/[0.03] bg-black">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center">
                    <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-12 text-center">
                        {t("title")}
                    </h3>
                    
                    <div className="flex flex-wrap justify-center items-center gap-10 sm:gap-20 opacity-40 hover:opacity-100 transition-opacity duration-700">
                        {PLATFORMS.map((platform) => (
                            <div key={platform.name} className="flex items-center group">
                                {platform.logo ? (
                                    <div className="relative h-7 sm:h-9 w-auto flex items-center grayscale group-hover:grayscale-0 transition-all duration-500 transform group-hover:scale-110">
                                        <img 
                                            src={platform.logo} 
                                            alt={platform.name}
                                            className="h-full w-auto object-contain"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.parentElement?.querySelector('.fallback-text')?.classList.remove('hidden');
                                            }}
                                        />
                                        <span className="fallback-text hidden text-sm font-bold text-gray-400 group-hover:text-white transition-colors">
                                            {platform.name}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 group-hover:scale-110 transition-transform duration-500">
                                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <span className="text-sm font-black text-gray-500 group-hover:text-white transition-all uppercase tracking-widest">
                                            {platform.name}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <p className="mt-12 text-center text-xs text-gray-600 font-bold uppercase tracking-widest max-w-sm mx-auto opacity-60">
                        {t("helper")}
                    </p>
                </div>
            </div>
        </section>
    );
}
