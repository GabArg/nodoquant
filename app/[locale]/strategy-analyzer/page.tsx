import type { Metadata } from "next";
import SeoLandingTemplate from "@/components/nodoquant/SeoLandingTemplate";
import { faqJsonLd } from "@/lib/seo/faqJsonLd";
import { EDGE_SAMPLE } from "@/lib/seo/sampleData";

export const metadata: Metadata = {
    title: "Trading Strategy Analyzer — Discover Your Real Trading Edge | NodoQuant",
    description: "Analyze any trading strategy instantly. Upload your trade history from MT4, MT5, or any CSV. Calculate Win Rate, Profit Factor, Expectancy, and Max Drawdown with our free strategy analyzer tool.",
    keywords: ["trading strategy analyzer", "analyze trading strategy", "forex strategy analyzer", "crypto strategy analyzer", "strategy performance analysis", "backtest analyzer"],
    openGraph: {
        title: "Trading Strategy Analyzer — NodoQuant",
        description: "Does your trading strategy actually work? Find out with our professional-grade strategy analysis tool.",
        type: "website",
    },
    alternates: {
        canonical: "https://nodoquant.com/en/strategy-analyzer",
    }
};

const STEPS = [
    { number: "1", title: "Export CSV Data", description: "Export your trade history from your broker or platform as a CSV or Excel file. We support MT4, MT5, and most major standard formats." },
    { number: "2", title: "Automatic Parsing", description: "Upload your file to NodoQuant. Our system automatically normalizes dates, symbols, and P&L into R-multiples for standardized analysis." },
    { number: "3", title: "Get Your Score", description: "Instantly view your Strategy Score (0-100) along with detailed metrics on win rate, profit factor, and drawdowns." },
];

const FEATURES = [
    { icon: "📉", title: "Risk-Adjusted Performance", description: "We don't just look at total profit. We analyze your returns relative to the risk taken, giving you a true picture of your edge." },
    { icon: "🎯", title: "Win Rate vs Expectancy", description: "Understand the relationship between how often you win and your average win/loss size. This is the key to long-term profitability." },
    { icon: "🛡️", title: "Drawdown Protection", description: "Analyze your worst periods to ensure your strategy is survivable during inevitable market shifts and high volatility." },
    { icon: "💰", title: "Profit Factor Insights", description: "Calculate your gross profit over gross loss. A profit factor above 1.5 indicates a high-probability professional system." },
    { icon: "📊", title: "R-Multiple Normalization", description: "We convert all trades to R-units so you can compare performance across different account sizes and risk levels fairly." },
    { icon: "🚀", title: "Actionable Insights", description: "Identify which symbols, market sessions, or trade types are dragging down your performance and which ones are your winners." },
];

const FAQS = [
    { q: "What is a Trading Strategy Analyzer?", a: "A trading strategy analyzer is a software tool used by professional traders to evaluate the statistical performance of their trading history. It identifies whether profits are due to luck or a genuine edge." },
    { q: "How many trades are needed to evaluate a strategy?", a: "Statistically, you need at least 30 trades for a basic signal, but 100+ trades are recommended for high-confidence results. More data helps filter out randomness (variance)." },
    { q: "What is a good profit factor?", a: "A profit factor above 1.0 means you are profitable. A profit factor above 1.5 is considered excellent, and above 2.0 is considered world-class." },
    { q: "What is trading expectancy?", a: "Expectancy is the average amount you expect to win (or lose) per trade. It is calculated as (Win Rate × Avg Win) − (Loss Rate × Avg Loss). Positive expectancy is mandatory for success." },
];

export default function StrategyAnalyzerPage({ params }: { params: { locale: string } }) {
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
                        description: "Advanced trading strategy analysis tool for Forex and Crypto traders.",
                    }),
                }}
            />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd(FAQS) }} />

            <SeoLandingTemplate
                badge="💎 Professional Analyzer"
                headline="Trading Strategy Analyzer — Discover Your Real Trading Edge"
                subheadline="Stop guessing if your strategy works. Upload your trade history and get professional-grade quantitative analysis in under 60 seconds. Calculate your Win Rate, Profit Factor, and Expectancy for free."
                ctaLabel="Analyze My Strategy Now — Free"
                steps={STEPS}
                features={FEATURES}
                faqs={FAQS}
                analyzerHref={`/${params.locale}/analyzer`}
                sampleSection={<SampleContent />}
            />
        </>
    );
}

