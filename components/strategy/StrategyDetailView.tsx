"use client";

import Link from "next/link";
import EquityCurveChart from "@/components/analyzer/Dashboard/EquityCurveChart";
import { useTranslations } from "next-intl";

interface StrategyDetailViewProps {
    strategy: any;
    locale: string;
}

export default function StrategyDetailView({ strategy, locale }: StrategyDetailViewProps) {
    const t = useTranslations("strategies.profile");
    const tCard = useTranslations("strategies.card");
    const tCommon = useTranslations("fullReport.publishModal");

    const {
        id: strategy_id,
        strategy_name,
        description,
        market,
        symbol,
        score,
        tier,
        win_rate,
        profit_factor,
        expectancy,
        max_drawdown,
        trades_count,
        report,
        report_id
    } = strategy;

    const metrics_json = report?.metrics_json || {};
    const equity_curve = metrics_json?.equity_curve || [];
    const wr = win_rate > 1 ? win_rate : win_rate * 100;

    const shareUrl = typeof window !== 'undefined' ? window.location.href : `https://nodoquant.com/${locale}/strategy/${strategy.slug}`;
    const shareText = t("shareText", {
        score: Math.round(score),
        wr: wr.toFixed(1),
        pf: profit_factor.toFixed(2),
        count: trades_count
    });

    return (
        <main className="min-h-screen bg-[#07090F] pt-24 pb-32 px-4 text-white">
            <div className="max-w-6xl mx-auto">

                {/* Breadcrumbs / Back */}
                <div className="flex justify-between items-center mb-10">
                    <Link
                        href={`/${locale}/strategies`}
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-400 font-bold transition-colors group text-sm"
                    >
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                        {t("backLink")}
                    </Link>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        {t("verifiedLabel")}
                    </div>
                </div>

                {/* Hero Profile Section */}
                <div className="flex flex-col lg:flex-row gap-12 mb-16">
                    <div className="flex-1">
                        <div className="flex flex-wrap gap-3 mb-6">
                            <span className="bg-indigo-500/10 text-indigo-400 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 shadow-sm">
                                {tCommon(`markets.${market}`) || market}
                            </span>
                            <span className="bg-white/5 text-gray-400 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 shadow-sm">
                                {symbol}
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-7xl font-black mb-8 tracking-tighter leading-[1.1]">
                            {strategy_name}
                        </h1>
                        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 mb-8 relative group hover:border-indigo-500/30 transition-all">
                            <div className="absolute top-0 right-0 p-6 opacity-10 font-black text-4xl select-none pointer-events-none italic">"</div>
                            <p className="text-gray-300 text-lg leading-relaxed font-medium">
                                {description || t("defaultDescription")}
                            </p>
                        </div>

                        {/* Social Sharing */}
                        <div className="flex flex-wrap items-center gap-3">
                            <a
                                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-black text-white px-6 py-3 rounded-2xl text-[13px] font-black border border-white/10 hover:border-white/20 transition-all flex items-center gap-3 active:scale-95"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.843L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                {t("shareX")}
                            </a>
                            <a
                                href={`https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(`Strategy Score: ${Math.round(score)}/100 | ${strategy_name}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-[#FF4500] text-white px-6 py-3 rounded-2xl text-[13px] font-black hover:brightness-110 transition-all flex items-center gap-3 active:scale-95"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .89.182 1.207.491 1.207-.856 2.853-1.415 4.674-1.488l.82-3.818a.303.303 0 0 1 .37-.234l2.848.601c.21-.295.556-.491.948-.491zM9.23 12.51c-.657 0-1.188.542-1.188 1.2a1.191 1.191 0 0 0 1.187 1.2c.658 0 1.188-.543 1.188-1.2 0-.658-.53-1.2-1.188-1.2zm5.54 0c-.658 0-1.188.542-1.188 1.2 0 .658.53 1.2 1.188 1.2a1.191 1.191 0 0 0 1.187-1.2c0-.658-.53-1.2-1.187-1.2zm-5.46 3.633a.142.142 0 0 0-.012.019c-.1.144-.124.364.043.483a5.57 5.57 0 0 0 2.659.814 5.57 5.57 0 0 0 2.659-.814.126.126 0 0 0 .043-.483.333.333 0 0 0-.012-.019.167.167 0 0 0-.204-.05c-.11.04-.977.346-2.486.346-1.51 0-2.376-.306-2.486-.346a.167.167 0 0 0-.204.05z" /></svg>
                                Reddit
                            </a>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(shareUrl);
                                    alert(t("copiedAlert"));
                                }}
                                className="bg-white/5 text-gray-300 px-6 py-3 rounded-2xl text-[13px] font-black border border-white/10 hover:bg-white/10 transition-all flex items-center gap-3 active:scale-95"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                {t("copyLink")}
                            </button>
                        </div>
                    </div>

                    <div className="lg:w-[350px]">
                        <div className="bg-[#0A0D14] border-2 border-indigo-500/20 p-12 rounded-[3rem] flex flex-col items-center justify-center shadow-3xl shadow-indigo-500/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-[100%] pointer-events-none" />

                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-6">{tCard("score")}</p>
                            <div className="relative mb-6">
                                <div className="text-9xl font-black text-white tabular-nums tracking-tighter">
                                    {Math.round(score)}
                                </div>
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-2 bg-indigo-500 rounded-full blur-lg opacity-60" />
                            </div>

                            <div className="bg-indigo-500/10 border border-indigo-500/30 px-6 py-2.5 rounded-2xl mb-8">
                                <span className="text-sm font-black text-indigo-400 uppercase tracking-widest">{tier}</span>
                            </div>

                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] text-center max-w-[150px] leading-relaxed">
                                {t("scoreSub")}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
                    <MetricBox label={tCard("winRate")} value={`${wr.toFixed(1)}%`} sub={t("metrics.accuracy")} color="text-white" />
                    <MetricBox label={tCard("profitFactor")} value={profit_factor.toFixed(2)} sub={t("metrics.yield")} color="text-emerald-400" />
                    <MetricBox label="Expectancy" value={`${expectancy >= 0 ? "+" : ""}${expectancy.toFixed(2)} R`} sub={t("metrics.edge")} color="text-indigo-400" />
                    <MetricBox label="Max Drawdown" value={`${Math.abs(max_drawdown).toFixed(1)}%`} sub={t("metrics.risk")} color="text-red-400" />
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Equity Curve Panel */}
                    <div className="lg:col-span-2 space-y-12">
                        <div className="bg-[#0A0D14] border border-white/5 rounded-[3rem] p-10 overflow-hidden relative shadow-2xl">
                            <h2 className="text-xl font-black mb-12 flex items-center gap-3 tracking-tight">
                                <span className="w-2 h-7 bg-indigo-600 rounded-full" />
                                {t("performanceTitle")}
                            </h2>
                            <div className="h-[450px]">
                                <EquityCurveChart data={equity_curve.map((val: number, i: number) => ({
                                    index: i + 1,
                                    r_multiple: i === 0 ? val : val - equity_curve[i - 1],
                                    cumulative_r: val
                                }))} />
                            </div>
                        </div>

                        {/* Additional Info / Certificate CTA */}
                        <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-[3rem] p-12 flex flex-col md:flex-row items-center gap-10">
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-3xl font-black mb-4 tracking-tight">{t("certificateTitle")}</h3>
                                <p className="text-indigo-200/60 font-medium mb-8 leading-relaxed">
                                    {t("certificateDesc")}
                                </p>
                                <Link
                                    href={`/${locale}/certificate/${report_id}`}
                                    className="inline-flex items-center gap-3 bg-white text-indigo-950 font-black px-8 py-4 rounded-2xl hover:bg-indigo-50 transition-all shadow-xl active:scale-95"
                                >
                                    {t("certificateBtn")}
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </Link>
                            </div>
                            <div className="w-48 h-48 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center p-4 rotate-3 group-hover:rotate-0 transition-all">
                                <div className="w-full h-full bg-indigo-500/20 rounded-xl border-2 border-indigo-500/40 flex items-center justify-center">
                                    <svg className="w-16 h-16 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Conversion */}
                    <div className="space-y-10">
                        <div className="bg-indigo-600 rounded-[3rem] p-12 flex flex-col items-center text-center shadow-3xl shadow-indigo-600/30 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mb-10 backdrop-blur-2xl border border-white/30 shadow-inner rotate-3">
                                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-3xl font-black mb-6 leading-[1.2] tracking-tight">{t("ctaTitle")}</h3>
                            <p className="text-indigo-100/70 text-base mb-12 leading-relaxed font-medium">
                                {t("ctaDesc")}
                            </p>
                            <Link
                                href={`/${locale}/analyzer`}
                                className="w-full bg-white text-indigo-600 font-black py-5 rounded-3xl shadow-xl hover:bg-indigo-50 transition-all active:scale-[0.97] hover:shadow-2xl text-lg"
                            >
                                {t("ctaBtn")}
                            </Link>
                        </div>

                        <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-10">
                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-8">{t("metadataTitle")}</h4>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-1.5">{t("tradesAnalyzed")}</p>
                                    <p className="text-3xl font-black text-white tabular-nums">{trades_count}</p>
                                </div>
                                <div className="pt-6 border-t border-white/5">
                                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-2.5">{t("fingerprint")}</p>
                                    <p className="text-[9px] font-mono text-gray-700 break-all select-all leading-relaxed">{strategy_id}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

function MetricBox({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
    return (
        <div className="bg-[#0A0D14] border border-white/5 p-8 rounded-3xl hover:border-white/10 transition-colors group">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.15em] mb-4 group-hover:text-gray-400 transition-colors uppercase">{label}</p>
            <p className={`text-3xl font-black ${color} tabular-nums mb-1 tracking-tight`}>{value}</p>
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tight group-hover:text-gray-500">{sub}</p>
        </div>
    );
}

