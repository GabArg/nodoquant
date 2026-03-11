import type { Metadata } from "next";
import SeoLandingTemplate from "@/components/nodoquant/SeoLandingTemplate";
import { faqJsonLd } from "@/lib/seo/faqJsonLd";
import { FOREX_SAMPLE } from "@/lib/seo/sampleData";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Forex Strategy Analyzer — Test Your Trading Edge | NodoQuant",
    description: "Analyze your Forex trading strategy with statistical precision. Upload MT4/MT5 trade history and calculate Win Rate, Profit Factor, Expectancy, and Max Drawdown for EURUSD, GBPUSD, and more. Free and safe.",
    keywords: ["forex strategy analyzer", "EURUSD strategy analysis", "forex expectancy calculator", "MT4 strategy analysis", "MT5 trading analyzer", "forex trading edge", "pips to r calculator"],
    openGraph: {
        title: "Forex Strategy Analyzer — NodoQuant",
        description: "Does your Forex strategy have a real statistical edge? Analyze your MT4/MT5 data today.",
    },
    alternates: {
        canonical: "https://nodoquant.com/en/forex-strategy-analyzer",
    }
};

const STEPS = [
    { number: "1", title: "Export MT4/MT5 History", description: "Save your trade history as an HTML or CSV file from Metatrader 4 or 5. We also support standard broker formats through our smart parser." },
    { number: "2", title: "Smart Data Normalization", description: "NodoQuant converts pips and currency gains into R-multiples. This allows you to evaluate your edge independently of position sizing or leverage changes." },
    { number: "3", title: "Professional Auditing", description: "Get a full quantitative report showing your real win rate, profit factor, max drawdown, and expectancy per trade." },
];

const FEATURES = [
    { icon: "🌍", title: "Global FX Support", description: "Analyze majors (EURUSD, GBPUSD), minors, and exotics. Filter performance by symbol to find which pairs you trade best." },
    { icon: "📈", title: "Expectancy per Pip", description: "Understand how much you or your EA expects to earn per trade in relation to the risk taken. Positive expectancy is non-negotiable." },
    { icon: "🛡️", title: "Drawdown Risk Analysis", description: "Forex markets are volatile. We calculate your worst-case peak-to-trough decline so you can manage your leverage safely." },
    { icon: "📊", title: "Metatrader Native Support", description: "Our parser is optimized for MT4/MT5 reports. Simply drag and drop your history file directly into the analyzer." },
    { icon: "🔬", title: "Statistical Confidence", description: "Never trust a strategy with a small sample size. We flag datasets with under 50 trades to warn you about potential randomness." },
    { icon: "💎", title: "Strategy Score", description: "A single number from 0 to 100 that tells you if your system is professional-grade, average, or high-risk." },
];

const FAQS = [
    { q: "How do I analyze an MT4/MT5 strategy?", a: "Go to your 'Account History' tab in Metatrader, right-click and select 'Save as Detailed Report'. Then upload that HTML or CSV file to NodoQuant." },
    { q: "Is pip-based analysis better than R-multiple analysis?", a: "No. Professional traders use R-multiples (risk-adjusted units) because pips don't account for stop-loss distance or position size. R-multiples provide the only true measure of an edge." },
    { q: "Can I analyze Myfxbook or MetaStats data?", a: "Yes, if you can export the data to CSV. NodoQuant is designed to be the next step beyond basic journals, providing deeper quantitative insights." },
    { q: "What is a good profit factor for Forex trading?", a: "In the FX market, a profit factor between 1.2 and 1.8 is considered healthy. Anything consistently above 2.0 is exceptionally strong." },
    { q: "Is EURUSD analysis supported specifically?", a: "Yes. You can use our pair filtering to analyze only EURUSD trades and see if your edge differs between pairs." },
];

export default function ForexStrategyAnalyzerPage({ params }: { params: { locale: string } }) {
    const s = FOREX_SAMPLE;
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
                        description: "Professional Forex strategy analysis and expectancy calculator.",
                    }),
                }}
            />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd(FAQS) }} />

            <SeoLandingTemplate
                badge="🌍 Forex Specialist"
                headline="Forex Strategy Analyzer — Analyze Your Real Trading Edge"
                subheadline="Upload your Metatrader (MT4/MT5) trade history and instantly calculate your Win Rate, Profit Factor, and Expectancy. Stop guessing and start trading with statistical confidence."
                ctaLabel="Analyze My Forex Strategy — Free"
                steps={STEPS}
                features={FEATURES}
                faqs={FAQS}
                analyzerHref={`/${params.locale}/analyzer`}
                sampleSection={<ForexContent locale={params.locale} />}
            />
        </>
    );
}

