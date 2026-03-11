import { getSupabaseServer } from "@/lib/supabase";
import { notFound } from "next/navigation";
import CertificateCard from "@/components/strategy/CertificateCard";
import CertificateActions from "@/components/strategy/CertificateActions";
import Link from "next/link";
import { Metadata } from "next";
import { trackEvent } from "@/lib/analytics";

interface Props {
    params: {
        locale: string;
        report_id: string;
    };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const supabase = getSupabaseServer();
    if (!supabase) return { title: "NodoQuant" };

    const { data: report } = await supabase
        .from("trade_analysis")
        .select("metrics_json")
        .or(`id.eq.${params.report_id},public_id.eq.${params.report_id}`)
        .single();

    if (!report) return { title: "Certificate Not Found — NodoQuant" };

    const metrics = report.metrics_json as any;
    const score = Math.round(metrics?.strategy_score ?? metrics?.quant_score ?? 0);

    return {
        title: `Strategy Score: ${score} — NodoQuant Certified`,
        description: `Verified trading strategy analysis with a score of ${score}/100. View performance metrics and statistical robustness.`,
        openGraph: {
            images: [`/api/og/certificate?id=${params.report_id}`],
        },
        twitter: {
            card: "summary_large_image",
            images: [`/api/og/certificate?id=${params.report_id}`],
        }
    };
}

export default async function CertificatePage({ params }: Props) {
    const supabase = getSupabaseServer();
    if (!supabase) return <div>Database error</div>;

    // We support both UUID and short public_id for flexibility
    const { data: report, error } = await supabase
        .from("trade_analysis")
        .select(`
            id,
            public_id,
            dataset_name,
            file_name,
            trades_count,
            winrate,
            profit_factor,
            metrics_json,
            is_public,
            strategies ( name )
        `)
        .or(`id.eq.${params.report_id},public_id.eq.${params.report_id}`)
        .single();

    if (error || !report) notFound();

    const metrics = report.metrics_json as any ?? {};
    const score = metrics?.strategy_score ?? metrics?.quant_score ?? 0;
    const wr = report.winrate ?? metrics?.win_rate ?? metrics?.winrate ?? 0;
    const pf = report.profit_factor ?? metrics?.profit_factor ?? 0;
    const trades = report.trades_count ?? metrics?.total_trades ?? 0;
    const strategyName = (report.strategies as any)?.name ?? report.dataset_name ?? report.file_name ?? "Report";

    const data = {
        strategy_name: strategyName,
        score,
        market: metrics?.market ?? "Dynamic",
        symbol: metrics?.symbol ?? "Multi-Asset",
        win_rate: wr,
        profit_factor: pf,
        trades
    };

    // Track certificate view
    await trackEvent('certificate_view', {
        report_id: report.id,
        score,
        strategy_name: strategyName
    });

    return (
        <main className="min-h-screen bg-[#07090F] flex flex-col items-center justify-center py-20 px-4">
            <div className="max-w-[1200px] w-full">
                {/* Branding / Return Link */}
                <div className="flex justify-between items-center mb-12">
                    <Link href={`/${params.locale}`} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center rotate-3">
                            <span className="text-lg font-black text-white italic">N</span>
                        </div>
                        <span className="text-xl font-bold text-white tracking-tighter">NodoQuant</span>
                    </Link>
                    <Link
                        href={`/${params.locale}/report/${report.public_id}`}
                        className="text-xs font-black text-gray-400 hover:text-indigo-400 uppercase tracking-widest transition-colors flex items-center gap-2"
                    >
                        View full strategy analysis
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>

                {/* The Certificate Card */}
                <div className="shadow-[0_0_100px_rgba(79,70,229,0.15)] rounded-2xl overflow-hidden">
                    <CertificateCard data={data} />
                </div>

                {/* Actions */}
                <CertificateActions
                    report_id={report.id}
                    score={score}
                    winrate={wr}
                    pf={pf}
                    trades={trades}
                    locale={params.locale}
                />

                {/* Secondary CTA */}
                <div className="mt-20 text-center">
                    <p className="text-gray-500 font-medium mb-6">Want to certify your own trading edge?</p>
                    <Link
                        href={`/${params.locale}/analyzer`}
                        className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest border border-white/5 transition-all"
                    >
                        Analyze My Strategy
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </Link>
                </div>
            </div>
        </main>
    );
}
