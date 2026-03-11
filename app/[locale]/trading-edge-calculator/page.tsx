import type { Metadata } from "next";
import SeoLandingTemplate from "@/components/nodoquant/SeoLandingTemplate";
import { faqJsonLd } from "@/lib/seo/faqJsonLd";
import EdgeCalculator from "@/components/nodoquant/EdgeCalculator";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Trading Edge Calculator — Know If Your Strategy Is Profitable | NodoQuant",
    description: "Calculate your trading expectancy and profit factor with our free trading edge calculator. Learn the formula for success and understand how win rate and risk-reward ratio impact your long-term returns.",
    keywords: ["trading edge calculator", "expectancy calculator trading", "profit factor calculator", "trading expectancy formula", "win rate calculator", "trading edge meaning", "calculate trading edge"],
    openGraph: {
        title: "Trading Edge Calculator — NodoQuant",
        description: "Calculate your trading strategy's statistical edge: Expectancy, Profit Factor, Win Rate and more — free.",
    },
    alternates: {
        canonical: "https://nodoquant.com/en/trading-edge-calculator",
    }
};

const STEPS = [
    { number: "1", title: "Enter Your Stats", description: "Use our interactive tool below to input your win rate, average win size, and average loss size to see your potential expectancy." },
    { number: "2", title: "Upload Real Data", description: "While a calculator is great for estimates, NodoQuant allows you to upload actual trade history for a precise calculation based on real performance." },
    { number: "3", title: "Identify Your Edge", description: "Our system calculates your Strategy Score, identifying if your system has a genuine edge or if you are simply experiencing variance." },
];

const FEATURES = [
    { icon: "🧮", title: "Expectancy Calculator", description: "Your expected gain or loss per trade, calculated from actual or estimated trade data. Positive expectancy is the foundation of trading." },
    { icon: "⚡", title: "Profit Factor", description: "The ratio of gross profits to gross losses. A critical metric for sustainability. Anything above 1.5 is considered high-tier." },
    { icon: "🎯", title: "Win Rate Analysis", description: "See how your winning percentage interacts with your risk-reward ratio. You don't need a high win rate to be profitable." },
    { icon: "📉", title: "Drawdown Awareness", description: "Estimate your potential capital risk. Understanding drawdown is key to staying in the game during losing streaks." },
    { icon: "💎", title: "Edge Score (0–100)", description: "Get a single, easy-to-understand score that measures the overall robustness and reliability of your trading edge." },
    { icon: "📊", title: "R-Multiple Logic", description: "Learn to think in terms of risk units (R) instead of dollars, the secret language of professional multi-market traders." },
];

const FAQS = [
    { q: "What is a trading edge?", a: "A trading edge is a statistical advantage that makes your strategy profitable over a large enough sample of trades. It means that the probability of success is higher than the probability of failure, combined with a favorable risk-to-reward ratio." },
    { q: "What is the formula for trading expectancy?", a: "Expectancy = (Win Rate × Average Win) - (Loss Rate × Average Loss). If the result is positive, your strategy has an edge." },
    { q: "What is a good profit factor?", a: "A profit factor above 1.0 means you're profitable. Above 1.5 is great, and above 2.0 is considered professional grade." },
    { q: "How many trades do I need for a reliable calculation?", a: "Industry experts recommend at least 100 trades to have high statistical confidence. Smaller samples are often skewed by variance (luck)." },
    { q: "Can I use this calculator for Forex and Crypto?", a: "Yes. Trading expectancy and edge calculations are market-agnostic. They work for Forex, stocks, crypto, and futures equally." },
];

export default function TradingEdgeCalculatorPage({ params }: { params: { locale: string } }) {
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
                        description: "Free interactive trading edge and expectancy calculator for market speculators.",
                    }),
                }}
            />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd(FAQS) }} />

            <SeoLandingTemplate
                badge="🧮 Statistical Calculator"
                headline="Trading Edge Calculator — Know If Your Strategy Is Profitable"
                subheadline="Use our interactive tool to calculate your statistical edge. Discover your expectancy, profit factor, and whether your risk-reward ratio is sustainable for long-term growth."
                ctaLabel="Calculate My Real Edge — Free"
                steps={STEPS}
                features={FEATURES}
                faqs={FAQS}
                analyzerHref={`/${params.locale}/analyzer`}
                sampleSection={<CalculatorSection locale={params.locale} />}
            />
        </>
    );
}

