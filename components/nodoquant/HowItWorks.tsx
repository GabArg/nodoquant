import { useTranslations } from "next-intl";

export default function HowItWorks() {
    const t = useTranslations("howItWorks");

    return (
        <section className="py-24 border-t border-white/[0.03] bg-black" id="process">
            <div className="container">
                <div className="max-w-[720px] mx-auto mb-20 text-center text-balance">
                    <p className="section-label mb-6 inline-block">{t("label")}</p>
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight">
                        {t("title")}
                    </h2>
                    <p className="text-lg text-gray-300 font-medium leading-relaxed">
                        {t("desc")}
                    </p>
                </div>

                <div className="relative max-w-5xl mx-auto">
                    {/* Connecting line for desktop */}
                    <div className="hidden md:block absolute top-[2.75rem] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                        {[1, 2, 3].map((step) => (
                            <div key={step} className="flex flex-col h-full p-6 sm:p-10 bg-white/[0.02] border border-white/[0.05] rounded-[40px] group hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/0 group-hover:bg-indigo-500/20 transition-all" />
                                
                                <div className="w-16 h-16 rounded-[24px] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-10 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-500 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                                    <span className="text-2xl font-black text-indigo-400">{step}</span>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-indigo-300 transition-colors tracking-tight">
                                    {t(`step${step}_title`)}
                                </h3>
                                <p className="text-gray-300 leading-relaxed font-medium">
                                    {t(`step${step}_desc`)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
