import { useTranslations } from "next-intl";

export default function WhyQuant() {
    const t = useTranslations("whyQuant");

    return (
        <section className="py-[120px] border-t border-white/[0.03] bg-[#050505]" id="why">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-20 animate-fade-in text-balance">
                    <p className="section-label mb-6 inline-block">{t("label")}</p>
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight">
                        {t("title")}
                    </h2>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto font-medium">
                        {t("desc")}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white/[0.02] border border-white/[0.05] p-10 rounded-[40px] group hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/0 group-hover:bg-indigo-500/20 transition-all" />
                            
                            <div className="w-16 h-16 bg-indigo-500/10 rounded-[24px] flex items-center justify-center mb-10 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.1)] group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-500">
                                {i === 1 && (
                                    <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                                {i === 2 && (
                                    <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                )}
                                {i === 3 && (
                                    <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                    </svg>
                                )}
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-indigo-300 transition-colors tracking-tight">
                                {t(`r${i}_title`)}
                            </h3>
                            <p className="text-gray-400 leading-relaxed font-medium">
                                {t(`r${i}_desc`)}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-20 text-center animate-fade-in scale-110">
                    <a href="/analyzer" className="btn-primary inline-flex items-center gap-3 px-10 py-5 text-sm font-black uppercase tracking-[0.15em] transition-all hover:scale-105 active:scale-95 shadow-[0_20px_40px_-10px_rgba(99,102,241,0.4)]">
                        {t("cta")}
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </a>
                    <p className="mt-8 text-[10px] text-gray-600 font-black uppercase tracking-[0.3em] opacity-60">
                        {t("cta_note")}
                    </p>
                </div>
            </div>
        </section>
    );
}
