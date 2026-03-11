import { useTranslations } from "next-intl";

export default function Hero() {
    const t = useTranslations("home");

    return (
        <section className="hero-gradient min-h-screen flex flex-col justify-center pt-14" id="hero">
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-[120px]">
                {/* Label */}
                <p className="section-label animate-fade-in">
                    {t("label")}
                </p>

                {/* H1 */}
                <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white mb-6 animate-slide-up leading-tight">
                    {t("title")}
                </h1>

                {/* Subtitle / H2 */}
                <h2 className="text-xl sm:text-2xl text-gray-300 font-light mb-4 max-w-2xl animate-slide-up leading-relaxed">
                    {t("subtitle")}
                </h2>

                {/* SEO Paragraph */}
                <p className="text-base text-gray-400 mb-10 max-w-2xl animate-slide-up leading-relaxed hidden sm:block">
                    {t("description")}
                </p>

                {/* Bullets */}
                <ul className="space-y-3 mb-12 animate-slide-up">
                    {[
                        t("bullet1"),
                        t("bullet2"),
                        t("bullet3"),
                    ].map((item) => (
                        <li key={item} className="flex items-start gap-3 text-gray-300">
                            <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                                <svg className="w-3 h-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                            </span>
                            <span className="text-base sm:text-lg">{item}</span>
                        </li>
                    ))}
                </ul>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3 animate-fade-in mb-6">
                    <a href="/analyzer" className="btn-primary">
                        {t("ctaPrimary")}
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </a>
                    <a href="/report/example" className="btn-secondary">
                        {t("ctaSecondary")}
                    </a>
                </div>

                {/* Microcopy / Trust Signals */}
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 animate-fade-in">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                        <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {t("trustSignal1")}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                        <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {t("trustSignal2")}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                        <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {t("trustSignal3")}
                    </div>
                </div>

                {/* Disclaimer */}
                <p className="mt-12 text-[10px] text-gray-600 max-w-xl leading-relaxed animate-fade-in uppercase tracking-tighter">
                    {t("disclaimer")}
                </p>
            </div>

            {/* Bottom scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-700 animate-bounce hidden sm:block">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </section>
    );
}
