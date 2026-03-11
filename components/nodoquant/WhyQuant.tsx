import { useTranslations } from "next-intl";

export default function WhyQuant() {
    const t = useTranslations("whyQuant");

    const REASONS = [
        {
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.8">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            title: t("r1_title"),
            description: t("r1_desc"),
        },
        {
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.8">
                    <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            title: t("r2_title"),
            description: t("r2_desc"),
        },
        {
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.8">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <path d="M8 21h8M12 17v4" />
                </svg>
            ),
            title: t("r3_title"),
            description: t("r3_desc"),
        },
    ];

    return (
        <section className="py-[80px] border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-14">
                    <p className="section-label">{t("label")}</p>
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
                        {t("title")}
                    </h2>
                    <p className="text-base max-w-xl mx-auto" style={{ color: "#6b7280" }}>
                        {t("desc")}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {REASONS.map((r, i) => (
                        <div
                            key={i}
                            className="card rounded-2xl p-7 flex flex-col gap-4"
                        >
                            <div
                                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}
                            >
                                {r.icon}
                            </div>
                            <div>
                                <h3 className="font-semibold text-white mb-2 leading-snug">{r.title}</h3>
                                <p className="text-sm leading-relaxed" style={{ color: "#6b7280" }}>
                                    {r.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-10">
                    <a href="/analyzer" className="btn-primary">
                        {t("cta")}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </a>
                    <p className="text-xs mt-2" style={{ color: "#374151" }}>{t("cta_note")}</p>
                </div>
            </div>
        </section>
    );
}
