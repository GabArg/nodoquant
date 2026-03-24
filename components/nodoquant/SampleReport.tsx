import { useTranslations } from "next-intl";

export default function SampleReport() {
    const t = useTranslations("sampleReport");
    const tCommon = useTranslations("common");

    return (
        <section className="py-24 border-t border-white/5 bg-[#050505]" id="sample-report">
            <div className="container">
                <div className="max-w-[720px] mx-auto mb-20 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-6 leading-tight">
                        {t("title")}
                    </h2>

                    <p className="text-lg text-gray-300 font-medium">
                        {t("desc")}
                    </p>
                </div>

                <div className="max-w-5xl mx-auto bg-black/40 border border-white/10 rounded-[32px] p-6 sm:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] backdrop-blur-md relative overflow-hidden transition-all duration-500 hover:border-white/20 hover:bg-black/50 group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-30 group-hover:opacity-60 transition-opacity" />

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-12 items-center">
                        {/* Score Preview - Certification Badge Style */}
                        <div className="lg:col-span-5 flex flex-col justify-center items-center py-14 px-10 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent rounded-[40px] border-2 border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.15)] relative overflow-hidden group/score hover:border-emerald-500/50 transition-all duration-500">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-[60px]" />
                            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-[40px]" />
                            
                            <span className="text-[11px] font-black text-emerald-500/70 uppercase tracking-[0.3em] mb-4">{t("scoreLabel")}</span>
                            <div className="flex items-baseline gap-2 mb-6">
                                <span className="text-8xl font-black text-emerald-400 tracking-tighter">82</span>
                                <span className="text-2xl font-bold text-emerald-400/40">/ 100</span>
                            </div>
                            <div className="py-2.5 px-6 bg-emerald-500/20 border border-emerald-500/40 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                                <span className="text-[12px] font-black text-emerald-400 uppercase tracking-[0.25em]">{t("scoreStatus")}</span>
                            </div>
                        </div>

                        {/* Metrics Preview */}
                        <div className="lg:col-span-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                            {[
                                { label: t("metrics.winRate"), value: "45%", color: "text-white", tooltip: "winRate" },
                                { label: t("metrics.profitFactor"), value: "1.84", color: "text-white", tooltip: "profitFactor" },
                                { label: t("metrics.expectancy"), value: "0.42 R", color: "text-emerald-400", tooltip: "expectancy" },
                                { label: t("metrics.maxDrawdown"), value: "-12.5%", color: "text-red-400", tooltip: "maxDrawdown" },
                                { label: t("metrics.trades"), value: "436", color: "text-indigo-300", tooltip: "trades" },
                            ].map((m) => (
                                <div key={m.label} title={tCommon(`tooltips.${m.tooltip}`)} className="p-5 bg-white/[0.03] rounded-2xl border border-white/[0.05] flex flex-col justify-center hover:bg-white/[0.06] hover:border-white/[0.1] transition-all cursor-help relative group/item">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{m.label}</span>
                                        <svg className="w-3 h-3 text-gray-600 group-hover/item:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <span className={`text-2xl font-black ${m.color} tracking-tight`}>{m.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Equity Curve Fake Graphic */}
                    <div className="w-full h-56 bg-white/[0.02] rounded-2xl border border-white/5 p-8 relative overflow-hidden flex flex-col justify-end group/curve transition-all hover:bg-white/[0.04]">
                        <span className="absolute top-6 left-8 text-xs font-black text-gray-600 uppercase tracking-[0.2em]">{t("equityCurve")}</span>
                        <svg className="w-full h-full opacity-60 mt-8 group-hover:opacity-80 transition-opacity" preserveAspectRatio="none" viewBox="0 0 100 40">
                            <defs>
                                <linearGradient id="eq-grad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path d="M0 40 L0 30 L10 28 L20 32 L30 20 L40 25 L50 15 L60 12 L70 20 L80 8 L90 5 L100 1 L100 40 Z" fill="url(#eq-grad)" />
                            <path d="M0 30 L10 28 L20 32 L30 20 L40 25 L50 15 L60 12 L70 20 L80 8 L90 5 L100 1" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        
                        {/* Overlay Gradient to hide sharp edges */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                    </div>

                    <div className="mt-12 flex justify-center">
                        <a href="/report/example" className="btn-secondary w-full sm:w-auto px-10 py-4 text-xs font-black uppercase tracking-widest bg-white/[0.02] hover:bg-white/[0.06] text-gray-300 rounded-[14px] transition-all border border-white/5 hover:border-white/20 group backdrop-blur-xl">
                            {t("cta")}
                            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1.5 ml-3">→</span>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}