function CalculatorSection({ locale }: { locale: string }) {
    return (
        <section className="mt-16 text-gray-300">
            <h2 className="text-3xl font-bold text-white text-center mb-4">Interactive Edge Calculator</h2>
            <p className="text-center mb-10 max-w-2xl mx-auto text-gray-400">
                Adjust the sliders and values to see how different metrics impact your strategy's expectancy.
            </p>

            <EdgeCalculator />

            <div className="prose prose-invert max-w-none mt-16">
                <h2 className="text-3xl font-bold text-white mb-6">What is a Trading Edge?</h2>
                <p>
                    In the world of professional speculation, a **Trading Edge** is much more than a "cool setup" or an "indicator signal." A genuine edge is a **statistical advantage** that allows you to profit over an extended series of trades. Without an edge, you are essentially gambling at a casino where the house has the advantage.
                </p>
                <p>
                    Having an edge means your **Expectancy** is positive. This implies that for every dollar you put into the market, you expect to receive that dollar back plus a surplus.
                </p>

                <h3 className="text-2xl font-bold text-white mt-8 mb-4">How to Calculate Your Trading Expectancy</h3>
                <p>
                    Expectancy is the holy grail of trading math. It combines your **Win Rate** and your **Average Risk-to-Reward Ratio**. The most common formula used by quantitative firms is:
                </p>
                <div className="bg-white/5 border border-white/10 rounded-xl p-8 my-6 text-center">
                    <code className="text-xl text-indigo-400 font-bold">
                        Expectancy = (Win Rate % * Avg Win) - (Loss Rate % * Avg Loss)
                    </code>
                </div>
                <p>
                    Example: If you win 40% of the time, and your average win is $300 while your average loss is $100:
                    <br />
                    `Expectancy = (0.40 * 300) - (0.60 * 100) = 120 - 60 = $60`.
                    <br />
                    This means you earn an average of **$60 per trade** across a large enough sample size.
                </p>

                <h3 className="text-2xl font-bold text-white mt-8 mb-4">Why the Calculator is Not Enough</h3>
                <p>
                    A calculator like the one above is perfect for **planning** and **forecasting**. However, the market rarely behaves as perfectly as a spreadsheet. Real-world issues such as **slippage**, **commissions**, and **emotional errors** (cutting winners early or letting losers run) can destroy a theoretical edge.
                </p>
                <p>
                    This is why professional traders use NodoQuant to analyze their **actual trade history**. By uploading your real trades, you move from "theory" to "reality."
                </p>

                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 my-12 flex flex-col items-center">
                    <h4 className="text-white text-xl font-bold mb-4">Do you have 30+ trades in a CSV file?</h4>
                    <p className="text-center text-gray-400 mb-6">
                        Stop guessing your stats. Get your real Strategy Score and see your equity curve now.
                    </p>
                    <a href={`/${locale}/analyzer`} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-xl shadow-emerald-500/20">
                        Upload My Trade History
                    </a>
                </div>

                <h2 className="text-3xl font-bold text-white mb-6">The Relationship Between Win Rate and R:R</h2>
                <p>
                    One of the biggest mistakes novice traders make is obsessing over a high win rate. In reality, a strategy with a 25% win rate can be significantly more profitable than one with a 90% win rate if the reward-to-risk ratio is high enough.
                </p>
                <p>
                    Our **Profit Factor Calculator** metrics (included in our analyzer) show you exactly how these two variables interact. A high profit factor (above 1.5) usually comes from a healthy balance between consistency and payout size.
                </p>

                <h3 className="text-2xl font-bold text-white mt-8 mb-4">Key Metrics for Your Edge Report</h3>
                <ul className="list-disc pl-6 space-y-3">
                    <li>**Profit Factor**: Gross Profit / Gross Loss. Needs to be {'>'} 1.0.</li>
                    <li>**Standard Deviation of Returns**: Measures how volatile your equity curve is.</li>
                    <li>**System Robustness**: How well your edge holds up during different market conditions.</li>
                    <li>**Kelly Criterion**: A formula to determine the optimal size for each trade to maximize growth without ruining the account.</li>
                </ul>
            </div>

            <div className="text-center py-20 pb-0 flex flex-col items-center gap-8">
                <Link href="/pricing" className="text-gray-500 hover:text-gray-400 text-sm">
                    View Pricing & Plans
                </Link>
                <Link href="/analyzer" className="text-indigo-400 hover:text-indigo-300 font-bold underline underline-offset-8">
                    Calculate your edge with real trade data →
                </Link>
            </div>
        </section>
    );
}
