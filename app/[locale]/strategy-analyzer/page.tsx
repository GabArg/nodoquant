import type { Metadata } from "next";
import SeoLandingTemplate from "@/components/nodoquant/SeoLandingTemplate";
import { faqJsonLd } from "@/lib/seo/faqJsonLd";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
    const t = await getTranslations({ locale: params.locale, namespace: "pages.strategyAnalyzer.metadata" });
    
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
            canonical: `https://nodoquant.com/${params.locale}/strategy-analyzer`,
        }
    };
}

export default function StrategyAnalyzerPage({ params }: { params: { locale: string } }) {
    const t = useTranslations("pages.strategyAnalyzer");

    const STEPS = [
        { number: "1", title: t("steps.0.title"), description: t("steps.0.desc") },
        { number: "2", title: t("steps.1.title"), description: t("steps.1.desc") },
        { number: "3", title: t("steps.2.title"), description: t("steps.2.desc") },
    ];

    const FEATURES = [
        { icon: "📉", title: t("features.0.title"), description: t("features.0.desc") },
        { icon: "🎯", title: t("features.1.title"), description: t("features.1.desc") },
        { icon: "🛡️", title: t("features.2.title"), description: t("features.2.desc") },
        { icon: "💰", title: t("features.3.title"), description: t("features.3.desc") },
        { icon: "📊", title: t("features.4.title"), description: t("features.4.desc") },
        { icon: "🚀", title: t("features.5.title"), description: t("features.5.desc") },
    ];

    const FAQS = [
        { q: t("faqs.0.q"), a: t("faqs.0.a") },
        { q: t("faqs.1.q"), a: t("faqs.1.a") },
        { q: t("faqs.2.q"), a: t("faqs.2.a") },
        { q: t("faqs.3.q"), a: t("faqs.3.a") },
    ];

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        name: "NodoQuant Strategy Analyzer",
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
                sampleSection={<SampleContent t={t} />}
            />
        </>
    );
}

function SampleContent({ t }: { t: any }) {
    return (
        <section className="mt-12 text-gray-300 space-y-12">
            <div className="prose prose-invert max-w-none text-balance">
                <h2 className="text-3xl font-bold text-white mb-6">{t("sampleSection.title")}</h2>
                <div className="space-y-4">
                    <p>{t("sampleSection.p1")}</p>
                    <p>{t("sampleSection.p2")}</p>
                </div>

                <h3 className="text-2xl font-bold text-white mt-8 mb-4">{t("sampleSection.h2_step")}</h3>
                <p>
                    {t("sampleSection.p_step")}
                </p>
                <ol className="list-decimal pl-6 space-y-2">
                    {t.raw("sampleSection.steps").map((step: string, i: number) => (
                        <li key={i}>{step}</li>
                    ))}
                </ol>

                <h3 className="text-2xl font-bold text-white mt-8 mb-4">{t("sampleSection.h2_why")}</h3>
                <p>
                    {t("sampleSection.p_why")}
                </p>
                <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-6 my-8">
                    <h4 className="text-indigo-400 font-bold mb-2">Pro Tip:</h4>
                    <p className="text-sm italic">
                        "{t("sampleSection.proTip")}"
                    </p>
                </div>

                <div className="flex flex-col items-center gap-6 my-16 py-12 border-y border-white/5">
                    <h2 className="text-3xl font-bold text-white text-center">{t("sampleSection.ready")}</h2>
                    <a href="/analyzer" className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-2xl font-black text-xl transition-all shadow-2xl shadow-indigo-500/20">
                        {t("sampleSection.readyCta")}
                    </a>
                    <div className="flex gap-8 text-sm text-gray-500">
                        <span className="flex items-center gap-2">✅ {t("sampleSection.features.support")}</span>
                        <span className="flex items-center gap-2">✅ {t("sampleSection.features.instant")}</span>
                        <span className="flex items-center gap-2">✅ {t("sampleSection.features.free")}</span>
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-white mb-6">{t("sampleSection.h2_compare")}</h2>
                <p>
                    {t("sampleSection.p_compare")}
                </p>
                <table className="w-full border-collapse border border-white/10 mt-6 overflow-hidden rounded-xl">
                    <thead>
                        <tr className="bg-white/5">
                            <th className="p-4 border border-white/10 text-left">{t("sampleSection.table.feature")}</th>
                            <th className="p-4 border border-white/10 text-left">{t("sampleSection.table.journal")}</th>
                            <th className="p-4 border border-white/10 text-left">{t("sampleSection.table.analyzer")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="p-4 border border-white/10 font-bold">{t("sampleSection.table.goal")}</td>
                            <td className="p-4 border border-white/10 text-gray-400">{t("sampleSection.table.goal_val1")}</td>
                            <td className="p-4 border border-white/10 text-emerald-400 font-medium">{t("sampleSection.table.goal_val2")}</td>
                        </tr>
                        <tr>
                            <td className="p-4 border border-white/10 font-bold">{t("sampleSection.table.focus")}</td>
                            <td className="p-4 border border-white/10 text-gray-400">{t("sampleSection.table.focus_val1")}</td>
                            <td className="p-4 border border-white/10 text-emerald-400 font-medium">{t("sampleSection.table.focus_val2")}</td>
                        </tr>
                        <tr>
                            <td className="p-4 border border-white/10 font-bold">{t("sampleSection.table.metric")}</td>
                            <td className="p-4 border border-white/10 text-gray-400">{t("sampleSection.table.metric_val1")}</td>
                            <td className="p-4 border border-white/10 text-emerald-400 font-medium">{t("sampleSection.table.metric_val2")}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="text-center py-20 pb-0">
                <Link href="/analyzer" className="text-indigo-400 hover:text-indigo-300 font-bold underline underline-offset-8">
                    {t("sampleSection.finalLink")}
                </Link>
            </div>
        </section>
    );
}
