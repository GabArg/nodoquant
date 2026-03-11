import { ReactNode } from "react";
import Link from "next/link";

interface Step {
    number: string;
    title: string;
    description: string;
}

interface Feature {
    icon: string;
    title: string;
    description: string;
}

interface Faq {
    q: string;
    a: string;
}

interface SeoLandingTemplateProps {
    badge: string;
    headline: string;
    subheadline: string;
    ctaLabel?: string;
    steps: Step[];
    features: Feature[];
    faqs: Faq[];
    analyzerHref: string;
    /** Optional section rendered between Features and FAQ — e.g. a sample score card */
    sampleSection?: ReactNode;
}

function StepItem({ step }: { step: Step }) {
    return (
        <div className="flex gap-5 items-start">
            <div className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", color: "#818cf8" }}>
                {step.number}
            </div>
            <div>
                <h3 className="font-semibold text-white mb-1">{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#9ca3af" }}>{step.description}</p>
            </div>
        </div>
    );
}

function FeatureCard({ feature }: { feature: Feature }) {
    return (
        <div className="rounded-xl p-5 border"
            style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
            <div className="text-2xl mb-3">{feature.icon}</div>
            <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: "#9ca3af" }}>{feature.description}</p>
        </div>
    );
}

export default function SeoLandingTemplate({
    badge,
    headline,
    subheadline,
    ctaLabel = "Analyze my strategy — free",
    steps,
    features,
    faqs,
    analyzerHref,
    sampleSection,
}: SeoLandingTemplateProps) {
    return (
        <main className="min-h-screen pt-20 pb-24 px-4" style={{ background: "#07090F", color: "#f9fafb" }}>
            <div className="max-w-4xl mx-auto">

                {/* ── Hero ── */}
                <header className="text-center pt-16 pb-14">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6"
                        style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}>
                        {badge}
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-5 leading-tight">
                        {headline}
                    </h1>
                    <p className="text-lg max-w-2xl mx-auto mb-8" style={{ color: "#9ca3af" }}>
                        {subheadline}
                    </p>
                    <Link href={analyzerHref}
                        className="inline-flex items-center gap-2 font-bold text-white px-8 py-4 rounded-xl transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] text-base"
                        style={{
                            background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                            boxShadow: "0 0 30px rgba(99,102,241,0.3)"
                        }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                        {ctaLabel}
                    </Link>
                    <p className="text-xs mt-3" style={{ color: "#4b5563" }}>No credit card required · Results in 60 seconds</p>
                </header>

                {/* ── How it works ── */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold text-white text-center mb-8">How it works</h2>
                    <div className="space-y-6 max-w-xl mx-auto">
                        {steps.map((s) => <StepItem key={s.number} step={s} />)}
                    </div>
                </section>

                {/* ── Features ── */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold text-white text-center mb-8">What you get</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {features.map((f) => <FeatureCard key={f.title} feature={f} />)}
                    </div>
                </section>

                {/* ── Sample score card (optional) ── */}
                {sampleSection}

                {/* ── FAQ ── */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold text-white text-center mb-8">Frequently asked questions</h2>
                    <div className="space-y-4 max-w-2xl mx-auto">
                        {faqs.map((faq) => (
                            <div key={faq.q} className="rounded-xl p-5 border"
                                style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
                                <p className="font-semibold text-white mb-2">{faq.q}</p>
                                <p className="text-sm leading-relaxed" style={{ color: "#9ca3af" }}>{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Final CTA ── */}
                <div className="rounded-2xl px-8 py-12 text-center border"
                    style={{
                        background: "linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(16,185,129,0.05) 100%)",
                        borderColor: "rgba(99,102,241,0.2)"
                    }}>
                    <h2 className="text-2xl font-extrabold text-white mb-3">Ready to discover your trading edge?</h2>
                    <p className="mb-6" style={{ color: "#9ca3af" }}>
                        Upload your trade history and get a full quantitative report in under 60 seconds.
                    </p>
                    <Link href={analyzerHref}
                        className="inline-flex items-center gap-2 font-bold text-white px-8 py-4 rounded-xl transition-all hover:scale-[1.02]"
                        style={{
                            background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                            boxShadow: "0 0 24px rgba(99,102,241,0.3)"
                        }}>
                        {ctaLabel}
                    </Link>
                </div>

            </div>
        </main>
    );
}
