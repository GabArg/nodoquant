import { useTranslations } from "next-intl";

export default function HowItWorks() {
    const t = useTranslations("howItWorks");

    const steps = [
        {
            num: "01",
            title: t("step1_title"),
            desc: t("step1_desc"),
        },
        {
            num: "02",
            title: t("step2_title"),
            desc: t("step2_desc"),
        },
        {
            num: "03",
            title: t("step3_title"),
            desc: t("step3_desc"),
        },
        {
            num: "04",
            title: t("step4_title"),
            desc: t("step4_desc"),
        }
    ];

    return (
        <section className="py-[80px] border-t border-white/5" id="process">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <p className="section-label">{t("label")}</p>
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
                        {t("title")}
                    </h2>
                    <p className="text-base text-gray-400 max-w-xl mx-auto">
                        {t("desc")}
                    </p>
                </div>

                <div className="relative max-w-5xl mx-auto">
                    {/* Connecting line for desktop */}
                    <div className="hidden md:block absolute top-[2.75rem] left-[10%] right-[10%] h-[2px] bg-white/5" />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
                        {steps.map((s, i) => (
                            <div key={i} className="relative text-center group">
                                <div className="mx-auto w-20 h-20 rounded-full mb-6 flex items-center justify-center border bg-[#050505] shadow-xl relative z-10 transition-colors duration-300"
                                    style={{ borderColor: "rgba(99,102,241,0.3)" }}>
                                    <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                        style={{ background: "radial-gradient(circle at center, rgba(99,102,241,0.2) 0%, transparent 70%)" }} />
                                    <span className="text-2xl font-black text-indigo-400 font-mono tracking-tighter">
                                        {s.num}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">
                                    {s.title}
                                </h3>
                                <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                                    {s.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

