"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import EquityCurveChart from "@/components/analyzer/Dashboard/EquityCurveChart";
import EdgeAlerts from "@/components/analyzer/Dashboard/EdgeAlerts";
import StrategyJournal from "@/components/report/StrategyJournal";
import ProLockOverlay from "@/components/pricing/ProLockOverlay";

// Dynamically import the score card to avoid SSR issues with html2canvas
const ShareableScoreCard = dynamic(() => import("@/components/report/ShareableScoreCard"), { ssr: false });
import PublishModal from "@/components/strategy/PublishModal";
import { useTranslations } from "next-intl";
import ScoreExplanation from "@/components/analyzer/ScoreExplanation";
import StrategyDiagnostics from "@/components/analyzer/StrategyDiagnostics";
import { calcBasicMetrics } from "@/lib/analyzer/metrics";
import { toTradeArray } from "@/lib/import/normalizedTrade";

interface ReportData {
    id: string;
    public_id: string;
    strategy_name: string | null;
    dataset_name: string;
    category: string;
    created_at: string;
    metrics: {
        strategy_score: number;
        total_trades: number;
        win_rate: number;
        profit_factor: number;
        max_drawdown: number;
        expectancy_r: number;
        average_r: number;
    };
    equity_curve: number[];
    notes: string;
    can_edit: boolean;
    is_pro: boolean;
    raw_metrics_json: any;
    public_slug: string | null;
}

interface Props {
    reportId: string;
    locale: string;
    initialData?: ReportData;
}

/** Score mapping for verdict and interpretation */
function getVerdict(score: number, t: any) {
    if (score >= 75) {
        return {
            label: "You may have an edge — but it's not stable yet",
            explanation: "Your strategy shows signs of a statistical edge, but instability means it may break under pressure.",
            color: "#10b981", // Green
            bg: "rgba(16,185,129,0.1)",
            border: "rgba(16,185,129,0.2)"
        };
    } else if (score >= 55) {
        return {
            label: "Your results may depend more on luck than edge",
            explanation: "Your performance is inconsistent. Small changes in execution or market conditions can flip results.",
            color: "#f59e0b", // Yellow/Amber
            bg: "rgba(245,158,11,0.1)",
            border: "rgba(245,158,11,0.2)"
        };
    } else if (score >= 40) {
        return {
            label: "This strategy is likely not profitable over time",
            explanation: "Your strategy struggles to produce consistent results. Risk is likely outweighing reward.",
            color: "#ef4444", // Red
            bg: "rgba(239,68,68,0.1)",
            border: "rgba(239,68,68,0.2)"
        };
    } else {
        return {
            label: "There is no clear statistical edge in your strategy",
            explanation: "There is no evidence of a statistical edge. Continuing to trade this strategy may lead to losses.",
            color: "#ef4444", // Red
            bg: "rgba(239,68,68,0.1)",
            border: "rgba(239,68,68,0.2)"
        };
    }
}

/** Score badge with tier label */
function ScoreBadge({ score }: { score: number }) {
    const t = useTranslations("fullReport.score");
    const verdict = getVerdict(score, t);
    return (
        <div className="flex flex-col items-center gap-2 text-center">
            <div className="text-8xl font-black tabular-nums tracking-tighter" style={{ color: verdict.color }}>
                {Math.round(score)}
                <span className="text-2xl font-bold opacity-30 ml-1">/100</span>
            </div>
            <div className="text-sm font-bold uppercase tracking-widest px-4 py-1.5 rounded-full"
                style={{ background: verdict.bg, border: `1px solid ${verdict.border}`, color: verdict.color }}>
                {verdict.label}
            </div>
            {/* Micro Trust Line */}
            <p className="text-[10px] mt-2 font-medium uppercase tracking-[0.15em] text-gray-500 opacity-80">
                This is based on real trade data. Not assumptions.
            </p>
        </div>
    );
}

/** Key metric display card */
function MetricCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: string }) {
    return (
        <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "#6b7280" }}>{label}</p>
            <p className="text-2xl font-bold tabular-nums" style={{ color: highlight ?? "#fff" }}>{value}</p>
            {sub && <p className="text-xs mt-1" style={{ color: "#6b7280" }}>{sub}</p>}
        </div>
    );
}

