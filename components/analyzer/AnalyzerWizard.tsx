"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import FileUpload from "@/components/analyzer/FileUpload";
import ImportWizard from "@/components/analyzer/ImportWizard";
import BasicResults from "@/components/analyzer/BasicResults";
import EquityChart from "@/components/analyzer/EquityChart";
import EmailGate from "@/components/analyzer/EmailGate";
import FullReport from "@/components/analyzer/FullReport";
import PropFirmSimulator from "@/components/analyzer/PropFirmSimulator";
import OnboardingPanel from "@/components/analyzer/OnboardingPanel";
import StrategyInsight from "@/components/analyzer/StrategyInsight";
import StrategySelector from "@/components/analyzer/StrategySelector";
import StrategyContextForm from "@/components/analyzer/StrategyContextForm";
import MonteCarloChart from "@/components/analyzer/MonteCarloChart";
import MonteCarloSummary from "@/components/analyzer/MonteCarloSummary";
import ImportSourceSelector from "@/components/import/ImportSourceSelector";
import BinanceImportPanel from "@/components/import/BinanceImportPanel";
import MT4ImportPanel from "@/components/import/MT4ImportPanel";
import MT5ImportPanel from "@/components/import/MT5ImportPanel";
import { parseTrades, type ParseResult } from "@/lib/analyzer/parser";
import {
    calcBasicMetrics,
    calcFullMetrics,
    type BasicMetrics,
    type FullMetrics,
} from "@/lib/analyzer/metrics";
import { sampleCsvData } from "@/lib/analyzer/sampleData";
import TradeSummaryPreview from "@/components/import/TradeSummaryPreview";
import { toTradeArray, buildParseResult, type ImportSource } from "@/lib/import/normalizedTrade";
import type { NormalizedTrade } from "@/lib/import/normalizedTrade";
import { trackEvent } from "@/lib/analytics";


type Step = "source" | "upload" | "importing" | "confirm" | "basic" | "gate" | "full" | "sim";

function getUIStepIndex(s: Step) {
    if (s === "source" || s === "upload") return 0;
    if (s === "importing" || s === "confirm") return 1;
    if (s === "basic") return 2;
    return 3; // gate, full, sim
}

