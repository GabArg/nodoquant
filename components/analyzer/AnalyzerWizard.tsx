"use client";

import { useState, useCallback, useRef } from "react";
import FileUpload from "@/components/analyzer/FileUpload";
import ImportWizard from "@/components/analyzer/ImportWizard";
import BasicResults from "@/components/analyzer/BasicResults";
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


type Step = "source" | "upload" | "importing" | "confirm" | "basic" | "strategy" | "context" | "gate" | "full" | "sim";

const STEPS: { id: Step; label: string }[] = [
    { id: "source", label: "Source" },
    { id: "upload", label: "Upload" },
    { id: "importing", label: "Mapping" },
    { id: "confirm", label: "Confirm" },
    { id: "basic", label: "Analysis" },
    { id: "strategy", label: "Strategy" },
    { id: "context", label: "Context" },
    { id: "gate", label: "Full report" },
    { id: "full", label: "Report" },
    { id: "sim", label: "Simulation" },
];

function stepIndex(s: Step) {
    return STEPS.findIndex((x) => x.id === s);
}

export default function AnalyzerWizard() {
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
    const [datasetName, setDatasetName] = useState("");
    const [pendingNormalized, setPendingNormalized] = useState<{ trades: NormalizedTrade[]; source: ImportSource } | null>(null);
    const uploadRef = useRef<HTMLDivElement>(null);


    const handleFile = useCallback((content: string, fileName: string) => {
        setParseError(null);
        setLoading(true);
        setTimeout(() => {
            setFileState({ content, name: fileName });
            setStep("importing");
            setLoading(false);
        }, 50);
    }, []);

    /** Called when any NON-CSV source returns NormalizedTrade[] — goes to confirm step first */
    const handleNormalizedImport = useCallback((trades: NormalizedTrade[], source: ImportSource) => {
        setPendingNormalized({ trades, source });
        setStep("confirm");
    }, []);

    /** Called from TradeSummaryPreview confirm button — generates metrics and shows report */
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

    function handleEmailUnlocked(email: string) {
        if (!parseResult) return;
        setUnlockedEmail(email);
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

    const currentIdx = stepIndex(step);

    // Determine which importing panel to show based on source
    const showingNonCsvPanel = importSource === "mt4" || importSource === "mt5" || importSource === "binance-spot";


    return (
        <div
            className="min-h-screen pt-20 pb-24"
            style={{ background: "var(--bg)" }}
        >
            {/* Page header */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
                <div className="section-label mt-8">Free tool</div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 leading-tight">
                    Strategy Analyzer
                </h1>
                <p className="text-base" style={{ color: "#9ca3af" }}>
                    Import your trading history and get a complete quantitative analysis of your strategy.
                    Supports CSV, MT4/MT5 statements and Binance API.
                </p>

                {/* Progress stepper */}
                <div className="flex items-center gap-0 mt-8">
                    {STEPS.map((s, i) => (
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
                            {i < STEPS.length - 1 && (
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

            {/* Step content */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* ── Source selector ── */}
                {step === "source" && (
                    <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <ImportSourceSelector
                            onSelect={(src) => {
                                setImportSource(src);
                                if (src === "csv" || src === "generic") {
                                    setStep("upload");
                                } else {
                                    // mt4 / mt5 / binance-spot go to their own panel via "upload" step
                                    setStep("upload");
                                }
                            }}
                        />
                    </div>
                )}

                {step === "upload" && (
                    <div className="space-y-6">
                        {/* MT4 panel */}
                        {importSource === "mt4" && (
                            <div className="rounded-2xl p-6 animate-fade-in" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                <MT4ImportPanel
                                    onComplete={(trades) => handleNormalizedImport(trades, "mt4")}
                                    onBack={resetToSource}
                                />
                            </div>
                        )}

                        {/* MT5 panel */}
                        {importSource === "mt5" && (
                            <div className="rounded-2xl p-6 animate-fade-in" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                <MT5ImportPanel
                                    onComplete={(trades) => handleNormalizedImport(trades, "mt5")}
                                    onBack={resetToSource}
                                />
                            </div>
                        )}

                        {/* Binance panel */}
                        {importSource === "binance-spot" && (
                            <div className="rounded-2xl p-6 animate-fade-in" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                <BinanceImportPanel
                                    onComplete={(trades) => handleNormalizedImport(trades, "binance-spot")}
                                    onBack={resetToSource}
                                />
                            </div>
                        )}

                        {/* CSV / generic panel */}
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
                                        Try with sample data
                                    </button>
                                </div>
                            </div>
                        )}

                        {parseError && (
                            <div className="mt-4 p-4 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
                                <strong>Error reading file:</strong> {parseError}
                            </div>
                        )}
                    </div>
                )}


                {/* ── Confirm step (trade summary preview) ── */}
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

                {/* Import Wizard Mapping Step */}
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

                {/* Basic results */}
                {step === "basic" && basicMetrics && parseResult && (
                    <div className="space-y-6">
                        <BasicResults
                            metrics={basicMetrics}
                            format={parseResult.format}
                            fileName={parseResult.fileName}
                            trades={parseResult.trades}
                        />
                        {/* Strategy insight with CTA */}
                        <StrategyInsight
                            profitFactor={basicMetrics.profitFactor}
                            winrate={basicMetrics.winrate}
                            maxDrawdown={basicMetrics.maxDrawdown}
                            totalTrades={basicMetrics.totalTrades}
                            trades={parseResult.trades}
                        />
                        <div className="text-center">
                            <button
                                onClick={() => setStep("strategy")}
                                className="btn-primary"
                            >
                                View full report
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                            <p className="text-xs mt-2" style={{ color: "#374151" }}>
                                Monte Carlo · Equity Curve · Prop Firm Simulator
                            </p>
                        </div>
                        <div className="text-center">
                            <button
                                onClick={resetToSource}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#4b5563", fontSize: "0.85rem" }}
                            >
                                ← Import another file
                            </button>
                        </div>
                    </div>
                )}

                {/* Strategy selector */}
                {step === "strategy" && parseResult && basicMetrics && (
                    <StrategySelector
                        onSelect={(sid, dname) => {
                            setStrategyId(sid);
                            setDatasetName(dname);
                            setStep("context");
                        }}
                        onBack={() => setStep("basic")}
                    />
                )}

                {/* Strategy Context Form */}
                {step === "context" && strategyId && (
                    <StrategyContextForm
                        strategyId={strategyId}
                        onContinue={() => setStep("gate")}
                        onBack={() => setStep("strategy")}
                    />
                )}

                {/* Email gate */}
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

                {/* Full report */}
                {step === "full" && fullMetrics && parseResult && (
                    <div className="space-y-10">
                        <FullReport
                            metrics={fullMetrics}
                            trades={parseResult.trades}
                            email={unlockedEmail}
                        />

                        {/* Monte Carlo Section */}
                        <div className="pt-10 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                            <div className="text-center mb-10">
                                <h2 className="text-2xl font-bold text-white mb-3">Monte Carlo Strategy Simulation</h2>
                                <p className="text-sm max-w-lg mx-auto" style={{ color: "#9ca3af" }}>
                                    1000 randomized future paths based on your historical trades.
                                </p>
                            </div>

                            <div className="p-5 rounded-2xl mb-8" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                <MonteCarloChart
                                    simulations={fullMetrics.monteCarlo.simulations}
                                    averageCaseReturn={fullMetrics.monteCarlo.averageCase}
                                />
                                <p className="text-xs text-center mt-5 mb-2 leading-relaxed" style={{ color: "#6b7280" }}>
                                    Monte Carlo simulation randomizes the order of trades to estimate the range of possible future outcomes.<br />
                                    This helps evaluate strategy robustness and risk exposure.
                                </p>
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
                                Simular escenarios Prop Firm
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* Prop firm simulator */}
                {step === "sim" && parseResult && (
                    <PropFirmSimulator trades={parseResult.trades} />
                )}
            </div>

            {/* Cross-sell CTA */}
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
                            ¿Querés automatizarla?
                        </p>
                        <h3 className="text-lg font-bold text-white mb-2">
                            Convertimos tu estrategia en un bot para MT5
                        </h3>
                        <p className="text-sm mb-4" style={{ color: "#6b7280" }}>
                            Backtesting profesional, optimización de parámetros y entrega del
                            .ex5 sin exponer tu código.
                        </p>
                        <a href="/nodoquant#contacto" className="btn-primary">
                            Ver servicios y precios
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