/** Social sharing toolbar */
function ShareBar({ twitterUrl, whatsappUrl, onCopy, copied }: {
    twitterUrl: string; whatsappUrl: string; onCopy: () => void; copied: boolean;
}) {
    const t = useTranslations("fullReport.sharing");
    return (
        <div className="flex flex-wrap items-center gap-2 justify-center">
            {/* Twitter/X */}
            <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "#000", color: "#fff", border: "1px solid rgba(255,255,255,0.15)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#111")}
                onMouseLeave={e => (e.currentTarget.style.background = "#000")}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.843L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                {t("shareX")}
            </a>

            {/* WhatsApp */}
            <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "#25d366", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#128c7e")}
                onMouseLeave={e => (e.currentTarget.style.background = "#25d366")}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                {t("shareWhatsapp")}
            </a>

            {/* Copy link */}
            <button
                onClick={onCopy}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                    background: copied ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)",
                    color: copied ? "#34d399" : "#d1d5db",
                    border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.1)"}`,
                }}
                onMouseEnter={e => { if (!copied) (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.25)"; }}
                onMouseLeave={e => { if (!copied) (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; }}
            >
                {copied ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                    </svg>
                )}
                {copied ? t("copied") : t("copyLink")}
            </button>
        </div>
    );
}

export default function PublicReportClient({ reportId, locale, initialData }: Props) {
    const t = useTranslations("fullReport");
    const [data, setData] = useState<ReportData | null>(initialData || null);
    const [loading, setLoading] = useState(!initialData);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [showScoreCard, setShowScoreCard] = useState(false);
    const [showPublishModal, setShowPublishModal] = useState(false);

    useEffect(() => {
        if (initialData || !reportId) return;
        fetch(`/api/report/${reportId}`)
            .then(r => { if (!r.ok) throw new Error("Report not found"); return r.json(); })
            .then(j => setData(j.data))
            .catch(e => setError(e.message ?? "Could not load report"))
            .finally(() => setLoading(false));
    }, [reportId, initialData]);

    const reportUrl = typeof window !== "undefined"
        ? window.location.href
        : `https://nodoquant.com/${locale}/report/${reportId}`;

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(reportUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    }, [reportUrl]);

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center" style={{ background: "#07090F" }}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
                    <p className="text-sm" style={{ color: "#6b7280" }}>{t("status.loading")}</p>
                </div>
            </main>
        );
    }

    if (error || !data) {
        return (
            <main className="min-h-screen flex items-center justify-center" style={{ background: "#07090F" }}>
                <div className="text-center max-w-md px-6">
                    <div className="text-5xl mb-4">🔒</div>
                    <h1 className="text-2xl font-bold text-white mb-2">{t("status.notFound.title")}</h1>
                    <p className="mb-6" style={{ color: "#9ca3af" }}>
                        {t("status.notFound.desc")}
                    </p>
                    <Link href={`/${locale}/analyzer`}
                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-all">
                        {t("status.notFound.cta")}
                    </Link>
                </div>
            </main>
        );
    }

    const { metrics, equity_curve, strategy_name, dataset_name, created_at } = data;
    const wr = metrics.win_rate > 1 ? metrics.win_rate : metrics.win_rate * 100;
    const winRateDisplay = `${wr.toFixed(1)}%`;
    const drawdownAbs = Math.abs(metrics.max_drawdown);
    const drawdownDisplay = `${drawdownAbs.toFixed(1)}%`;
    const score = Math.round(metrics.strategy_score);

    // Build Twitter & WhatsApp share URLs with full report link
    const twitterText = encodeURIComponent(
        t("sharing.shareTextX", {
            score: score,
            wr: wr.toFixed(1),
            pf: metrics.profit_factor.toFixed(2),
            count: metrics.total_trades
        })
    );
    const twitterUrl = `https://twitter.com/intent/tweet?text=${twitterText}&url=${encodeURIComponent(reportUrl)}`;

    const whatsappText = encodeURIComponent(
        t("sharing.shareTextWhatsapp", {
            score: score,
            url: reportUrl
        })
    );
    const whatsappUrl = `https://wa.me/?text=${whatsappText}`;

    return (
        <main className="min-h-screen pt-10 pb-24 px-4" style={{ background: "#07090F", color: "#f9fafb" }}>
            <div className="max-w-5xl mx-auto">

                {/* ── Top Banner ── */}
                <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3 rounded-xl"
                    style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.18)" }}>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">NodoQuant</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}>
                            Quant Analysis
                        </span>
                    </div>
                    <Link href={`/${locale}/analyzer`}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors whitespace-nowrap">
                        {t("status.notFound.cta")}
                    </Link>
                </div>

                {/* ── Header ── */}
                <header className="text-center mb-8">
                    <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#6b7280" }}>
                        {t("header.label")}
                    </p>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-2">
                        {strategy_name ?? t("header.defaultTitle")}
                    </h1>
                    <p className="text-base" style={{ color: "#9ca3af" }}>
                        {dataset_name} · {new Date(created_at).toLocaleDateString(locale === "es" ? "es-AR" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </p>

                    {/* Certificate & Publish Actions */}
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <Link
                            href={`/${locale}/certificate/${data.id}`}
                            className="bg-white/5 border border-white/10 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-white/10 hover:border-indigo-500/30 transition-all shadow-xl group"
                        >
                            <svg className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {t("header.certificate")}
                        </Link>

                        {data.can_edit && (
                            <>
                                {data.public_slug ? (
                                    <Link
                                        href={`/${locale}/strategy/${data.public_slug}`}
                                        className="bg-green-500/10 border border-green-500/20 text-green-400 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-green-500/20 transition-all"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                        {t("header.library")}
                                    </Link>
                                ) : (
                                    <button
                                        onClick={() => setShowPublishModal(true)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/25 flex items-center gap-2 transform transition-all active:scale-95 group"
                                    >
                                        <div className="bg-indigo-400/20 p-1 rounded-lg group-hover:bg-indigo-400/30 transition-colors">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                                        </div>
                                        {t("header.publish")}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </header>

                {showPublishModal && (
                    <PublishModal
                        reportId={data.id}
                        metrics={{
                            score: Math.round(data.metrics.strategy_score),
                            win_rate: wr,
                            profit_factor: data.metrics.profit_factor,
                            trades: data.metrics.total_trades,
                            symbol: data.dataset_name,
                            market: data.category
                        }}
                        onClose={() => setShowPublishModal(false)}
                    />
                )}

                {/* ── Verdict Section ── */}
                <div className="mb-8 p-10 rounded-3xl border text-center"
                    style={{ 
                        background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)", 
                        borderColor: "rgba(255,255,255,0.06)" 
                    }}>
                    <h2 className="text-sm font-bold uppercase tracking-[0.2em] mb-8" style={{ color: "#4b5563" }}>
                        Your Strategy Verdict
                    </h2>
                    
                    <ScoreBadge score={metrics.strategy_score} />

                    <div className="mt-12 max-w-2xl mx-auto">
                        <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#6b7280" }}>
                            What this means
                        </h3>
                        <p className="text-lg leading-relaxed font-medium" style={{ color: "#d1d5db" }}>
                            {getVerdict(metrics.strategy_score, t).explanation}
                        </p>
                    </div>
                </div>

                {/* ── Main Lock Block (Post-Verdict Tension) ── */}
                <div className="mb-12 py-16 px-10 rounded-3xl border border-white/5 bg-white/[0.01] text-center max-w-3xl mx-auto overflow-hidden relative">
                    <h2 className="text-2xl font-bold text-white mb-6">You're only seeing part of the picture.</h2>
                    <div className="space-y-4 max-w-xl mx-auto mb-10">
                        <p className="text-gray-300 font-medium">
                            Based on your results, you're currently making trading decisions without seeing critical data.
                        </p>
                        <p className="text-gray-400">
                            Most traders realize this too late.
                        </p>
                        <p className="text-indigo-400 font-bold">
                            The real risk — and the real edge — is hidden below.
                        </p>
                    </div>
                    <Link href={`/${locale}/pricing`}
                        className="btn-primary px-8 py-3 w-fit mx-auto">
                        Unlock Full Strategy Diagnostics →
                    </Link>
                </div>

                {/* ── Social Sharing Bar ── */}
                <div className="mb-10 py-5 px-6 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-center mb-4" style={{ color: "#6b7280" }}>
                        {t("sharing.label")}
                    </p>
                    <ShareBar
                        twitterUrl={twitterUrl}
                        whatsappUrl={whatsappUrl}
                        onCopy={handleCopy}
                        copied={copied}
                    />

                    {/* Score card toggle */}
                    <div className="text-center mt-4">
                        <button
                            onClick={() => setShowScoreCard(v => !v)}
                            className="text-xs font-semibold underline underline-offset-2 transition-colors"
                            style={{ color: "#6b7280" }}
                            onMouseEnter={e => (e.currentTarget.style.color = "#a5b4fc")}
                            onMouseLeave={e => (e.currentTarget.style.color = "#6b7280")}
                        >
                            {showScoreCard ? t("sharing.hideCard") : t("sharing.downloadCard")}
                        </button>
                    </div>

                    {/* Shareable score card */}
                    {showScoreCard && (
                        <div className="mt-5 flex justify-center animate-fade-in">
                            <ShareableScoreCard
                                strategyScore={metrics.strategy_score}
                                strategyName={strategy_name ?? t("sharing.defaultName")}
                                winRate={wr}
                                profitFactor={metrics.profit_factor}
                                expectancy={metrics.expectancy_r}
                                maxDrawdown={drawdownAbs}
                                totalTrades={metrics.total_trades}
                                reportUrl={reportUrl}
                            />
                        </div>
                    )}
                </div>

                {/* ── Strategy Diagnostics (NEW) ── */}
                <ProLockOverlay isPro={data.is_pro} 
                    title="Strategy Diagnostics"
                    description="Surface-level analysis hides the fragility of your edge.">
                    <div className="mb-8">
                         <StrategyDiagnostics 
                            metrics={{
                                totalTrades: metrics.total_trades,
                                winrate: wr,
                                profitFactor: metrics.profit_factor,
                                maxDrawdown: metrics.max_drawdown,
                                sumProfit: 0, // Not used in diagnostics
                            } as any}
                            trades={toTradeArray(data.raw_metrics_json?.trades || [])}
                         />
                    </div>
                </ProLockOverlay>

                {/* ── Edge Alerts ── */}
                <div className="mb-8">
                    <ProLockOverlay title={t("alerts.title")} description={t("alerts.proLock")} isPro={data.is_pro}>
                        <div className={!data.is_pro ? "blur-sm grayscale opacity-50 transition-all" : ""}>
                            <EdgeAlerts
                                latestReport={{
                                    winrate: data.metrics.win_rate,
                                    profit_factor: data.metrics.profit_factor,
                                    max_drawdown: data.metrics.max_drawdown,
                                    metrics_json: data.raw_metrics_json,
                                }}
                            />
                        </div>
                    </ProLockOverlay>
                </div>

                {/* ── Key Metrics ── */}
                <section className="mb-8">
                    <h2 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "#6b7280" }}>{t("metrics.title")}</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        <MetricCard label={t("metrics.winrate.label")} value={winRateDisplay}
                            sub={wr >= 50 ? t("metrics.winrate.above") : t("metrics.winrate.below")}
                            highlight={wr >= 50 ? "#34d399" : undefined} />
                        
                        <ProLockOverlay isPro={data.is_pro} 
                            title="Profit Factor"
                            description="Without this, you don't know if your wins actually outweigh your losses.">
                            <MetricCard label={t("metrics.profitFactor.label")} value={metrics.profit_factor.toFixed(2)}
                                sub={metrics.profit_factor > 1.5 ? t("metrics.profitFactor.excellent") : metrics.profit_factor > 1 ? t("metrics.profitFactor.profitable") : t("metrics.profitFactor.losing")}
                                highlight={metrics.profit_factor >= 1.5 ? "#34d399" : metrics.profit_factor >= 1 ? "#fbbf24" : "#f87171"} />
                        </ProLockOverlay>

                        <ProLockOverlay isPro={data.is_pro} 
                            title="Expectancy"
                            description="Trading without this data is guesswork.">
                            <MetricCard label={t("metrics.expectancy.label")}
                                value={`${metrics.expectancy_r >= 0 ? "+" : ""}${metrics.expectancy_r.toFixed(2)} R`}
                                sub={t("metrics.expectancy.perTrade")}
                                highlight={metrics.expectancy_r > 0 ? "#34d399" : "#f87171"} />
                        </ProLockOverlay>

                        <ProLockOverlay isPro={data.is_pro} 
                            title="Maximum Drawdown"
                            description="Without this, you don't know how much your strategy can lose before recovering.">
                            <MetricCard label={t("metrics.maxDrawdown.label")} value={drawdownDisplay} sub={t("metrics.maxDrawdown.desc")} highlight="#f87171" />
                        </ProLockOverlay>

                        <MetricCard label={t("metrics.sampleSize.label")} value={metrics.total_trades.toLocaleString()}
                            sub={metrics.total_trades >= 100 ? t("metrics.sampleSize.robust") : metrics.total_trades >= 30 ? t("metrics.sampleSize.moderate") : t("metrics.sampleSize.small")}
                            highlight={metrics.total_trades >= 100 ? "#34d399" : metrics.total_trades >= 30 ? "#fbbf24" : "#f87171"} />
                    </div>
                </section>

                {/* ── Equity Curve ── */}
                {equity_curve.length > 1 && (
                    <section className="mb-8">
                        <ProLockOverlay title="Equity Curve Analysis" description="You're trading blindly without seeing the structural growth of your capital." isPro={data.is_pro}>
                            <div className={!data.is_pro ? "blur-md grayscale opacity-40 rounded-2xl p-6 border" : "rounded-2xl p-6 border"} style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                                <h2 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "#6b7280" }}>{t("equity.title")}</h2>
                                <EquityCurveChart data={equity_curve.map((val, i) => ({
                                    index: i + 1,
                                    r_multiple: i === 0 ? val : val - equity_curve[i - 1],
                                    cumulative_r: val
                                }))} />
                            </div>
                        </ProLockOverlay>
                    </section>
                )}

                {/* ── Strategy Journal ── */}
                {data.can_edit && (
                    <ProLockOverlay title={t("journal.title")} description={t("journal.proLock")} isPro={data.is_pro}>
                        <StrategyJournal
                            reportId={reportId}
                            initialNotes={data.notes}
                            canEdit={data.can_edit}
                        />
                    </ProLockOverlay>
                )}

                {/* ── Reliability Warning ── */}
                {metrics.total_trades < 30 && (
                    <div className="mb-8 px-5 py-4 rounded-xl text-sm"
                        style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
                        <strong>{t("reliability.title")}</strong> {t("reliability.desc", { count: metrics.total_trades })}
                    </div>
                )}

                {/* ── Viral CTA ── */}
                <div className="mt-12 rounded-2xl px-8 py-10 text-center border"
                    style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(16,185,129,0.06) 100%)", borderColor: "rgba(99,102,241,0.2)" }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#818cf8" }}>{t("viral.label")}</p>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
                        {t("viral.title")}
                    </h2>
                    <p className="mb-6 max-w-md mx-auto" style={{ color: "#9ca3af" }}>
                        {t("viral.subtitle")}
                    </p>
                    <Link href={`/${locale}/analyzer`}
                        className="inline-flex items-center gap-2 font-bold text-white px-8 py-4 rounded-xl transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                        style={{ background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", boxShadow: "0 0 30px rgba(99,102,241,0.35)" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                        {t("viral.cta")}
                    </Link>
                    <p className="text-xs mt-4" style={{ color: "#4b5563" }}>
                        {t("viral.footer")}
                    </p>
                </div>

                {/* ── Hidden Picture Tension Block ── */}
                <div className="mt-16 mb-12 p-10 rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent max-w-2xl mx-auto text-center"
                    style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <h2 className="text-xl font-bold text-white mb-6">You're only seeing part of the picture</h2>
                    <div className="space-y-4 mb-8 text-left inline-block">
                        <p className="text-gray-300">You're only seeing a surface-level analysis. You still don't know:</p>
                        <ul className="space-y-2 text-gray-400 text-sm">
                            <li className="flex items-center gap-2">
                                <span className="text-indigo-500">•</span> If your edge survives different market conditions
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-indigo-500">•</span> How fragile your strategy really is
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-indigo-500">•</span> What happens under drawdown pressure
                            </li>
                        </ul>
                    </div>
                    <div className="border-t border-white/5 pt-6">
                        <p className="text-gray-300 font-medium italic">
                            "Most traders believe they have an edge. <br/> Few actually do."
                        </p>
                    </div>
                </div>

                {/* ── Reveal Final Block ── */}
                <div className="mt-12 text-center max-w-2xl mx-auto py-12 px-6 rounded-3xl border border-white/5 bg-white/[0.02]">
                    <h2 className="text-2xl font-bold text-white mb-3">Go deeper into your strategy</h2>
                    <p className="text-gray-400 mb-8">
                        Unlock full diagnostics, advanced metrics, and deeper insights to fully master your statistical edge.
                    </p>
                    <Link href={`/${locale}/pricing`}
                        className="btn-primary px-8 py-4 justify-center">
                        Reveal what your strategy is really doing →
                    </Link>
                </div>

            </div>
        </main>
    );
}