function SampleContent() {
    return (
        <section className="mt-12 text-gray-300 space-y-12">
            <div className="prose prose-invert max-w-none">
                <h2 className="text-3xl font-bold text-white mb-6">What is a Trading Strategy Analyzer?</h2>
                <p>
                    A **Trading Strategy Analyzer** is the most critical tool in a professional trader's arsenal. While most retail traders focus on finding the "perfect entry," professional traders focus on **expectancy** and **risk-adjusted returns**. An analyzer takes your raw trade history and transforms it into actionable statistical data.
                </p>
                <p>
                    By using NodoQuant, you can determine if your recent winning streak was the result of a genuine **Trading Edge** or simply a streak of good luck within a random distribution. Conversely, an analyzer can show you if a losing streak is simply a normal statistical drawdown or a sign that your strategy no longer works in the current market environment.
                </p>

                <h3 className="text-2xl font-bold text-white mt-8 mb-4">How to Analyze Your Trading Strategy Step-by-Step</h3>
                <p>
                    Evaluating a strategy requires more than just looking at your account balance. Follow these steps to perform a professional audit:
                </p>
                <ol className="list-decimal pl-6 space-y-2">
                    <li>**Collect Data**: Export at least 50-100 trades from your broker (MT4, MT5, TradingView, or Binance).</li>
                    <li>**Normalize to R**: Convert your P&L into R-multiples (Risk units). This removes the bias of changing position sizes.</li>
                    <li>**Calculate Expectancy**: Use the formula: `(Win Rate % * Avg Win) - (Loss Rate % * Avg Loss)`.</li>
                    <li>**Identify Variance**: Check your maximum drawdown to see if your emotional capital can handle the strategy's volatility.</li>
                </ol>

                <h3 className="text-2xl font-bold text-white mt-8 mb-4">Why Strategy Analysis Matters for Your P&L</h3>
                <p>
                    Without analysis, you are flying blind. Most traders abandon good strategies during a normal drawdown because they don't understand their strategy's **Max Drawdown** profile. On the other hand, they keep trading broad-market systems that have lost their edge because they aren't monitoring their **Strategy Score**.
                </p>
                <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-6 my-8">
                    <h4 className="text-indigo-400 font-bold mb-2">Key Pro Tip:</h4>
                    <p className="text-sm italic">
                        "Professional trading is not about being right; it's about being profitable. A strategy analyzer shifts your focus from the 'outcome' of a single trade to the 'process' of a series of trades."
                    </p>
                </div>

                <div className="flex flex-col items-center gap-6 my-16 py-12 border-y border-white/5">
                    <h2 className="text-3xl font-bold text-white text-center">Ready to see your real numbers?</h2>
                    <a href="/analyzer" className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-2xl font-black text-xl transition-all shadow-2xl shadow-indigo-500/20">
                        Analyze My Strategy Now
                    </a>
                    <div className="flex gap-8 text-sm text-gray-500">
                        <span className="flex items-center gap-2">✅ Multi-broker support</span>
                        <span className="flex items-center gap-2">✅ Instant results</span>
                        <span className="flex items-center gap-2">✅ Free forever</span>
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-white mb-6">Comparing Strategy Analyzers vs. Trading Journals</h2>
                <p>
                    While a trading journal is great for tracking your emotions and specific trade setups, a **Strategy Analyzer** like NodoQuant is focused on the quantitative output. Journals tell you *what* happened; Analyzers tell you *why* it's profitable (or not) from a mathematical standpoint.
                </p>
                <table className="w-full border-collapse border border-white/10 mt-6 overflow-hidden rounded-xl">
                    <thead>
                        <tr className="bg-white/5">
                            <th className="p-4 border border-white/10 text-left">Feature</th>
                            <th className="p-4 border border-white/10 text-left">Trading Journal</th>
                            <th className="p-4 border border-white/10 text-left">Strategy Analyzer</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="p-4 border border-white/10 font-bold">Primary Goal</td>
                            <td className="p-4 border border-white/10 text-gray-400">Behavioral tracking</td>
                            <td className="p-4 border border-white/10 text-emerald-400 font-medium">Statistical verification</td>
                        </tr>
                        <tr>
                            <td className="p-4 border border-white/10 font-bold">Data Focus</td>
                            <td className="p-4 border border-white/10 text-gray-400">Screenshots & Notes</td>
                            <td className="p-4 border border-white/10 text-emerald-400 font-medium">P&L & R-multiples</td>
                        </tr>
                        <tr>
                            <td className="p-4 border border-white/10 font-bold">Key Metric</td>
                            <td className="p-4 border border-white/10 text-gray-400">Emotion score</td>
                            <td className="p-4 border border-white/10 text-emerald-400 font-medium">Expectancy & Profit Factor</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="text-center py-20 pb-0">
                <Link href="/analyzer" className="text-indigo-400 hover:text-indigo-300 font-bold underline underline-offset-8">
                    Upload your real trades and analyze your strategy →
                </Link>
            </div>
        </section>
    );
}
import Link from "next/link";
