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
        <section
            className="py-12 border-y border-white/[0.03] bg-black"
        >
            <div className="container px-4">
                <div className="flex flex-col items-center">
                    <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-12 text-center">
                        {t("title")}
                    </h3>

                    <div className="flex flex-wrap justify-center items-center gap-x-20 gap-y-16">
                        {PLATFORMS.map((platform) => (
                            <div
                                key={platform.name}
                                className="flex items-center justify-center group"
                                style={{
                                    height: "80px",
                                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                                }}
                            >
                                {platform.logo ? (
                                    <div className="relative flex items-center justify-center opacity-60 group-hover:opacity-100 transition-all duration-300 transform group-hover:-translate-y-1">
                                        <img
                                            src={platform.logo}
                                            alt={platform.name}
                                            style={{
                                                height: `${48 * (platform.scale || 1.0)}px`,
                                                width: "auto",
                                                maxWidth: platform.name === 'FTMO' ? '240px' : '200px',
                                                objectFit: "contain",
                                            }}
                                            className="transition-all duration-300"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 opacity-40 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-300">
                                        <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                            {platform.name}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <p className="mt-12 text-center text-[10px] text-gray-600 font-bold uppercase tracking-widest max-w-sm mx-auto opacity-50">
                        {t("helper")}
                    </p>
                </div>
            </div>
        </section>
    );
}
