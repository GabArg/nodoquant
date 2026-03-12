import type { Metadata } from "next";
import SeoLandingTemplate from "@/components/nodoquant/SeoLandingTemplate";
import { faqJsonLd } from "@/lib/seo/faqJsonLd";
import EdgeCalculator from "@/components/nodoquant/EdgeCalculator";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
    const t = await getTranslations({ locale: params.locale, namespace: "pages.tradingEdgeCalculator.metadata" });
    
    return {
        title: t("title"),
        description: t("description"),
        keywords: t("keywords").split(",").map(k => k.trim()),
        openGraph: {
            title: t("title"),
            description: t("description"),
            type: "website",
        },
        alternates: {
            canonical: `https://nodoquant.com/${params.locale}/trading-edge-calculator`,
        }
    };
}

export default function TradingEdgeCalculatorPage({ params }: { params: { locale: string } }) {
    const t = useTranslations("pages.tradingEdgeCalculator");

    const STEPS = [
        { number: "1", title: t("steps.0.title"), description: t("steps.0.desc") },
        { number: "2", title: t("steps.1.title"), description: t("steps.1.desc") },
        { number: "3", title: t("steps.2.title"), description: t("steps.2.desc") },
    ];

    const FEATURES = [
        { icon: "🧮", title: t("features.0.title"), description: t("features.0.desc") },
        { icon: "⚡", title: t("features.1.title"), description: t("features.1.desc") },
        { icon: "🎯", title: t("features.2.title"), description: t("features.2.desc") },
        { icon: "📉", title: t("features.3.title"), description: t("features.3.desc") },
        { icon: "💎", title: t("features.4.title"), description: t("features.4.desc") },
        { icon: "📊", title: t("features.5.title"), description: t("features.5.desc") },
    ];

    const FAQS = [
        { q: t("faqs.0.q"), a: t("faqs.0.a") },
        { q: t("faqs.1.q"), a: t("faqs.1.a") },
        { q: t("faqs.2.q"), a: t("faqs.2.a") },
        { q: t("faqs.3.q"), a: t("faqs.3.a") },
        { q: t("faqs.4.q"), a: t("faqs.4.a") },
    ];

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        name: "NodoQuant Edge Calculator",
                        applicationCategory: "FinanceApplication",
                        operatingSystem: "Web",
                        description: t("metadata.description"),
                    }),
                }}
            />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd(FAQS) }} />

            <SeoLandingTemplate
                badge={t("hero.badge")}
                headline={t("hero.headline")}
                subheadline={t("hero.subheadline")}
                ctaLabel={t("hero.cta")}
                steps={STEPS}
                features={FEATURES}
                faqs={FAQS}
                analyzerHref={`/${params.locale}/analyzer`}
                sampleSection={<CalculatorSection t={t} locale={params.locale} />}
            />
        </>
    );
}

function CalculatorSection({ t, locale }: { t: any, locale: string }) {
    const metricsT = useTranslations("analyzer.metrics");

    return (
        <section className="mt-16 text-gray-300">
            <h2 className="text-3xl font-bold text-white text-center mb-4">{t("content.h2_interactive")}</h2>
            <p className="text-center mb-10 max-w-2xl mx-auto text-gray-400">
                {t("content.p_interactive")}
            </p>

            <EdgeCalculator />

            <div className="prose prose-invert max-w-none mt-16 text-balance">
                <h2 className="text-3xl font-bold text-white mb-6">{t("content.h2_what")}</h2>
                <p>
                    {t("content.p1")}
                </p>
                <p>
                    {t("content.p2")}
                </p>

                <h3 className="text-2xl font-bold text-white mt-8 mb-4">{t("content.h3_how")}</h3>
                <p>
                    {t("content.p_how")}
                </p>
                <div className="bg-white/5 border border-white/10 rounded-xl p-8 my-6 text-center">
                    <code className="text-xl text-indigo-400 font-bold">
                        Expectancy = (Win Rate % * Avg Win) - (Loss Rate % * Avg Loss)
                    </code>
                </div>
                <p>
                    {t("content.p_example")}
                    <br />
                    <code>Expectancy = (0.40 * 300) - (0.60 * 100) = 120 - 60 = $60</code>.
                    <br />
                    {t("content.p_result")}
                </p>

                <h3 className="text-2xl font-bold text-white mt-8 mb-4">{t("content.h3_not_enough")}</h3>
                <p>
                    {t("content.p_calc_limit")}
                </p>
                <p>
                    {t("content.p_reality")}
                </p>

                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 my-12 flex flex-col items-center">
                    <h4 className="text-white text-xl font-bold mb-4">{t("content.card_csv.title")}</h4>
                    <p className="text-center text-gray-400 mb-6">
                        {t("content.card_csv.desc")}
                    </p>
                    <Link href={`/${locale}/analyzer`} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-xl shadow-emerald-500/20">
                        {t("content.card_csv.cta")}
                    </Link>
                </div>

                <h2 className="text-3xl font-bold text-white mb-6">{t("content.h2_winrate")}</h2>
                <p>
                    {t("content.p_winrate")}
                </p>

                <h3 className="text-2xl font-bold text-white mt-8 mb-4">{t("content.h3_metrics")}</h3>
                <ul className="list-disc pl-6 space-y-3">
                    <li>**{metricsT("profitFactor")}**: {t("faqs.2.a")}</li>
                    <li>**{t("features.4.title")}**: {t("features.4.desc")}</li>
                    <li>**Kelly Criterion**: {t("features.3.desc")}</li>
                </ul>
            </div>

            <div className="text-center py-20 pb-0 flex flex-col items-center gap-8">
                <Link href="/pricing" className="text-gray-500 hover:text-gray-400 text-sm">
                    {t("content.leaderboardLink")}
                </Link>
                <Link href="/analyzer" className="text-indigo-400 hover:text-indigo-300 font-bold underline underline-offset-8">
                    {t("content.finalLink")}
                </Link>
            </div>
        </section>
    );
}
