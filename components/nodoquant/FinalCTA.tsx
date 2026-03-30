import { useTranslations } from "next-intl";

export default function FinalCTA() {
    const t = useTranslations("finalCta");
    const tCommon = useTranslations("common");

    return (
        <section className="py-[120px] relative overflow-hidden bg-black" id="start">
            <div className="absolute inset-0 bg-indigo-900/[0.05] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-6xl h-full bg-indigo-500/[0.03] blur-[150px] rounded-full pointer-events-none" />

            <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10 border border-white/[0.05] rounded-[56px] p-12 sm:p-24 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] bg-gradient-to-b from-white/[0.03] to-transparent backdrop-blur-xl overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
                
                <p className="text-indigo-400 font-black tracking-[0.3em] uppercase text-xs mb-8 animate-fade-in group-hover:tracking-[0.4em] transition-all duration-700">
                    {t("label")}
                </p>

                <h2 className="text-4xl sm:text-6xl font-black text-white mb-8 leading-tight tracking-tight animate-fade-in">
                    {t("title")}
                </h2>

                <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto font-medium leading-relaxed animate-fade-in">
                    {t("desc")}
                </p>

                <div className="flex flex-col items-center justify-center gap-6 animate-fade-in">
                    <a href="/analyzer" className="btn-primary inline-flex items-center gap-4 px-12 py-6 text-lg font-black uppercase tracking-widest transition-all hover:scale-[1.05] active:scale-95 shadow-[0_20px_50px_rgba(79,70,229,0.4)] hover:shadow-[0_25px_60px_rgba(79,70,229,0.6)] group">
                        {tCommon("analyzeCta")}
                        <svg className="w-6 h-6 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </a>
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] animate-pulse">
                            {t("note")}
                        </p>
                        <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mt-1">
                            {t("pressure")}
                        </p>
                        <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.2em] opacity-40">
                            {tCommon("ctaSubtext")}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
