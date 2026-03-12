import { useTranslations } from "next-intl";

export default function Hero() {
    const t = useTranslations("home");

    return (
        <section className="relative min-h-[90vh] flex flex-col justify-center pt-20 overflow-hidden bg-black" id="hero">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/4 w-full h-full bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-full h-full bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                    
                    {/* Text Content Column */}
                    <div className="lg:col-span-7 flex flex-col items-start text-left">
                        {/* Label */}
                        <p className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8 bg-white/5 border border-white/10 text-indigo-400 animate-fade-in inline-block">
                            {t("label")}
                        </p>

                        {/* H1 */}
                        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-white mb-8 animate-slide-up leading-[0.95]">
                            {t("title").split(".").map((part, i) => (
                                <span key={i} className={i === 1 ? "text-indigo-500 block sm:inline" : ""}>
                                    {part}{i === 0 ? ". " : ""}
                                </span>
                            ))}
                        </h1>

                        {/* Subtitle / H2 */}
                        <h2 className="text-lg sm:text-2xl text-gray-400 font-medium mb-10 max-w-xl animate-slide-up leading-relaxed text-balance">
                            {t("subtitle")}
                        </h2>

                        {/* CTAs (Order matters for mobile) */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 animate-fade-in mb-10 w-full sm:w-auto">
                            <a href="/analyzer" className="btn-primary w-full sm:w-auto px-10 py-5 text-sm font-black uppercase tracking-widest transition-all hover:scale-[1.05] active:scale-[0.95] group shadow-[0_20px_40px_-5px_rgba(99,102,241,0.5)] rounded-[14px]">
                                {t("ctaPrimary")}
                                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </a>
                            <a href="/analyzer?sample=true" className="w-full sm:w-auto px-10 py-5 text-sm font-black uppercase tracking-widest border border-white/10 hover:bg-white/5 transition-all rounded-[14px] text-gray-300 backdrop-blur-md flex items-center justify-center gap-2 group">
                                <span className="opacity-60 group-hover:opacity-100 transition-opacity">🧪</span>
                                {t("ctaSample")}
                            </a>
                        </div>

                        {/* Microcopy / Trust Signals */}
                        <div className="flex flex-col sm:flex-row flex-wrap gap-x-8 gap-y-4 animate-fade-in mb-12">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-2.5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    {t(`trustSignal${i}`)}
                                </div>
                            ))}
                        </div>

                        {/* Bullets & Sample CSV */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-8 animate-fade-in pt-10 border-t border-white/[0.05] w-full">
                            <ul className="flex flex-col sm:flex-row gap-8">
                                {[1, 2, 3].map((i) => (
                                    <li key={i} className="flex items-center gap-3 text-gray-500">
                                        <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                            <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="text-[11px] font-black tracking-widest uppercase">{t(`bullet${i}`)}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="sm:ml-auto flex items-center">
                                <a 
                                    href="/sample-trades.csv" 
                                    download 
                                    className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2 group shadow-xl"
                                >
                                    <svg className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    {t("downloadSample")}
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Visual Column / Mockup (Appears after Trust Signals on mobile) */}
                    <div className="lg:col-span-5 relative animate-fade-in sm:mt-0 mt-8 order-last lg:order-none">
                        <div className="relative z-10 w-full aspect-[4/3] sm:aspect-square bg-gradient-to-br from-white/[0.05] to-transparent rounded-[40px] border border-white/10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-2xl overflow-hidden p-8 group">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                            
                            {/* Score Card Mockup */}
                            <div className="absolute top-10 left-10 right-10 p-6 bg-black/60 border border-emerald-500/20 rounded-3xl backdrop-blur-3xl transform group-hover:-translate-y-2 transition-transform duration-700">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Strategy Accuracy</span>
                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded">High Probability</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black text-white">82</span>
                                    <span className="text-sm font-bold text-gray-600">/ 100</span>
                                </div>
                            </div>

                            {/* Chart Mockup */}
                            <div className="absolute bottom-10 left-10 right-10 h-32 transform group-hover:translate-y-1 transition-transform duration-700 delay-100">
                                <svg className="w-full h-full opacity-40" preserveAspectRatio="none" viewBox="0 0 100 40">
                                    <path d="M0 40 L0 30 L10 28 L20 32 L30 20 L40 25 L50 15 L60 12 L70 20 L80 8 L90 5 L100 0" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>

                            {/* Floating Stats */}
                            <div className="absolute top-1/2 left-10 right-10 grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl transform -rotate-2 group-hover:rotate-0 transition-transform duration-500">
                                    <span className="block text-[8px] font-black text-gray-600 uppercase mb-1">Profit Factor</span>
                                    <span className="text-lg font-bold text-white">1.84</span>
                                </div>
                                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl transform rotate-3 group-hover:rotate-0 transition-transform duration-500 delay-150">
                                    <span className="block text-[8px] font-black text-gray-600 uppercase mb-1">Win Rate</span>
                                    <span className="text-lg font-bold text-white">45%</span>
                                </div>
                            </div>
                        </div>

                        {/* Background Decoration */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 blur-[80px] rounded-full" />
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/10 blur-[60px] rounded-full" />
                    </div>

                </div>
            </div>

            {/* Bottom scroll indicator */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-gray-800 animate-bounce hidden lg:block">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </section>
    );
}