export default function AnalyzerWizard() {
    const t = useTranslations("analyzer.wizard");
    const [step, setStep] = useState<Step>("source");
    const [importSource, setImportSource] = useState<ImportSource | null>(null);
    const [fileState, setFileState] = useState<{ content: string; name: string } | null>(null);
    const [parseResult, setParseResult] = useState<ParseResult | null>(null);
    const [basicMetrics, setBasicMetrics] = useState<BasicMetrics | null>(null);
    const [fullMetrics, setFullMetrics] = useState<FullMetrics | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [unlockedEmail, setUnlockedEmail] = useState("");
    const [strategyId, setStrategyId] = useState("");
    const [analysisId, setAnalysisId] = useState<string | null>(null);
    const [datasetName, setDatasetName] = useState("");
    const [pendingNormalized, setPendingNormalized] = useState<{ trades: NormalizedTrade[]; source: ImportSource } | null>(null);
    const uploadRef = useRef<HTMLDivElement>(null);

    const UI_STEPS = useMemo(() => [
        { id: "upload", label: t("steps.upload") },
        { id: "mapping", label: t("steps.mapping") },
        { id: "analysis", label: t("steps.analysis") },
        { id: "report", label: t("steps.report") },
    ], [t]);

    const handleFile = useCallback((content: string, fileName: string) => {
        setParseError(null);
        setLoading(true);
        setTimeout(() => {
            setFileState({ content, name: fileName });
            setStep("importing");
            setLoading(false);
        }, 50);
    }, []);

    const handleNormalizedImport = useCallback((trades: NormalizedTrade[], source: ImportSource) => {
        setPendingNormalized({ trades, source });
        setStep("confirm");
    }, []);

    const confirmAndGenerate = useCallback(() => {
        if (!pendingNormalized) return;
        try {
            const { trades, source } = pendingNormalized;
            const legacyTrades = toTradeArray(trades);
            const fakeResult = buildParseResult(trades, source);
            const basic = calcBasicMetrics(legacyTrades);
            const full = calcFullMetrics(legacyTrades);
            setParseResult(fakeResult as any);
            setBasicMetrics(basic);
            setFullMetrics(full);
            setStep("basic");

            trackEvent('analyzer_run', {
                source,
                total_trades: basic.totalTrades,
                win_rate: basic.winrate,
                profit_factor: basic.profitFactor
            });
        } catch (err: unknown) {
            setParseError(err instanceof Error ? err.message : "Error calculating metrics.");
            setStep("source");
        }
    }, [pendingNormalized]);

    const handleImportComplete = useCallback((result: ParseResult) => {
        try {
            const basic = calcBasicMetrics(result.trades);
            const full = calcFullMetrics(result.trades);
            setParseResult(result);
            setBasicMetrics(basic);
            setFullMetrics(full);
            setStep("basic");

            trackEvent('analyzer_run', {
                source: result.format,
                total_trades: basic.totalTrades,
                win_rate: basic.winrate,
                profit_factor: basic.profitFactor
            });
        } catch (err: unknown) {
            setParseError(err instanceof Error ? err.message : "Error calculando métricas.");
            setStep("upload");
        }
    }, []);

    const handleImportCancel = useCallback(() => {
        setFileState(null);
        setStep("upload");
    }, []);

    function handleEmailUnlocked(email: string, id: string) {
        if (!parseResult) return;
        setUnlockedEmail(email);
        setAnalysisId(id);
        setStep("full");
    }

    const resetToSource = () => {
        setStep("source");
        setImportSource(null);
        setFileState(null);
        setParseResult(null);
        setBasicMetrics(null);
        setParseError(null);
    };

    const currentIdx = getUIStepIndex(step);

    return (
        <div
            className="min-h-screen pt-20 pb-24"
            style={{ background: "var(--bg)" }}
        >
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
                <div className="section-label mt-8">{t("freeTool")}</div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 leading-tight">
                    {t("title")}
                </h1>
                <p className="text-base" style={{ color: "#9ca3af" }}>
                    {t("description")}
                </p>

                <div className="flex items-center gap-0 mt-8">
                    {UI_STEPS.map((s, i) => (
                        <div key={s.id} className="flex items-center flex-1 min-w-0">
                            <div className="flex flex-col items-center flex-shrink-0">
                                <div
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                                    style={{
                                        background:
                                            i <= currentIdx
                                                ? "#6366f1"
                                                : "rgba(255,255,255,0.06)",
                                        color: i <= currentIdx ? "#fff" : "#4b5563",
                                        border:
                                            i === currentIdx
                                                ? "2px solid #818cf8"
                                                : "2px solid transparent",
                                    }}
                                >
                                    {i < currentIdx ? (
                                        <svg
                                            width="12"
                                            height="12"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                        >
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    ) : (
                                        i + 1
                                    )}
                                </div>
                                <span
                                    className="text-xs mt-1 text-center hidden sm:block"
                                    style={{
                                        color:
                                            i <= currentIdx ? "#a5b4fc" : "#374151",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {s.label}
                                </span>
                            </div>
                            {i < UI_STEPS.length - 1 && (
                                <div
                                    className="h-px flex-1 mx-1 transition-all duration-300"
                                    style={{
                                        background:
                                            i < currentIdx
                                                ? "#6366f1"
                                                : "rgba(255,255,255,0.08)",
                                    }}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

                {step === "source" && (
                    <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <ImportSourceSelector
                            onSelect={(src) => {
                                setImportSource(src);
                                setStep("upload");
                            }}
                        />
                    </div>
                )}

                {step === "upload" && (
                    <div className="space-y-6">
                        {importSource === "mt4" && (
                            <div className="rounded-2xl p-6 animate-fade-in" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                <MT4ImportPanel
                                    onComplete={(trades) => handleNormalizedImport(trades, "mt4")}
                                    onBack={resetToSource}
                                />
                            </div>
                        )}

                        {importSource === "mt5" && (
                            <div className="rounded-2xl p-6 animate-fade-in" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                <MT5ImportPanel
                                    onComplete={(trades) => handleNormalizedImport(trades, "mt5")}
                                    onBack={resetToSource}
                                />
                            </div>
                        )}

                        {importSource === "binance-spot" && (
                            <div className="rounded-2xl p-6 animate-fade-in" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                <BinanceImportPanel
                                    onComplete={(trades) => handleNormalizedImport(trades, "binance-spot")}
                                    onBack={resetToSource}
                                />
                            </div>
                        )}

                        {(!importSource || importSource === "csv" || importSource === "generic") && (
                            <div className="space-y-6">
                                <OnboardingPanel importSource={importSource as "csv" | "mt4" | "mt5" | "binance" | null} />
                                <div ref={uploadRef}>
                                    <FileUpload onFile={handleFile} loading={loading} />
                                </div>
                                <div className="flex justify-center animate-fade-in pb-8">
                                    <button
                                        onClick={() => handleFile(sampleCsvData, "sample_data.csv")}
                                        className="text-sm px-4 py-2 rounded-lg font-medium transition-colors"
                                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af" }}
                                    >
                                        {t("sampleDataCta")}
                                    </button>
                                </div>
                            </div>
                        )}

                        {parseError && (
                            <div className="mt-4 p-4 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
                                <strong>{t("errorReading")}</strong> {parseError}
                            </div>
                        )}
                    </div>
                )}


                {step === "confirm" && pendingNormalized && (
                    <div className="rounded-2xl p-6 animate-fade-in" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <TradeSummaryPreview
                            trades={pendingNormalized.trades}
                            onConfirm={confirmAndGenerate}
                            onBack={() => {
                                setPendingNormalized(null);
                                setStep("upload");
                            }}
                        />
                    </div>
                )}

                {step === "importing" && fileState && (
                    <div className="mt-8 animate-fade-in">
                        <ImportWizard
                            fileContent={fileState.content}
                            fileName={fileState.name}
                            onComplete={handleImportComplete}
                            onCancel={handleImportCancel}
                        />
                    </div>
                )}

                {step === "basic" && basicMetrics && parseResult && fullMetrics && (
                    <div className="space-y-12 animate-fade-in">
                        {/* 1. Strategy Score */}
                        <div className="order-1">
                            <BasicResults
                                metrics={basicMetrics}
                                format={parseResult.format}
                                fileName={parseResult.fileName}
                                trades={parseResult.trades}
                                hideMetrics={true}
                            />
                        </div>

                        {/* 2. Equity Curve */}
                        <div className="order-2 animate-fade-in" style={{ animationDelay: "200ms" }}>
                            <EquityChart data={fullMetrics.equityCurve} />
                        </div>

                        {/* 3. Key Metrics */}
                        <div className="order-3 animate-fade-in" style={{ animationDelay: "300ms" }}>
                            <BasicResults
                                metrics={basicMetrics}
                                format={parseResult.format}
                                trades={parseResult.trades}
                                hideScore={true}
                            />
                        </div>

                        {/* 4. Strategy Insights */}
                        <div className="order-4 animate-fade-in" style={{ animationDelay: "400ms" }}>
                            <StrategyInsight
                                profitFactor={basicMetrics.profitFactor}
                                winrate={basicMetrics.winrate}
                                maxDrawdown={basicMetrics.maxDrawdown}
                                totalTrades={basicMetrics.totalTrades}
                                trades={parseResult.trades}
                            />
                        </div>

                        {/* 5. Next Actions Panel */}
                        <div className="order-5 pt-16 border-t border-white/[0.05] animate-fade-in" style={{ animationDelay: "600ms" }}>
                            <div className="text-center mb-10">
                                <h3 className="text-2xl font-black text-white mb-2 tracking-tight italic uppercase">{t("nextStepsTitle")}</h3>
                                <p className="text-sm text-gray-500 font-medium max-w-md mx-auto">{t("nextStepsDesc")}</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
                                {/* Monte Carlo - Upgrade Trigger */}
                                <div className="rounded-[32px] p-6 flex flex-col justify-between border border-indigo-500/30 bg-gradient-to-br from-indigo-500/[0.1] to-transparent shadow-[0_20px_40px_rgba(99,102,241,0.1)] relative overflow-hidden group hover:scale-[1.02] transition-transform">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] pointer-events-none" />
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-lg">🎲</div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{t("monteCarlo.label")}</span>
                                        </div>
                                        <h4 className="text-base font-black text-white mb-2">{t("monteCarlo.title")}</h4>
                                        <p className="text-[11px] text-gray-400 leading-relaxed mb-8">{t("monteCarlo.desc")}</p>
                                    </div>
                                    <button onClick={() => setStep("gate")} className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/25 active:scale-[0.98]">
                                        {t("monteCarlo.cta")}
                                    </button>
                                </div>

                                {/* Prop Firm Simulator */}
                                <div className="rounded-[32px] p-6 flex flex-col justify-between hover:border-white/20 transition-all bg-white/[0.02] border border-white/[0.06] hover:scale-[1.02]">
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-lg">🏦</div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{t("propFirm.label")}</span>
                                        </div>
                                        <h4 className="text-base font-black text-white mb-2">{t("propFirm.title")}</h4>
                                        <p className="text-[11px] text-gray-500 leading-relaxed mb-8">{t("propFirm.desc")}</p>
                                    </div>
                                    <button onClick={() => setStep("gate")} className="w-full py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-[11px] font-black uppercase tracking-widest border border-white/10 transition-all active:scale-[0.98]">
                                        {t("propFirm.cta")}
                                    </button>
                                </div>

                                {/* Save Strategy - PRO ONLY */}
                                <div className="rounded-[32px] p-6 flex flex-col justify-between hover:border-white/20 transition-all bg-white/[0.01] border border-white/[0.04] opacity-80 hover:opacity-100 hover:scale-[1.02]">
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-lg">💎</div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{t("saveStrategy.label")}</span>
                                            </div>
                                            <span className="text-[8px] font-black px-2 py-1 rounded bg-indigo-500/20 text-indigo-400 tracking-widest border border-indigo-500/30 uppercase">PRO</span>
                                        </div>
                                        <h4 className="text-base font-black text-white mb-2">{t("saveStrategy.title")}</h4>
                                        <p className="text-[11px] text-gray-600 leading-relaxed mb-8">{t("saveStrategy.desc")}</p>
                                    </div>
                                    <button onClick={() => setStep("gate")} className="w-full py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-500 text-[11px] font-black uppercase tracking-widest border border-white/5 transition-all active:scale-[0.98]">
                                        {t("saveStrategy.cta")}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-6">
                                <button
                                    onClick={() => setStep("gate")}
                                    className="btn-primary px-12 py-4 w-full sm:w-auto text-[11px] font-black uppercase tracking-widest shadow-[0_20px_40px_-5px_rgba(99,102,241,0.4)] group rounded-2xl"
                                >
                                    {t("viewReport")}
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:translate-x-1 transition-transform">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={resetToSource}
                                    className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 hover:text-gray-400 transition-colors py-2 flex items-center gap-2"
                                >
                                    <span>←</span> {t("importAnother")}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {step === "gate" && parseResult && basicMetrics && (
                    <div className="space-y-4">
                        <BasicResults
                            metrics={basicMetrics}
                            format={parseResult.format}
                            fileName={parseResult.fileName}
                        />
                        <EmailGate
                            metricsPayload={{
                                basic: basicMetrics,
                                equity_curve: fullMetrics?.equityCurve,
                                drawdown_curve: fullMetrics?.drawdownCurve,
                                trade_histogram: fullMetrics?.tradeHistogram,
                            }}
                            basicMetrics={{
                                trades_count: basicMetrics.totalTrades,
                                winrate: basicMetrics.winrate,
                                profit_factor: basicMetrics.profitFactor,
                                max_drawdown: basicMetrics.maxDrawdown,
                                sum_profit: basicMetrics.sumProfit,
                            }}
                            fileName={parseResult.fileName}
                            dateRangeStart={parseResult.dateRangeStart?.toISOString()}
                            dateRangeEnd={parseResult.dateRangeEnd?.toISOString()}
                            strategyId={strategyId}
                            datasetName={datasetName}
                            onUnlocked={handleEmailUnlocked}
                        />
                    </div>
                )}

                {step === "full" && fullMetrics && parseResult && (
                    <div className="space-y-10">
                        <FullReport
                            metrics={fullMetrics}
                            trades={parseResult.trades}
                            email={unlockedEmail}
                            analysisId={analysisId}
                            onSimulate={() => setStep("sim")}
                        />

                        <div className="pt-10 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                            <div className="text-center mb-10">
                                <h2 className="text-2xl font-bold text-white mb-3">{t("monteCarlo.title")}</h2>
                                <p className="text-sm max-w-lg mx-auto" style={{ color: "#9ca3af" }}>
                                    {t("monteCarlo.desc")}
                                </p>
                            </div>

                            <div className="p-5 rounded-2xl mb-8" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                <MonteCarloChart
                                    simulations={fullMetrics.monteCarlo.simulations}
                                    averageCaseReturn={fullMetrics.monteCarlo.averageCase}
                                />
                            </div>

                            <MonteCarloSummary
                                worstCase={fullMetrics.monteCarlo.worstCase}
                                averageCase={fullMetrics.monteCarlo.averageCase}
                                bestCase={fullMetrics.monteCarlo.bestCase}
                                riskOfRuin={fullMetrics.monteCarlo.riskOfRuin}
                            />
                        </div>

                        <div className="text-center pt-8 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                            <button
                                onClick={() => setStep("sim")}
                                className="btn-primary"
                            >
                                {t("propFirm.cta")}
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {step === "sim" && parseResult && (
                    <PropFirmSimulator trades={parseResult.trades} />
                )}
            </div>

            {(step === "full" || step === "sim") && (
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
                    <div
                        className="card rounded-2xl p-6 text-center"
                        style={{
                            background: "rgba(99,102,241,0.06)",
                            borderColor: "rgba(99,102,241,0.2)",
                        }}
                    >
                        <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-2">
                            {t("crossSell.label")}
                        </p>
                        <h3 className="text-lg font-bold text-white mb-2">
                            {t("crossSell.title")}
                        </h3>
                        <p className="text-sm mb-4" style={{ color: "#6b7280" }}>
                            {t("crossSell.desc")}
                        </p>
                        <a href="/nodoquant#contacto" className="btn-primary">
                            {t("crossSell.cta")}
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