function ForexContent({ locale }: { locale: string }) {
    return (
        <section className="mt-12 text-gray-300 space-y-12">
            <div className="prose prose-invert max-w-none">
                <h2 className="text-3xl font-bold text-white mb-6">What is a Forex Strategy Analyzer?</h2>
                <p>
                    A **Forex Strategy Analyzer** is a quantitative tool designed specifically for the unique characteristics of the foreign exchange market. Unlike standard equity calculators, an FX analyzer must handle 24/5 liquidity, varying leverage, and the ability to measure performance across different currency pairs like EURUSD, GBPJPY, or AUDUSD.
                </p>
                <p>
                    For Metatrader users (MT4/MT5), NodoQuant provides an automated way to transform a "Detailed Report" into a professional quantitative audit. We strip away the noise and focus on the math that drives long-term profitability.
                </p>

                <h3 className="text-2xl font-bold text-white mt-8 mb-4">Why Forex Traders Fail (And How Analysis Fixes It)</h3>
                <p>
                    The #1 reason Forex traders lose money is not "bad entries." It is **poor risk management combined with a lack of statistical awareness**. Many traders have a strategy that *seems* to work until they hit a normal series of losses and abandon the system.
                </p>
                <p>
                    By using our **Forex Expectancy Calculator**, you learn the limits of your strategy. If you know your system has a Max Drawdown of 15% over 500 trades, you won't panic when you lose 8% in a single week—you'll know it's within the statistical norm.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-12">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h4 className="text-indigo-400 font-bold mb-3">MT4/MT5 Compatibility</h4>
                        <p className="text-sm text-gray-400">
                            Simply export your history as a 'report' from the Metatrader terminal. We handle the rest. No manual data entry required.
                        </p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h4 className="text-emerald-400 font-bold mb-3">Pair Filtering</h4>
                        <p className="text-sm text-gray-400">
                            Analyze EURUSD breakout strategies separately from your Yen-pair carry trades. Find your niche.
                        </p>
                    </div>
                </div>

                <h3 className="text-2xl font-bold text-white mt-8 mb-4">Mastering the EURUSD Strategy Analysis</h3>
                <p>
                    The EURUSD is the most liquid pair in the world, and many traders focus exclusively on it. However, the dynamics of EURUSD are different from GPBJPY scalping. A high-quality **Forex Analyzer** allows you to see if your edge remains consistent across sessions (London vs. New York) and symbols.
                </p>
                <p>
                    Check your **Expectancy per Trade** specifically for your EURUSD setups. Are they actually funding your other trading experiments, or are they your main alpha source? NodoQuant tells you the truth.
                </p>

                <div className="flex flex-col items-center gap-6 my-16 py-12 bg-indigo-600/10 border-y border-indigo-500/20">
                    <h2 className="text-3xl font-bold text-white text-center">Analyze your Forex EA or Manual History</h2>
                    <a href={`/${locale}/analyzer`} className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-2xl font-black text-xl transition-all">
                        Upload My Forex trades
                    </a>
                    <p className="text-xs text-gray-500">Supports Metatrader, TradingView, and Standard Broker CSVs</p>
                </div>

                <h2 className="text-3xl font-bold text-white mb-6">Key Quantitative Metrics for FX Trading</h2>
                <ul className="list-disc pl-6 space-y-4">
                    <li>**Strategy Score (0–100)**: Our proprietary metric for overall edge quality.</li>
                    <li>**Profit Factor**: Ratio of gross profit vs. gross loss. Target {'>'} 1.5.</li>
                    <li>**Recovery Factor**: Net Profit / Max Drawdown. Tells you how fast you bounce back from losses.</li>
                    <li>**Expectancy (R)**: The average return per risk unit taken. 0.2R or higher is excellent.</li>
                </ul>

                <h3 className="text-2xl font-bold text-white mt-8 mb-4">Leverage and Your Equity Curve</h3>
                <p>
                    Forex is a highly leveraged market. A strategy that looks great with 1:10 leverage can lead to account ruin at 1:500. By analyzing your **Equity Curve** on NodoQuant, you can visually see the impact of volatility and decide if your position sizing is responsible or reckless.
                </p>
            </div>

            <div className="text-center py-20 pb-0 flex flex-col items-center gap-8">
                <Link href="/leaderboard" className="text-gray-500 hover:text-gray-400 text-sm">
                    View Strategy Leaderboard
                </Link>
                <Link href="/analyzer" className="text-indigo-400 hover:text-indigo-300 font-bold underline underline-offset-8">
                    Analyze your Forex strategy performance now →
                </Link>
            </div>
        </section>
    );
}
