import { useTranslations } from "next-intl";

export default function FAQ() {
    const t = useTranslations("faq");

    const faqs = [1, 2, 3, 4, 5, 6, 7]; // 7 FAQs now

    return (
        <section className="py-[120px] border-t border-white/[0.03] bg-black" id="faq">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-20 animate-fade-in text-balance">
                    <p className="section-label mb-6 inline-block">{t("label")}</p>
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight">
                        {t("title")}
                    </h2>
                </div>

                <div className="space-y-4 max-w-3xl mx-auto">
                    {faqs.map((i) => (
                        <details
                            key={i}
                            className="group bg-white/[0.02] border border-white/[0.05] hover:border-white/10 rounded-[24px] overflow-hidden transition-all duration-300"
                        >
                            <summary className="px-8 py-6 text-lg font-bold text-gray-200 select-none outline-none flex justify-between items-center cursor-pointer group-hover:bg-white/[0.02] transition-colors">
                                {t(`q${i}`)}
                                <span className="summary-chevron text-indigo-500 flex-shrink-0 transition-transform duration-500 group-open:rotate-180">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </span>
                            </summary>
                            <div className="px-8 pb-8">
                                <p className="text-gray-400 leading-relaxed font-medium pt-2 border-t border-white/[0.03]">
                                    {t(`a${i}`)}
                                </p>
                            </div>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    );
}
