import { useTranslations } from "next-intl";

export default function AnalysisSnapshot() {
    const t = useTranslations("snapshot");

    return (
        <section className="py-24 bg-[#050505] relative overflow-hidden" id="snapshot">
            {/* Background elements */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
            
            <div className="container relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    
                    {/* Left: Text Content */}
                    <div>
                        <p className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8 bg-white/5 border border-white/10 text-indigo-400 inline-block">
                            {t("label")}
                        </p>
                        <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-8 leading-tight tracking-tight">
                            {t("title")}
                        </h2>
                        <p className="text-xl text-gray-300 font-medium mb-10 leading-relaxed max-w-xl">
                            {t("desc")}
                        </p>
                        
                        <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[32px] backdrop-blur-md relative overflow-hidden group hover:border-white/10 transition-all duration-500">
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
                            
                            <div className="flex items-center gap-3 mb-6">
                                <span className="px-4 py-1.5 bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-500/30">
                                    {t("badge")}
                                </span>
                                <span className="text-white/20 text-xs">|</span>
                                <span className="text-indigo-400/80 text-[10px] font-bold uppercase tracking-widest">
                                    {t("expectancy")}
                                </span>
                            </div>
                            
                            <p className="text-gray-400 leading-relaxed font-medium italic">
                                "{t("summary")}"
                            </p>
                        </div>
                    </div>

                    {/* Right: Visual Mockup for Diagnostic Snapshot */}
                    <div className="relative">
                        <div className="relative z-10 p-8 rounded-[40px] bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 backdrop-blur-2xl shadow-2xl">
                            {/* Detailed Metric Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-6 rounded-2xl bg-black/40 border border-white/5">
                                    <span className="block text-[8px] font-black text-gray-500 uppercase tracking-widest mb-2">Sharpe Ratio</span>
                                    <span className="text-2xl font-bold text-white">1.24</span>
                                </div>
                                <div className="p-6 rounded-2xl bg-black/40 border border-white/5">
                                    <span className="block text-[8px] font-black text-gray-500 uppercase tracking-widest mb-2">Expectancy (R)</span>
                                    <span className="text-2xl font-bold text-emerald-400">+0.42</span>
                                </div>
                            </div>
                            
                            {/* Mini Monte Carlo Scatter Graph Mockup */}
                            <div className="h-40 rounded-2xl bg-black/40 border border-white/5 p-6 flex flex-col justify-end relative overflow-hidden">
                                <span className="absolute top-4 left-6 text-[8px] font-black text-gray-600 uppercase tracking-widest">Monte Carlo Paths</span>
                                <svg className="w-full h-full opacity-30 mt-4" viewBox="0 0 100 40">
                                    {[...Array(5)].map((_, i) => (
                                        <path 
                                            key={i}
                                            d={`M0 40 L10 ${30+i} L25 ${20-i*2} L40 ${25+i} L60 ${10+i} L80 ${15-i} L100 ${2+i*3}`} 
                                            fill="none" 
                                            stroke={i === 0 ? "#6366f1" : "#4f46e5"} 
                                            strokeWidth={i === 0 ? "1.5" : "0.5"} 
                                            strokeOpacity={0.5 - i * 0.1}
                                        />
                                    ))}
                                </svg>
                            </div>
                        </div>
                        
                        {/* Decorative elements */}
                        <div className="absolute -top-6 -right-6 w-32 h-32 bg-indigo-500/10 blur-[60px] rounded-full pointer-events-none" />
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />
                    </div>

                </div>
            </div>
        </section>
    );
}
