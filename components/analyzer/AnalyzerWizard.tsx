"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import ScoreExplanation from "@/components/analyzer/ScoreExplanation";
import StrategyDiagnostics from "@/components/analyzer/StrategyDiagnostics";
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
import ComparisonDashboard from "@/components/analyzer/ComparisonDashboard";
import { useComparison } from "@/hooks/useComparison";
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
    const locale = useLocale();
    const [step, setStep] = useState<Step>("source");
    const [importSource, setImportSource] = useState<ImportSource | null>(null);
    const [fileState, setFileState] = useState<{ content: string; name: string } | null>(null);
    const [parseResult, setParseResult] = useState<ParseResult | null>(null);
    const [basicMetrics, setBasicMetrics] = useState<BasicMetrics | null>(null);
    const [fullMetrics, setFullMetrics] = useState<FullMetrics | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [unlockedEmail, setUnlockedEmail] = useState("");
    const [isPro, setIsPro] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [strategyId, setStrategyId] = useState("");
    const [showComparison, setShowComparison] = useState(false);
    const { comparisonList, addToComparison, removeFromComparison, isFull } = useComparison(isPro);
    const compT = useTranslations("analyzer.comparison");
    const [analysisId, setAnalysisId] = useState<string | null>(null);
    const [datasetName, setDatasetName] = useState("");
    const [pendingNormalized, setPendingNormalized] = useState<{ trades: NormalizedTrade[]; source: ImportSource } | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);
    const searchParams = useSearchParams();
    const uploadRef = useRef<HTMLDivElement>(null);
    const isRestoring = useRef(false);

    // Persistence: Load from sessionStorage on mount
    useEffect(() => {
        if (isRestoring.current) return;
        isRestoring.current = true;

        const saved = sessionStorage.getItem("nodoquant_analyzer_state");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);

                // Deeply hydrate Dates specifically where we expect them
                const hydrateState = (obj: any): any => {
                    if (!obj || typeof obj !== 'object') return obj;

                    const newObj = Array.isArray(obj) ? [...obj] : { ...obj };

                    for (const key in newObj) {
                        const val = newObj[key];
                        // Match ISO date strings
                        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
                            newObj[key] = new Date(val);
                        } else if (typeof val === 'object' && val !== null) {
                            newObj[key] = hydrateState(val);
                        }
                    }
                    return newObj;
                };

                const hydrated = hydrateState(parsed);
                
                // Batch updates by using functional updates or just setting them
                // React 18 batches these anyway
                if (hydrated.step) setStep(hydrated.step);
                if (hydrated.importSource) setImportSource(hydrated.importSource);
                if (hydrated.fileState) setFileState(hydrated.fileState);
                if (hydrated.parseResult) setParseResult(hydrated.parseResult);
                if (hydrated.basicMetrics) setBasicMetrics(hydrated.basicMetrics);
                if (hydrated.fullMetrics) setFullMetrics(hydrated.fullMetrics);
                if (hydrated.unlockedEmail) setUnlockedEmail(hydrated.unlockedEmail);
                if (hydrated.analysisId) setAnalysisId(hydrated.analysisId);
                if (hydrated.datasetName) setDatasetName(hydrated.datasetName);
                if (hydrated.pendingNormalized) setPendingNormalized(hydrated.pendingNormalized);

                // Ensure isHydrated is set AFTER state updates have been queued
                // This prevents the save effect from firing immediately with stale state
                setTimeout(() => setIsHydrated(true), 100);
            } catch (e) {
                console.error("Failed to restore session", e);
                setIsHydrated(true); 
            }
        } else {
            setIsHydrated(true);
        }
    }, []);

    // Persistence: Save to sessionStorage on state change
    useEffect(() => {
        // Stop saving until hydration is complete to prevent overwriting with initial state
        if (!isHydrated) return;

        const stateToSave = {
            step,
            importSource,
            fileState,
            parseResult,
            basicMetrics,
            fullMetrics,
            unlockedEmail,
            analysisId,
            datasetName,
            pendingNormalized
        };

        // Debounce saving to avoid excessive writes and potential race conditions
        const timer = setTimeout(() => {
            sessionStorage.setItem("nodoquant_analyzer_state", JSON.stringify(stateToSave));
        }, 500);

        return () => clearTimeout(timer);
    }, [step, importSource, fileState, parseResult, basicMetrics, fullMetrics, unlockedEmail, analysisId, datasetName, pendingNormalized, isHydrated]);

    // Auto-trigger sample data if ?sample=true (only if no session data)
    useEffect(() => {
        if (!isHydrated) return;
        const saved = sessionStorage.getItem("nodoquant_analyzer_state");
        if (searchParams.get("sample") === "true" && !saved) {
            handleFile(sampleCsvData, "sample_data.csv");
        }
    }, [searchParams, isHydrated]);

    // Fetch PRO & Auth status
    useEffect(() => {
        async function checkPlan() {
            try {
                // Check auth
                const supabase = (await import("@/lib/auth/client")).createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setIsAuthenticated(true);
                }

                // Check plan
                const res = await fetch(`/${locale}/api/user/plan`);
                const data = await res.json();
                if (data.isPro) {
                    setIsPro(true);
                }
            } catch (e) {
                console.error("Error fetching auth/plan status:", e);
            }
        }
        checkPlan();
    }, [locale]);

    const UI_STEPS = useMemo(() => [
        { id: "upload", label: t("steps.upload") },
        { id: "mapping", label: t("steps.mapping") },
        { id: "analysis", label: t("steps.analysis") },
        { id: "report", label: t("steps.report") },
    ], [t]);

    const [loadingStage, setLoadingStage] = useState<"parsing" | "normalizing" | "diagnostics" | "finalizing">("parsing");

    const handleFile = useCallback((content: string, fileName: string) => {
        setParseError(null);
        setLoading(true);
        setStep("upload");
        setLoadingStage("parsing");
        
        // Multi-stage loading for professional perceived depth
        const stages: Array<"parsing" | "normalizing" | "diagnostics" | "finalizing"> = ["parsing", "normalizing", "diagnostics", "finalizing"];
        
        stages.forEach((stage, i) => {
            setTimeout(() => setLoadingStage(stage), (i + 1) * 300);
        });

        setTimeout(() => {
            setFileState({ content, name: fileName });
            setStep("importing");
            setLoading(false);
            trackEvent("analysis_started", { fileName });
        }, 1300);
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
            
            // Deduplication
            const seen = new Set<string>();
            const uniqueTrades = legacyTrades.filter(t => {
                const key = `${t.account_id ?? 'default'}-${t.ticket ?? 'noticket'}-${(t.open_time ?? t.datetime).getTime()}-${t.symbol ?? 'nosym'}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

            const fakeResult = buildParseResult(trades, source);
            const basic = calcBasicMetrics(uniqueTrades);
            const full = calcFullMetrics(uniqueTrades);
            
            setParseResult({
                ...fakeResult,
                trades: uniqueTrades
            } as any);
            setBasicMetrics(basic);
            setFullMetrics(full);
            setStep("basic");

            trackEvent('analyzer_run', {
                source,
                total_trades: basic.totalTrades,
                win_rate: basic.winrate,
                profit_factor: basic.profitFactor,
                removed_duplicates: legacyTrades.length - uniqueTrades.length
            });

            trackEvent("analysis_completed", { 
                trades: basic.totalTrades, 
                profitFactor: basic.profitFactor,
                isPro
            });
        } catch (err: unknown) {
            setParseError(err instanceof Error ? err.message : "Error calculating metrics.");
            setStep("source");
        }
    }, [pendingNormalized]);

    const handleImportComplete = useCallback((result: ParseResult) => {
        try {
            // Trade Deduplication logic
            // Deterministic key: account_id + ticket + open_time + symbol
            const seen = new Set<string>();
            const uniqueTrades = result.trades.filter(t => {
                const key = `${t.account_id ?? 'default'}-${t.ticket ?? 'noticket'}-${(t.open_time ?? t.datetime).getTime()}-${t.symbol ?? 'nosym'}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

            const basic = calcBasicMetrics(uniqueTrades);
            const full = calcFullMetrics(uniqueTrades);
            
            setParseResult({
                ...result,
                trades: uniqueTrades
            });
            setBasicMetrics(basic);
            setFullMetrics(full);
            setStep("basic");

            trackEvent('analyzer_run', {
                source: result.format,
                total_trades: basic.totalTrades,
                win_rate: basic.winrate,
                profit_factor: basic.profitFactor,
                removed_duplicates: result.trades.length - uniqueTrades.length
            });

            trackEvent("analysis_completed", { 
                trades: basic.totalTrades, 
                profitFactor: basic.profitFactor,
                isPro
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

    async function handleEmailUnlocked(email: string, id: string) {
        if (!parseResult) return;
        setUnlockedEmail(email);
        setAnalysisId(id);

        // Trial Activation Logic
        try {
            const { data: { user } } = await (await import("@/lib/auth/client")).createClient().auth.getUser();
            if (user) {
                const res = await fetch(`/${locale}/api/user/trial`, { method: "POST" });
                const data = await res.json();
                if (data.ok && data.isPro) {
                    setIsPro(true);
                    if (data.enrolledJustNow) {
                        console.log("Pro trial activated for user:", user.id);
                    }
                }
            }
        } catch (e) {
            console.error("Trial activation failed:", e);
        }

        setStep("full");
    }

    const resetToSource = () => {
        sessionStorage.removeItem("nodoquant_analyzer_state");
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
                    {t("heroTitle")}
                </h1>
                <p className="text-base" style={{ color: "#9ca3af" }}>
                    {t("heroDescription")}
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
                                <div ref={uploadRef} className="relative">
                                    <FileUpload onFile={handleFile} loading={loading} />
                                    
                                    {/* Professional Loading Overlay */}
                                    {loading && (
                                        <div className="absolute inset-0 z-50 rounded-xl overflow-hidden flex flex-col items-center justify-center p-8 transition-all animate-fade-in"
                                            style={{ background: "rgba(5,5,5,0.85)", backdropFilter: "blur(12px)" }}>
                                            
                                            <div className="relative mb-8">
                                                <div className="w-16 h-16 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                                                    {Math.round((UI_STEPS.findIndex(s => s.id === "report") + 1) * 25)}%
                                                </div>
                                            </div>

                                            <div className="text-center space-y-2">
                                                <p className="text-xs font-black text-white uppercase tracking-[0.3em] animate-pulse">
                                                    {t(`loading.${loadingStage}`)}
                                                </p>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                                    {t("freeTool")}
                                                </p>
                                            </div>

                                            {/* Progress line */}
                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/[0.02]">
                                                <div className="h-full bg-indigo-500 transition-all duration-300" 
                                                    style={{ width: loadingStage === "parsing" ? "25%" : loadingStage === "normalizing" ? "50%" : loadingStage === "diagnostics" ? "75%" : "100%" }} />
                                            </div>
                                        </div>
                                    )}
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
                        {/* 1. Strategy Diagnosis Panel (Integrated) */}
                        <div className="order-1">
                            <BasicResults
                                metrics={basicMetrics}
                                fullMetrics={fullMetrics}
                                format={parseResult.format}
                                fileName={parseResult.fileName}
                                trades={parseResult.trades}
                                onReset={resetToSource}
                                onViewFullReport={() => {
                                    setStep("gate");
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                            />
                        </div>

                        {/* 2. Equity Curve */}
                        <div className="order-2 animate-fade-in" style={{ animationDelay: "200ms" }}>
                            <EquityChart data={fullMetrics.equityCurve} />
                        </div>

                        {/* 3. Deep Statistical Insights */}
                        <div className="order-3 animate-fade-in" style={{ animationDelay: "300ms" }}>
                            <ScoreExplanation />
                        </div>

                        {/* 4. Behavioral Analysis (Sessions/Days) */}
                        <div className="order-4 animate-fade-in" style={{ animationDelay: "400ms" }}>
                            <StrategyDiagnostics 
                                metrics={basicMetrics}
                                fullMetrics={fullMetrics}
                                trades={parseResult.trades}
                                onAddToComparison={() => addToComparison({
                                    name: parseResult.fileName || "Strategy",
                                    metrics: basicMetrics,
                                    fullMetrics: fullMetrics,
                                    trades: parseResult.trades
                                })}
                                isInComparison={comparisonList.some(s => s.name === parseResult.fileName)}
                            />
                        </div>

                        {/* 5. Edge Validation Insights */}
                        <div className="order-5 animate-fade-in" style={{ animationDelay: "500ms" }}>
                            <StrategyInsight
                                profitFactor={basicMetrics.profitFactor}
                                winrate={basicMetrics.winrate}
                                maxDrawdown={basicMetrics.maxDrawdown}
                                totalTrades={basicMetrics.totalTrades}
                                trades={parseResult.trades}
                            />
                        </div>

                        {/* 6. Professional Next Steps Gateway */}
                        <div className="order-6 pt-16 border-t border-white/[0.05] animate-fade-in" style={{ animationDelay: "600ms" }}>
                            <div className="text-center mb-10">
                                <h3 className="text-2xl font-black text-white mb-2 tracking-tight italic uppercase">{t("nextStepsTitle")}</h3>
                                <p className="text-sm text-gray-400 font-medium max-w-lg mx-auto leading-relaxed">
                                    {(basicMetrics?.profitFactor ?? 0) >= 1.05 ? t("nextStepsDescGood") : t("nextStepsDescBad")}
                                </p>
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
                            fullMetrics={fullMetrics || undefined}
                            format={parseResult.format}
                            fileName={parseResult.fileName}
                            trades={parseResult.trades}
                            onReset={resetToSource}
                            onViewFullReport={() => {
                                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                            }}
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
                            isAuthenticated={isAuthenticated}
                            onUnlocked={handleEmailUnlocked}
                        />
                    </div>
                )}

                {step === "full" && fullMetrics && parseResult && (
                    <div className="space-y-10">
                        <div className="flex justify-center mb-6">
                            <button
                                onClick={() => setIsPro(!isPro)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                                    isPro 
                                    ? "bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.3)]" 
                                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                                }`}
                            >
                                <span className="text-sm font-bold uppercase tracking-widest">
                                    {isPro ? "PRO VIEW ACTIVE 💎" : "PREVIEW PRO VIEW ✨"}
                                </span>
                            </button>
                        </div>
                        <FullReport
                            metrics={fullMetrics}
                            trades={parseResult.trades}
                            email={unlockedEmail}
                            analysisId={analysisId}
                            onSimulate={() => setStep("sim")}
                            onAddToComparison={() => addToComparison({
                                name: parseResult.fileName || "Strategy",
                                metrics: basicMetrics!,
                                fullMetrics: fullMetrics,
                                trades: parseResult.trades
                            })}
                            isInComparison={comparisonList.some(s => s.name === parseResult.fileName)}
                            isPro={isPro}
                        />

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
                    <div className="space-y-10">
                        <PropFirmSimulator trades={parseResult.trades} isPro={isPro} />
                        <div className="flex flex-col items-center gap-6">
                            <div className="flex flex-wrap justify-center gap-4">
                                <button 
                                    onClick={() => setStep("full")}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/[0.05] border border-white/[0.1] text-gray-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/[0.1] hover:text-white transition-all"
                                >
                                    <span>←</span> {t("steps.report")}
                                </button>
                                <button 
                                    onClick={resetToSource}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/[0.05] border border-white/[0.1] text-gray-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/[0.1] hover:text-white transition-all"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                        <path d="M3 3v5h5" />
                                    </svg>
                                    {t("importAnother")}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showComparison && (
                    <ComparisonDashboard 
                        strategies={comparisonList}
                        onRemove={removeFromComparison}
                        onBack={() => setShowComparison(false)}
                    />
                )}
            </div>

            {/* Floating Comparison Bar */}
            {comparisonList.length > 0 && !showComparison && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
                    <div className="flex items-center gap-4 px-6 py-4 rounded-3xl bg-indigo-600/90 border border-white/20 backdrop-blur-xl shadow-[0_20px_50px_rgba(99,102,241,0.5)]">
                        <div className="flex -space-x-3 overflow-hidden">
                            {comparisonList.map((s, i) => (
                                <div key={s.id} className="w-10 h-10 rounded-2xl bg-white/20 border-2 border-indigo-600 flex items-center justify-center text-xs font-black text-white shadow-xl">
                                    {i + 1}
                                </div>
                            ))}
                            {Array.from({ length: 3 - comparisonList.length }).map((_, i) => (
                                <div key={i} className="w-10 h-10 rounded-2xl bg-black/20 border-2 border-indigo-600 border-dashed flex items-center justify-center text-indigo-300 text-[10px] font-black">
                                    +
                                </div>
                            ))}
                        </div>
                        <div className="h-8 w-px bg-white/10 mx-2" />
                        <button
                            onClick={() => setShowComparison(true)}
                            className="bg-white text-indigo-600 px-6 py-2.5 rounded-2xl text-[10px] font-black tracking-widest uppercase hover:bg-indigo-50 transition-all active:scale-[0.98] shadow-lg"
                        >
                            {compT("view")} ({comparisonList.length}/3)
                        </button>
                    </div>
                </div>
            )}

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
