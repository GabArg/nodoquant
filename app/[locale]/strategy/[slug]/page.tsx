import { getSupabaseServer } from "@/lib/supabase";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import StrategyDetailView from "@/components/strategy/StrategyDetailView";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/auth/server";
import { canAccessStrategyProfile, isStrategyProfileIndexable } from "@/lib/auth/reportAccess";

export const dynamic = "force-dynamic";

const SAFE_SLUG_REGEX = /^[a-zA-Z0-9_-]+$/;

interface Props {
    params: { slug: string; locale: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const slug = params.slug;
    if (!slug || !SAFE_SLUG_REGEX.test(slug)) {
        return {
            title: "Strategy Not Found — NodoQuant",
            robots: { index: false, follow: false },
        };
    }

    const authClient = createClient();
    const { data: { user } } = await authClient.auth.getUser();

    const supabase = getSupabaseServer();
    if (!supabase) return { title: "Strategy Analysis" };

    const { data: strategy } = await supabase
        .from("public_strategy_profiles")
        .select("strategy_name, description, symbol, score, visibility, user_id")
        .eq("slug", slug)
        .single();

    if (!strategy || !canAccessStrategyProfile(strategy, user?.id)) {
        return {
            title: "Strategy Not Found — NodoQuant",
            robots: { index: false, follow: false },
        };
    }

    const title = `${strategy.strategy_name} (Score ${strategy.score}/100) — Strategy Profile | NodoQuant`;
    const desc = strategy.description || `View quantitative performance analysis and robustness metrics for the ${strategy.strategy_name} trading strategy.`;
    const isIndexable = isStrategyProfileIndexable(strategy);

    return {
        title,
        description: desc,
        robots: isIndexable ? undefined : { index: false, follow: false },
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
        alternates: isIndexable ? {
            canonical: `https://nodoquant.com/${params.locale}/strategy/${params.slug}`,
        } : undefined
    };
}

export default async function StrategyPublicPage({ params }: Props) {
    const slug = params.slug;
    if (!slug || !SAFE_SLUG_REGEX.test(slug)) return notFound();

    const supabase = getSupabaseServer();
    if (!supabase) return notFound();

    const authClient = createClient();
    const { data: { user } } = await authClient.auth.getUser();

    const t = await getTranslations({ locale: params.locale, namespace: "strategies.profile" });

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
        .eq("slug", slug)
        .single();

    if (error || !strategy || !canAccessStrategyProfile(strategy, user?.id)) {
        return notFound();
    }

    // JSON-LD Structured Data (Dataset) - Only emit for indexable/public strategies
    const isIndexable = isStrategyProfileIndexable(strategy);
    const jsonLd = isIndexable ? {
        "@context": "https://schema.org",
        "@type": "Dataset",
        "name": strategy.strategy_name,
        "description": strategy.description || t("defaultDescription"),
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
    } : null;

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <StrategyDetailView
                strategy={strategy}
                locale={params.locale}
            />
        </>
    );
}
