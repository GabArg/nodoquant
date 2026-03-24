import { useTranslations } from "next-intl";

export default function WhyTraders() {
    const t = useTranslations("whyTraders");

    const cards = [
        {
            title: t("card1Title"),
            desc: t("card1Desc"),
            icon: (
                <svg className="w-6 h-6 text-red-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            )
        },
        {
            title: t("card2Title"),
            desc: t("card2Desc"),
            icon: (
                <svg className="w-6 h-6 text-orange-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
            )
        },
        {
            title: t("card3Title"),
            desc: t("card3Desc"),
            icon: (
                <svg className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            title: t("card4Title"),
            desc: t("card4Desc"),
            icon: (
                <svg className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            )
        }
    ];

    return (
        <section className="py-24 border-t border-white/[0.03] bg-black">
            <div className="container">
                <div className="max-w-[720px] mx-auto mb-20 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-6">
                        {t("title")}
                    </h2>
                </div>

                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {cards.map((card, idx) => (
                        <div key={idx} className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group">
                            <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center mb-6">
                                {card.icon}
                            </div>
                            <h3 className="text-lg font-bold text-white mb-3 tracking-tight">
                                {card.title}
                            </h3>
                            <p className="text-sm text-gray-400 leading-relaxed font-medium">
                                {card.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
