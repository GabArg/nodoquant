import type { Metadata } from "next";
import SeoLandingTemplate from "@/components/nodoquant/SeoLandingTemplate";
import { faqJsonLd } from "@/lib/seo/faqJsonLd";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
    const t = await getTranslations({ locale: params.locale, namespace: "pages.forexStrategyAnalyzer.metadata" });
    
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
            canonical: `https://nodoquant.com/${params.locale}/forex-strategy-analyzer`,
        }
    };
}

export default function ForexStrategyAnalyzerPage({ params }: { params: { locale: string } }) {
    const t = useTranslations("pages.forexStrategyAnalyzer");
    
    const STEPS = [
        { number: "1", title: t("steps.0.title"), description: t("steps.0.desc") },
        { number: "2", title: t("steps.1.title"), description: t("steps.1.desc") },
        { number: "3", title: t("steps.2.title"), description: t("steps.2.desc") },
    ];

    const FEATURES = [
        { icon: "🌍", title: t("features.0.title"), description: t("features.0.desc") },
        { icon: "📈", title: t("features.1.title"), description: t("features.1.desc") },
        { icon: "🛡️", title: t("features.2.title"), description: t("features.2.desc") },
        { icon: "📊", title: t("features.3.title"), description: t("features.3.desc") },
        { icon: "🔬", title: t("features.4.title"), description: t("features.4.desc") },
        { icon: "💎", title: t("features.5.title"), description: t("features.5.desc") },
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
                        name: "NodoQuant Forex Analyzer",
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
                sampleSection={<ForexContent t={t} locale={params.locale} />}
            />
        </>
    );
}

function ForexContent({ t, locale }: { t: any, locale: string }) {
    const metricsT = useTranslations("analyzer.metrics");
    
    return (
        <section className="mt-12 text-gray-300 space-y-12">
            <div className="prose prose-invert max-w-none">
                <h2 className="text-3xl font-bold text-white mb-6">{t("content.h2_what")}</h2>
                <p>
                    {t("content.p1")}
                </p>
                <p>
                    {t("content.p2")}
                </p>

                <h3 className="text-2xl font-bold text-white mt-8 mb-4">{t("content.h3_why")}</h3>
                <p>
                    {t("content.p_why")}
                </p>
                <p>
                    {t("content.p_calc")}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-12">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h4 className="text-indigo-400 font-bold mb-3">{t("content.card_mt.title")}</h4>
                        <p className="text-sm text-gray-400">
                            {t("content.card_mt.desc")}
                        </p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h4 className="text-emerald-400 font-bold mb-3">{t("content.card_pair.title")}</h4>
                        <p className="text-sm text-gray-400">
                            {t("content.card_pair.desc")}
                        </p>
                    </div>
                </div>

                <h3 className="text-2xl font-bold text-white mt-8 mb-4">{t("content.h3_master")}</h3>
                <p>
                    {t("content.p_master")}
                </p>

                <div className="flex flex-col items-center gap-6 my-16 py-12 bg-indigo-600/10 border-y border-indigo-500/20">
                    <h2 className="text-3xl font-bold text-white text-center">{t("content.ready")}</h2>
                    <Link href={`/${locale}/analyzer`} className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-2xl font-black text-xl transition-all">
                        {t("content.readyCta")}
                    </Link>
                    <p className="text-xs text-gray-500">{t("content.readyFoot")}</p>
                </div>

                <h2 className="text-3xl font-bold text-white mb-6">{t("content.h2_metrics")}</h2>
                <ul className="list-disc pl-6 space-y-4">
                    <li>**{t("features.5.title")}**: {t("features.5.desc")}</li>
                    <li>**{metricsT("profitFactor")}**: {t("faqs.3.a")}</li>
                    <li>**{t("content.metric_stability")}**</li>
                    <li>**{metricsT("expectancy")}**: {t("faqs.1.a")}</li>
                </ul>

                <h3 className="text-2xl font-bold text-white mt-8 mb-4">{t("content.h3_leverage")}</h3>
                <p>
                    {t("content.p_leverage")}
                </p>
            </div>

            <div className="text-center py-20 pb-0 flex flex-col items-center gap-8">
                <Link href="/leaderboard" className="text-gray-500 hover:text-gray-400 text-sm">
                    {t("content.leaderboardLink")}
                </Link>
                <Link href="/analyzer" className="text-indigo-400 hover:text-indigo-300 font-bold underline underline-offset-8">
                    {t("content.finalLink")}
                </Link>
            </div>
        </section>
    );
}
