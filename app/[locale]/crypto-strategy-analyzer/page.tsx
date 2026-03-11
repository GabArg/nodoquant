import type { Metadata } from "next";
import SeoLandingTemplate from "@/components/nodoquant/SeoLandingTemplate";
import { faqJsonLd } from "@/lib/seo/faqJsonLd";
import { CRYPTO_SAMPLE } from "@/lib/seo/sampleData";

export const metadata: Metadata = {
    title: "Crypto Strategy Analyzer — Backtest Your Crypto Edge | NodoQuant",
    description:
        "Test your crypto trading strategy with quantitative analysis. Upload your Binance, Bybit or exchange trade history and get Win Rate, Profit Factor, Expectancy and a Strategy Score in 60 seconds.",
    keywords: ["crypto strategy analyzer", "crypto backtesting", "binance strategy analysis", "cryptocurrency trading edge", "crypto profit factor", "bitcoin strategy tester"],
    openGraph: {
        title: "Crypto Strategy Analyzer — NodoQuant",
        description: "Does your crypto strategy have a real edge? Analyze it free with NodoQuant.",
    },
};

const STEPS = [
    { number: "1", title: "Export your crypto trade history", description: "Download your closed trades CSV from Binance, Bybit, Kraken, or any crypto exchange. Most platforms offer this under Account → Trade History." },
    { number: "2", title: "Upload to NodoQuant", description: "Drop the file into the analyzer. Our parser handles multiple exchange formats and normalizes columns automatically." },
    { number: "3", title: "Get your Strategy Score", description: "Receive a full quant report: Strategy Score, Equity Curve, Win Rate, Profit Factor, Expectancy, Max Drawdown and statistical confidence rating." },
];

const FEATURES = [
    { icon: "₿", title: "Multi-Exchange Support", description: "Compatible with Binance, Bybit, Kraken, OKX and any exchange that exports CSV trade history." },
    { icon: "📊", title: "Strategy Score (0–100)", description: "A single score capturing edge strength, risk-adjusted performance, and how statistically reliable your cryptocurrency strategy is." },
    { icon: "📈", title: "Equity Curve Visualization", description: "See your cumulative P&L over time. Identify if your crypto strategy is trending up or driven by luck." },
    { icon: "🎯", title: "Win Rate & Expectancy", description: "Calculate your true win rate and expected value per trade — the foundation of any profitable crypto system." },
    { icon: "⚠️", title: "Drawdown Analysis", description: "Understand the worst drawdown your strategy produced so you can assess if it fits your risk tolerance." },
    { icon: "🧪", title: "Statistical Confidence", description: "Know whether your results are statistically meaningful or just noise from a small sample of trades." },
];

const FAQS = [
    { q: "Which crypto exchanges are supported?", a: "Any exchange that exports trade history as CSV — including Binance, Bybit, OKX, Kraken, and Bitget. We also accept generic CSV formats." },
    { q: "Can I analyze spot and futures trades?", a: "Yes. NodoQuant analyzes both spot and derivatives (futures/perps) trade histories from major exchanges. You can also connect Binance directly using read-only API keys." },
    { q: "How many crypto trades do I need for a reliable analysis?", a: "At least 30 trades for basic results, 100+ for high-confidence strategy evaluation. We display a warning if your sample is too small." },
    { q: "Is my crypto portfolio data secure?", a: "Your upload contains only historical trade records — no API keys, balances or personal information are required. If using Binance API import, keys are used in-request only and never stored." },
    { q: "Can I test my Bitcoin or altcoin strategies?", a: "Yes. Any cryptocurrency pair is supported — BTC, ETH, SOL, altcoins and derivatives. Results are currency-agnostic." },
];

function SampleScoreCard() {
    const s = CRYPTO_SAMPLE;
    const tier = { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", label: "Strong Edge" };
    return (
        <section className="mb-16">
            <h2 className="text-2xl font-bold text-white text-center mb-2">Example strategy report</h2>
            <p className="text-sm text-center mb-8" style={{ color: "#6b7280" }}>
                This is what your analysis looks like — generated from real BTC trading data.
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
                        <span style={{ fontSize: "10px", color: "#6b7280", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase" }}>Crypto Analysis</span>
                    </div>
                    <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px", fontWeight: "500" }}>{s.strategyName}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "18px", padding: "18px", borderRadius: "14px", background: tier.bg, border: `1.5px solid ${tier.border}`, marginBottom: "18px" }}>
                        <div style={{ textAlign: "center", minWidth: "72px" }}>
                            <div style={{ fontSize: "52px", fontWeight: "900", lineHeight: "1", color: tier.color }}>{s.score}</div>
                            <div style={{ fontSize: "10px", fontWeight: "700", color: tier.color, marginTop: "3px" }}>/ 100</div>
                        </div>
                        <div>
                            <div style={{ fontSize: "17px", fontWeight: "800", color: tier.color, marginBottom: "3px" }}>{tier.label}</div>
                            <div style={{ fontSize: "11px", color: "#6b7280" }}>Strategy Score · {s.totalTrades} trades</div>
                        </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "18px" }}>
                        {[
                            { label: "Win Rate", value: `${s.winRate}%`, good: s.winRate >= 50 },
                            { label: "Profit Factor", value: s.profitFactor.toFixed(2), good: s.profitFactor >= 1.5 },
                            { label: "Expectancy", value: `+${s.expectancy}R`, good: true },
                            { label: "Max Drawdown", value: `${s.maxDrawdown}%`, good: s.maxDrawdown <= 20 },
                        ].map(m => (
                            <div key={m.label} style={{ background: "#f9fafb", borderRadius: "10px", padding: "10px 12px", border: "1px solid #f3f4f6" }}>
                                <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "600", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.label}</div>
                                <div style={{ fontSize: "18px", fontWeight: "800", color: m.good ? "#059669" : "#dc2626" }}>{m.value}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ paddingTop: "14px", borderTop: "1px solid #f3f4f6", textAlign: "center" }}>
                        <span style={{ fontSize: "11px", color: "#9ca3af" }}>nodoquant.com · Crypto strategy analyzed with NodoQuant</span>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default function CryptoStrategyAnalyzerPage({ params }: { params: { locale: string } }) {
    const ld = faqJsonLd(FAQS);
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld }} />
            <SeoLandingTemplate
                badge="₿ Crypto Strategy Analyzer"
                headline="Does Your Crypto Strategy Have a Real Statistical Edge?"
                subheadline="Upload your Binance, Bybit or exchange trade history and get a complete quantitative analysis in under 60 seconds. Free, private and instant."
                ctaLabel="Analyze my crypto strategy — free"
                steps={STEPS}
                features={FEATURES}
                faqs={FAQS}
                analyzerHref={`/${params.locale}/analyzer`}
                sampleSection={<SampleScoreCard />}
            />
        </>
    );
}
