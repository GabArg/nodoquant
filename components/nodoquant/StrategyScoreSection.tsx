import { useTranslations } from "next-intl";

export default function StrategyScoreSection() {
    const t = useTranslations("strategyScore");
    const tCommon = useTranslations("common");

    return (
        <section className="py-24 border-t border-white/[0.03] relative overflow-hidden bg-black" id="score">
            {/* Background elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-full bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="container relative z-10">
                <div className="max-w-[720px] mx-auto mb-20 text-center text-balance">
                    <p className="section-label mb-6 inline-block">{t("label")}</p>
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight">
                        {t("title")}
                    </h2>
                    <p className="text-lg text-gray-300 font-medium">
                        {t("desc")}
                    </p>
                </div>

                <div className="max-w-[1100px] mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
                        {[1, 2, 3, 4].map((i) => {
                            let colorClass = "";
                            let glowClass = "";
                            
                            if (i === 1) { colorClass = "text-red-400 border-red-500/20 bg-red-500/5"; glowClass = "shadow-[0_0_30px_rgba(239,68,68,0.05)]"; }
                            if (i === 2) { colorClass = "text-orange-400 border-orange-500/20 bg-orange-500/5"; glowClass = "shadow-[0_0_30px_rgba(249,115,22,0.05)]"; }
                            if (i === 3) { colorClass = "text-indigo-400 border-indigo-500/20 bg-indigo-500/5"; glowClass = "shadow-[0_0_30px_rgba(99,102,241,0.05)]"; }
                            if (i === 4) { colorClass = "text-emerald-400 border-emerald-500/20 bg-emerald-500/5"; glowClass = "shadow-[0_0_30px_rgba(16,185,129,0.05)]"; }

                            return (
                                <div 
                                    key={i} 
                                    className={`flex flex-col h-full p-8 rounded-[32px] border transition-all duration-500 hover:scale-105 group overflow-hidden relative ${colorClass} ${glowClass} hover:border-current/30`}
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-current opacity-20" />
                                    <span className="block text-3xl font-black mb-3 tracking-tighter opacity-80 group-hover:opacity-100 transition-opacity">
                                        {t(`s${i}_range`)}
                                    </span>
                                    <p className="text-sm font-black uppercase tracking-[0.15em] leading-relaxed">
                                        {t(`s${i}_desc`)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-20 text-center animate-fade-in">
                    <a href="/analyzer" className="btn-primary border-none inline-flex items-center gap-3 px-10 py-5 text-sm font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-500/30">
                        {tCommon("analyzeCta")}
                        <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </a>
                </div>
            </div>
        </section>
    );
}
