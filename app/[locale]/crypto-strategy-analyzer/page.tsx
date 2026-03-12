import type { Metadata } from "next";
import SeoLandingTemplate from "@/components/nodoquant/SeoLandingTemplate";
import { faqJsonLd } from "@/lib/seo/faqJsonLd";
import { CRYPTO_SAMPLE } from "@/lib/seo/sampleData";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
    const t = await getTranslations({ locale: params.locale, namespace: "pages.cryptoStrategyAnalyzer.metadata" });
    
    return {
        title: t("title"),
        description: t("description"),
        keywords: t("keywords").split(",").map(k => k.trim()),
        openGraph: {
            title: t("title"),
            description: t("description"),
            type: "website",
        }
    };
}

export default function CryptoStrategyAnalyzerPage({ params }: { params: { locale: string } }) {
    const t = useTranslations("pages.cryptoStrategyAnalyzer");
    const common = useTranslations("analyzer.metrics");

    const STEPS = [
        { number: "1", title: t("steps.0.title"), description: t("steps.0.desc") },
        { number: "2", title: t("steps.1.title"), description: t("steps.1.desc") },
        { number: "3", title: t("steps.2.title"), description: t("steps.2.desc") },
    ];

    const FEATURES = [
        { icon: "₿", title: t("features.0.title"), description: t("features.0.desc") },
        { icon: "📊", title: t("features.1.title"), description: t("features.1.desc") },
        { icon: "📈", title: t("features.2.title"), description: t("features.2.desc") },
        { icon: "🎯", title: t("features.3.title"), description: t("features.3.desc") },
        { icon: "⚠️", title: t("features.4.title"), description: t("features.4.desc") },
        { icon: "🧪", title: t("features.5.title"), description: t("features.5.desc") },
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
                sampleSection={<SampleScoreCard t={t} metricsT={common} />}
            />
        </>
    );
}

function SampleScoreCard({ t, metricsT }: { t: any, metricsT: any }) {
    const s = CRYPTO_SAMPLE;
    const tier = { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", label: "Strong Edge" };
    
    return (
        <section className="mb-16">
            <h2 className="text-2xl font-bold text-white text-center mb-2">{t("sampleScoreCard.title")}</h2>
            <p className="text-sm text-center mb-8" style={{ color: "#6b7280" }}>
                {t("sampleScoreCard.desc")}
            </p>
            <div className="flex justify-center">
                <div style={{
                    background: "#ffffff", borderRadius: "20px", padding: "32px",
                    fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
                    boxShadow: "0 4px 32px rgba(0,0,0,0.24)",
                    maxWidth: "500px", width: "100%", position: "relative", overflow: "hidden",
                }}>
                    <div style={{
                        position: "absolute", top: 0, left: 0, right: 0, height: "4px",
                        background: "linear-gradient(90deg,#f59e0b,#6366f1)"
                    }} />
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "26px", height: "26px", borderRadius: "7px", background: "linear-gradient(135deg,#6366f1,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <span style={{ color: "#fff", fontSize: "13px", fontWeight: "900" }}>N</span>
                            </div>
                            <span style={{ fontSize: "13px", fontWeight: "700", color: "#111827" }}>NodoQuant</span>
                        </div>
                        <span style={{ fontSize: "10px", color: "#6b7280", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase" }}>{t("sampleScoreCard.typeLabel")}</span>
                    </div>
                    <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px", fontWeight: "500" }}>{s.strategyName}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "18px", padding: "18px", borderRadius: "14px", background: tier.bg, border: `1.5px solid ${tier.border}`, marginBottom: "18px" }}>
                        <div style={{ textAlign: "center", minWidth: "72px" }}>
                            <div style={{ fontSize: "52px", fontWeight: "900", lineHeight: "1", color: tier.color }}>{s.score}</div>
                            <div style={{ fontSize: "10px", fontWeight: "700", color: tier.color, marginTop: "3px" }}>/ 100</div>
                        </div>
                        <div>
                            <div style={{ fontSize: "17px", fontWeight: "800", color: tier.color, marginBottom: "3px" }}>{tier.label}</div>
                            <div style={{ fontSize: "11px", color: "#6b7280" }}>{t("sampleScoreCard.scoreLabel")} · {s.totalTrades} {t("sampleScoreCard.tradesLabel")}</div>
                        </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "18px" }}>
                        {[
                            { label: metricsT("winRate"), value: `${s.winRate}%`, good: s.winRate >= 50 },
                            { label: metricsT("profitFactor"), value: s.profitFactor.toFixed(2), good: s.profitFactor >= 1.5 },
                            { label: metricsT("expectancy"), value: `+${s.expectancy}R`, good: true },
                            { label: metricsT("maxDrawdown"), value: `${s.maxDrawdown}%`, good: s.maxDrawdown <= 20 },
                        ].map(m => (
                            <div key={m.label} style={{ background: "#f9fafb", borderRadius: "10px", padding: "10px 12px", border: "1px solid #f3f4f6" }}>
                                <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "600", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.label}</div>
                                <div style={{ fontSize: "18px", fontWeight: "800", color: m.good ? "#059669" : "#dc2626" }}>{m.value}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ paddingTop: "14px", borderTop: "1px solid #f3f4f6", textAlign: "center" }}>
                        <span style={{ fontSize: "11px", color: "#9ca3af" }}>nodoquant.com · {t("sampleScoreCard.footer")}</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
