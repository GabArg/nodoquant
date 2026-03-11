import { getSupabaseServer } from "@/lib/supabase";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import StrategyDetailView from "@/components/strategy/StrategyDetailView";

export const dynamic = "force-dynamic";

interface Props {
    params: { slug: string; locale: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const supabase = getSupabaseServer();
    if (!supabase) return { title: "Strategy Analysis" };

    const { data: strategy } = await supabase
        .from("public_strategy_profiles")
        .select("strategy_name, description, symbol, score")
        .eq("slug", params.slug)
        .single();

    if (!strategy) return { title: "Strategy Not Found" };

    const title = `${strategy.strategy_name} (Score ${strategy.score}/100) — Strategy Profile | NodoQuant`;
    const desc = strategy.description || `View quantitative performance analysis and robustness metrics for the ${strategy.strategy_name} trading strategy.`;

    return {
        title,
        description: desc,
        openGraph: {
            title,
            description: desc,
            url: `https://nodoquant.com/${params.locale}/strategy/${params.slug}`,
            siteName: "NodoQuant",
            images: [
                {
                    url: `https://nodoquant.com/api/og/strategy?slug=${params.slug}`,
                    width: 1200,
                    height: 630,
                    alt: title
                }
            ]
        },
        twitter: {
            card: "summary_large_image",
            title,
            description: desc,
            images: [`https://nodoquant.com/api/og/strategy?slug=${params.slug}`],
        },
        alternates: {
            canonical: `https://nodoquant.com/${params.locale}/strategy/${params.slug}`,
        }
    };
}

export default async function StrategyPublicPage({ params }: Props) {
    const supabase = getSupabaseServer();
    if (!supabase) return notFound();

    // 1) Fetch strategy from public_strategy_profiles
    const { data: strategy, error } = await supabase
        .from("public_strategy_profiles")
        .select(`
            *,
            report:trade_analysis (
                metrics_json,
                created_at
            )
        `)
        .eq("slug", params.slug)
        .single();

    if (error || !strategy) return notFound();

    // JSON-LD Structured Data (Dataset)
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Dataset",
        "name": strategy.strategy_name,
        "description": strategy.description || `Trading strategy analysis for ${strategy.symbol}`,
        "identifier": strategy.slug,
        "keywords": [
            strategy.market,
            strategy.symbol,
            "trading strategy",
            "backtest analysis",
            "quant metrics"
        ],
        "creator": {
            "@type": "Organization",
            "name": "NodoQuant"
        },
        "variableMeasured": [
            { "@type": "PropertyValue", "name": "Win Rate", "value": strategy.win_rate },
            { "@type": "PropertyValue", "name": "Profit Factor", "value": strategy.profit_factor },
            { "@type": "PropertyValue", "name": "Strategy Score", "value": strategy.score }
        ]
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <StrategyDetailView
                strategy={strategy}
                locale={params.locale}
            />
        </>
    );
}
