import { useTranslations } from "next-intl";

export default function StrategyScoreSection() {
    const t = useTranslations("strategyScore");

    const levels = [
        { range: t("s1_range"), desc: t("s1_desc"), bg: "rgba(239, 68, 68, 0.1)", border: "rgba(239, 68, 68, 0.3)", color: "#fca5a5" },
        { range: t("s2_range"), desc: t("s2_desc"), bg: "rgba(245, 158, 11, 0.1)", border: "rgba(245, 158, 11, 0.3)", color: "#fcd34d" },
        { range: t("s3_range"), desc: t("s3_desc"), bg: "rgba(59, 130, 246, 0.1)", border: "rgba(59, 130, 246, 0.3)", color: "#93c5fd" },
        { range: t("s4_range"), desc: t("s4_desc"), bg: "rgba(16, 185, 129, 0.1)", border: "rgba(16, 185, 129, 0.3)", color: "#6ee7b7" }
    ];

    return (
        <section className="py-[80px] border-t border-white/5 relative overflow-hidden" id="score">
            {/* Background elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-full bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <p className="section-label">{t("label")}</p>
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 leading-tight">
                        {t("title")}
                    </h2>
                    <p className="text-base max-w-2xl mx-auto text-gray-400">
                        {t("desc")}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto mb-16">
                    {levels.map((lvl, i) => (
                        <div key={i} className="card rounded-2xl p-8 text-center shadow-2xl border-2 relative overflow-hidden transition-all hover:scale-105 group" style={{ borderColor: lvl.border, background: lvl.bg }}>
                            <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-bl-full pointer-events-none transition-all group-hover:bg-white/10" />
                            <div className="text-4xl font-black text-white mb-1 tracking-tighter">
                                {lvl.range.split('–')[1] || lvl.range} <span className="text-sm font-medium opacity-40">/ 100</span>
                            </div>
                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">
                                Strategy Score
                            </div>
                            <div className="text-sm font-black uppercase tracking-widest py-2 px-4 rounded-lg inline-block" style={{ background: `${lvl.color}15`, border: `1px solid ${lvl.color}30`, color: lvl.color }}>
                                {lvl.desc}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center">
                    <a href="/analyzer" className="btn-primary">
                        {t("cta")}
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </a>
                </div>
            </div>
        </section>
    );
}

