import { useTranslations } from "next-intl";

export default function FAQ() {
    const t = useTranslations("faq");

    const faqs = [
        { q: t("q1"), a: t("a1") },
        { q: t("q2"), a: t("a2") },
        { q: t("q3"), a: t("a3") },
        { q: t("q4"), a: t("a4") },
        { q: t("q5"), a: t("a5") },
        { q: t("q6"), a: t("a6") },
    ];

    return (
        <section className="py-[70px] border-t border-white/5" id="faq">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <p className="section-label">{t("label")}</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-12">
                    {t("title")}
                </h2>

                <div className="space-y-4">
                    {faqs.map((item) => (
                        <details
                            key={item.q}
                            className="card px-6 py-5 group rounded-2xl"
                        >
                            <summary className="py-1 text-base font-semibold text-gray-200 select-none outline-none flex justify-between items-center cursor-pointer">
                                {item.q}
                                <span className="summary-chevron text-gray-500 flex-shrink-0 transition-transform duration-200">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </span>
                            </summary>
                            <p className="mt-4 text-base text-gray-400 leading-relaxed pb-1">{item.a}</p>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    );
}

