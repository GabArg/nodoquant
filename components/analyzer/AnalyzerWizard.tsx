"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import FileUpload from "@/components/analyzer/FileUpload";
import ImportWizard from "@/components/analyzer/ImportWizard";
import EmailGate from "@/components/analyzer/EmailGate";
import FullReport from "@/components/analyzer/FullReport";
import AnalyzerResultSummary from "@/components/analyzer/AnalyzerResultSummary";
import OnboardingPanel from "@/components/analyzer/OnboardingPanel";
import ImportSourceSelector from "@/components/import/ImportSourceSelector";
import BinanceImportPanel from "@/components/import/BinanceImportPanel";
import MT4ImportPanel from "@/components/import/MT4ImportPanel";
import MT5ImportPanel from "@/components/import/MT5ImportPanel";
import type { ParseResult } from "@/lib/analyzer/parser";
import {
    calcBasicMetrics,
    calcFullMetrics,
    type BasicMetrics,
    type FullMetrics,
} from "@/lib/analyzer/metrics";
import { getCanonicalDiagnosis } from "@/lib/analyzer/diagnosis";
import { sampleCsvData } from "@/lib/analyzer/sampleData";
import TradeSummaryPreview from "@/components/import/TradeSummaryPreview";
import { toTradeArray, buildParseResult, type ImportSource } from "@/lib/import/normalizedTrade";
import type { NormalizedTrade } from "@/lib/import/normalizedTrade";
import { trackEvent } from "@/lib/analytics";
import { completionReportHref, type AnalysisSaveOutcome } from "@/lib/analyzer/completion";
import { readAnalyzerState, removeAnalyzerState, writeAnalyzerState } from "@/lib/analyzer/sessionState";
import { serializeFullMetrics } from "@/lib/analyzer/persistedMetrics";


type Step = "source" | "upload" | "importing" | "confirm" | "saving" | "result" | "report";

interface AnalyzerSessionState {
    step: Step;
    importSource: ImportSource | null;
    fileState: { content: string; name: string } | null;
    parseResult: ParseResult | null;
    basicMetrics: BasicMetrics | null;
    fullMetrics: FullMetrics | null;
    analysisId: string | null;
    saveOutcome: AnalysisSaveOutcome | null;
    pendingNormalized: {
        trades: NormalizedTrade[];
        source: ImportSource;
    } | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hydrateState(value: unknown): unknown {
    if (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
    ) {
        return new Date(value);
    }

    if (Array.isArray(value)) {
        return value.map((item) => hydrateState(item));
    }

    if (isRecord(value)) {
        return Object.fromEntries(
            Object.entries(value).map(([key, nestedValue]) => [
                key,
                hydrateState(nestedValue),
            ])
        );
    }

    return value;
}

function getUIStepIndex(s: Step) {
    if (s === "source" || s === "upload") return 0;
    if (s === "importing" || s === "confirm") return 1;
    if (s === "saving" || s === "result") return 2;
    return 3;
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
    const [isPro, setIsPro] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [sessionUserId, setSessionUserId] = useState<string | null>(null);
    const [authResolved, setAuthResolved] = useState(false);
    const [triggerUnlock, setTriggerUnlock] = useState(0);
    const [analysisId, setAnalysisId] = useState<string | null>(null);
    const [saveOutcome, setSaveOutcome] = useState<AnalysisSaveOutcome | null>(null);
    const [pendingNormalized, setPendingNormalized] = useState<{ trades: NormalizedTrade[]; source: ImportSource } | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);
    const searchParams = useSearchParams();
    const uploadRef = useRef<HTMLDivElement>(null);
    const hydratedIdentityRef = useRef<string | null>(null);
    const loadingTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    const clearLoadingTimers = useCallback(() => {
        loadingTimersRef.current.forEach((timer) => clearTimeout(timer));
        loadingTimersRef.current = [];
    }, []);

    useEffect(() => {
        return () => {
            clearLoadingTimers();
        };
    }, [clearLoadingTimers]);


    useEffect(() => {
        if (!authResolved) return;
        const identity = sessionUserId || "anonymous";
        if (hydratedIdentityRef.current === identity) return;

        setIsHydrated(false);
        clearLoadingTimers();
        setStep("source");
        setImportSource(null);
        setFileState(null);
        setParseResult(null);
        setBasicMetrics(null);
        setFullMetrics(null);
        setParseError(null);
        setLoading(false);
        setTriggerUnlock(0);
        setAnalysisId(null);
        setSaveOutcome(null);
        setPendingNormalized(null);

        const saved = readAnalyzerState(sessionStorage, sessionUserId);
        if (saved) {
            try {
                const parsed: unknown = JSON.parse(saved);
                const hydrated = hydrateState(parsed);

                if (!isRecord(hydrated)) {
                    throw new Error("Invalid analyzer session state");
                }

                const restored = hydrated as Partial<AnalyzerSessionState>;

                if (restored.step) {
                    const restoredStep = String(restored.step);
                    setStep(restoredStep === "basic" || restoredStep === "gate" ? "result" : restoredStep === "full" ? "report" : restored.step);
                }
                if (restored.importSource) setImportSource(restored.importSource);
                if (restored.fileState) setFileState(restored.fileState);
                if (restored.parseResult) setParseResult(restored.parseResult);
                if (restored.basicMetrics) setBasicMetrics(restored.basicMetrics);
                if (restored.fullMetrics) setFullMetrics(restored.fullMetrics);
                if (restored.analysisId) setAnalysisId(restored.analysisId);
                if (restored.saveOutcome) setSaveOutcome(restored.saveOutcome);
                if (restored.pendingNormalized) {
                    setPendingNormalized(restored.pendingNormalized);
                }

            } catch (e) {
                console.error("Failed to restore session", e);
            }
        }
        hydratedIdentityRef.current = identity;
        setIsHydrated(true);
    }, [authResolved, sessionUserId, clearLoadingTimers]);

    useEffect(() => {
        if (!isHydrated) return;
        if (hydratedIdentityRef.current !== (sessionUserId || "anonymous")) return;
        const stateToSave = {
            step,
            importSource,
            fileState,
            parseResult,
            basicMetrics,
            fullMetrics,
            analysisId,
            saveOutcome,
            pendingNormalized
        };
        const timer = setTimeout(() => {
            writeAnalyzerState(sessionStorage, sessionUserId, JSON.stringify(stateToSave));
        }, 500);
        return () => clearTimeout(timer);
    }, [step, importSource, fileState, parseResult, basicMetrics, fullMetrics, analysisId, saveOutcome, pendingNormalized, isHydrated, sessionUserId]);

    useEffect(() => {
        let active = true;
        let unsubscribe: (() => void) | undefined;

        async function checkPlan() {
            try {
                const supabase = (await import("@/lib/auth/client")).createClient();
                const refreshPlan = async () => {
                    const res = await fetch("/api/user/plan");
                    const data = await res.json();
                    if (active) setIsPro(Boolean(data.isPro));
                };
                const { data: { user } } = await supabase.auth.getUser();
                if (!active) return;
                setSessionUserId(user?.id || null);
                setIsAuthenticated(Boolean(user));
                setAuthResolved(true);

                const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
                    if (!active) return;
                    const nextUser = nextSession?.user;
                    setIsHydrated(false);
                    setSessionUserId(nextUser?.id || null);
                    setIsAuthenticated(Boolean(nextUser));
                    setIsPro(false);
                    void refreshPlan();
                });
                unsubscribe = () => authListener.subscription.unsubscribe();

                await refreshPlan();
            } catch (e) {
                console.error("Error fetching auth/plan status:", e);
            } finally {
                if (active) setAuthResolved(true);
            }
        }
        checkPlan();
        return () => {
            active = false;
            unsubscribe?.();
        };
    }, [locale]);

    const UI_STEPS = useMemo(() => [
        { id: "upload", label: t("steps.upload") },
        { id: "review", label: t("steps.review") },
        { id: "result", label: t("steps.result") },
        { id: "report", label: t("steps.report") },
    ], [t]);

    const [loadingStage, setLoadingStage] = useState<"parsing" | "normalizing" | "diagnostics" | "finalizing">("parsing");

    const handleFile = useCallback((content: string, fileName: string) => {
        clearLoadingTimers();

        setParseError(null);
        setLoading(true);
        setStep("upload");
        setLoadingStage("parsing");

        const stages: Array<"parsing" | "normalizing" | "diagnostics" | "finalizing"> = [
            "parsing",
            "normalizing",
            "diagnostics",
            "finalizing",
        ];

        stages.forEach((stage, i) => {
            const timer = setTimeout(() => {
                setLoadingStage(stage);
            }, (i + 1) * 300);

            loadingTimersRef.current.push(timer);
        });

        const completionTimer = setTimeout(() => {
            setFileState({ content, name: fileName });
            setStep("importing");
            setLoading(false);
            trackEvent("analysis_started", { fileName });
            loadingTimersRef.current = [];
        }, 1300);

        loadingTimersRef.current.push(completionTimer);
    }, [clearLoadingTimers]);

    useEffect(() => {
        if (!isHydrated) return;
        const saved = readAnalyzerState(sessionStorage, sessionUserId);
        if (searchParams.get("sample") === "true" && !saved) {
            handleFile(sampleCsvData, "sample_data.csv");
        }
    }, [searchParams, isHydrated, handleFile, sessionUserId]);


    const handleNormalizedImport = useCallback((trades: NormalizedTrade[], source: ImportSource) => {
        setPendingNormalized({ trades, source });
        setStep("confirm");
    }, []);

    const confirmAndGenerate = useCallback(() => {
        if (!pendingNormalized) return;
        try {
            const { trades, source } = pendingNormalized;
            const legacyTrades = toTradeArray(trades);
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
            const normalizedResult: ParseResult = {
                ...fakeResult,
                trades: uniqueTrades,
            };
            setParseResult(normalizedResult);
            setBasicMetrics(basic);
            setFullMetrics(full);
            setSaveOutcome(null);
            setStep("saving");
            setTriggerUnlock(prev => prev + 1);
            trackEvent('analyzer_run', { source, total_trades: basic.totalTrades, win_rate: basic.winrate, profit_factor: basic.profitFactor, removed_duplicates: legacyTrades.length - uniqueTrades.length });
            trackEvent("analysis_completed", { trades: basic.totalTrades, profitFactor: basic.profitFactor, isPro });
        } catch (err: unknown) {
            setParseError(err instanceof Error ? err.message : "Error calculating metrics.");
            setStep("source");
        }
    }, [pendingNormalized, isPro]);

    const handleImportComplete = useCallback((result: ParseResult) => {
        try {
            const seen = new Set<string>();
            const uniqueTrades = result.trades.filter(t => {
                const key = `${t.account_id ?? 'default'}-${t.ticket ?? 'noticket'}-${(t.open_time ?? t.datetime).getTime()}-${t.symbol ?? 'nosym'}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
            const basic = calcBasicMetrics(uniqueTrades);
            const full = calcFullMetrics(uniqueTrades);
            setParseResult({ ...result, trades: uniqueTrades });
            setBasicMetrics(basic);
            setFullMetrics(full);
            setSaveOutcome(null);
            setStep("saving");
            setTriggerUnlock(prev => prev + 1);
            trackEvent('analyzer_run', { source: result.format, total_trades: basic.totalTrades, win_rate: basic.winrate, profit_factor: basic.profitFactor, removed_duplicates: result.trades.length - uniqueTrades.length });
            trackEvent("analysis_completed", { trades: basic.totalTrades, profitFactor: basic.profitFactor, isPro });
        } catch (err: unknown) {
            setParseError(err instanceof Error ? err.message : "Error calculando métricas.");
            setStep("upload");
        }
    }, [isPro]);

    const handleImportCancel = useCallback(() => {
        setFileState(null);
        setStep("upload");
    }, []);

    function handleAnalysisCompleted(outcome: AnalysisSaveOutcome) {
        if (!parseResult) return;
        const completedAnalysisId = outcome.status === "saved" || outcome.status === "duplicated" ? outcome.reportId : null;

        // Persist completion immediately. The regular state snapshot is debounced,
        // but closing/reloading as soon as Result appears must not restore `saving`.
        writeAnalyzerState(sessionStorage, sessionUserId, JSON.stringify({
            step: "result",
            importSource,
            fileState,
            parseResult,
            basicMetrics,
            fullMetrics,
            analysisId: completedAnalysisId,
            saveOutcome: outcome,
            pendingNormalized,
        }));
        setSaveOutcome(outcome);
        setAnalysisId(completedAnalysisId);
        setStep("result");
        scrollToAnalyzer();
    }

    const resetToSource = () => {
        clearLoadingTimers();
        removeAnalyzerState(sessionStorage, sessionUserId);

        setStep("source");
        setImportSource(null);
        setFileState(null);
        setParseResult(null);
        setBasicMetrics(null);
        setFullMetrics(null);
        setParseError(null);
        setLoading(false);
        setLoadingStage("parsing");
        setTriggerUnlock(0);
        setAnalysisId(null);
        setSaveOutcome(null);
        setPendingNormalized(null);
    };

    const analyzerRef = useRef<HTMLDivElement>(null);
    const scrollToAnalyzer = () => requestAnimationFrame(() => analyzerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));

    const resetAndRestart = () => {
        resetToSource();
        scrollToAnalyzer();
    };

    const openReport = () => {
        setStep("report");
        scrollToAnalyzer();
    };

    const canonicalVerdict = basicMetrics
        ? getCanonicalDiagnosis(basicMetrics, fullMetrics || undefined)
        : null;
    const currentIdx = getUIStepIndex(step);

    return (
        <div ref={analyzerRef} className="min-h-screen pt-20 pb-24 scroll-mt-20" style={{ background: "var(--bg)" }}>
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
                <div className="section-label mt-8">{t("freeTool")}</div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 leading-tight">{t("heroTitle")}</h1>
                <p className="text-base" style={{ color: "#9ca3af" }}>{t("heroDescription")}</p>
                <div className="flex items-center gap-0 mt-8">
                    {UI_STEPS.map((s, i) => (
                        <div key={s.id} className="flex items-center flex-1 min-w-0">
                            <div className="flex flex-col items-center flex-shrink-0">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300" style={{ background: i <= currentIdx ? "#6366f1" : "rgba(255,255,255,0.06)", color: i <= currentIdx ? "#fff" : "#4b5563", border: i === currentIdx ? "2px solid #818cf8" : "2px solid transparent" }}>
                                    {i < currentIdx ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg> : i + 1}
                                </div>
                                <span className="text-xs mt-1 text-center hidden sm:block" style={{ color: i <= currentIdx ? "#a5b4fc" : "#374151", whiteSpace: "nowrap" }}>{s.label}</span>
                            </div>
                            {i < UI_STEPS.length - 1 && <div className="h-px flex-1 mx-1 transition-all duration-300" style={{ background: i < currentIdx ? "#6366f1" : "rgba(255,255,255,0.08)" }} />}
                        </div>
                    ))}
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {step === "source" && (
                    <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <ImportSourceSelector onSelect={(src) => { setImportSource(src); setStep("upload"); }} />
                    </div>
                )}

                {step === "upload" && (
                    <div className="space-y-6">
                        {importSource === "mt4" && (
                            <div className="rounded-2xl p-6 animate-fade-in" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                <MT4ImportPanel onComplete={(trades) => handleNormalizedImport(trades, "mt4")} onBack={resetToSource} />
                            </div>
                        )}
                        {importSource === "mt5" && (
                            <div className="rounded-2xl p-6 animate-fade-in" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                <MT5ImportPanel onComplete={(trades) => handleNormalizedImport(trades, "mt5")} onBack={resetToSource} />
                            </div>
                        )}
                        {importSource === "binance-spot" && (
                            <div className="rounded-2xl p-6 animate-fade-in" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                <BinanceImportPanel onComplete={(trades) => handleNormalizedImport(trades, "binance-spot")} onBack={resetToSource} />
                            </div>
                        )}
                        {(!importSource || importSource === "csv" || importSource === "generic") && (
                            <div className="space-y-6">
                                <OnboardingPanel importSource={importSource as "csv" | "mt4" | "mt5" | "binance" | null} />
                                <div ref={uploadRef} className="relative">
                                    <FileUpload onFile={handleFile} loading={loading} />
                                    {loading && (
                                        <div className="absolute inset-0 z-50 rounded-xl overflow-hidden flex flex-col items-center justify-center p-8 transition-all animate-fade-in" style={{ background: "rgba(5,5,5,0.85)", backdropFilter: "blur(12px)" }}>
                                            <div className="relative mb-8">
                                                <div className="w-16 h-16 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-indigo-400">{Math.round((UI_STEPS.findIndex(s => s.id === "report") + 1) * 25)}%</div>
                                            </div>
                                            <div className="text-center space-y-2">
                                                <p className="text-xs font-black text-white uppercase tracking-[0.3em] animate-pulse">{t(`loading.${loadingStage}`)}</p>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{t("freeTool")}</p>
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/[0.02]">
                                                <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: loadingStage === "parsing" ? "25%" : loadingStage === "normalizing" ? "50%" : loadingStage === "diagnostics" ? "75%" : "100%" }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-center animate-fade-in pb-8">
                                    <button onClick={() => handleFile(sampleCsvData, "sample_data.csv")} className="text-sm px-4 py-2 rounded-lg font-medium transition-colors" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af" }}>{t("sampleDataCta")}</button>
                                </div>
                            </div>
                        )}
                        {parseError && (
                            <div className="mt-4 p-4 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}><strong>{t("errorReading")}</strong> {parseError}</div>
                        )}
                    </div>
                )}

                {step === "confirm" && pendingNormalized && (
                    <div className="rounded-2xl p-6 animate-fade-in" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <TradeSummaryPreview trades={pendingNormalized.trades} onConfirm={confirmAndGenerate} onBack={() => { setPendingNormalized(null); setStep("upload"); }} />
                    </div>
                )}

                {step === "importing" && fileState && (
                    <div className="mt-8 animate-fade-in">
                        <ImportWizard fileContent={fileState.content} fileName={fileState.name} onComplete={handleImportComplete} onCancel={handleImportCancel} />
                    </div>
                )}




                {step === "saving" && parseResult && basicMetrics && authResolved && (
                    <section aria-live="polite" className="min-h-[50vh] flex items-center justify-center">
                        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.025] p-7">
                            <EmailGate metricsPayload={fullMetrics ? serializeFullMetrics(fullMetrics) : {}} basicMetrics={{ trades_count: basicMetrics.totalTrades, winrate: basicMetrics.winrate, profit_factor: basicMetrics.profitFactor, max_drawdown: basicMetrics.maxDrawdown, sum_profit: basicMetrics.sumProfit }} fileName={parseResult.fileName} dateRangeStart={parseResult.dateRangeStart?.toISOString()} dateRangeEnd={parseResult.dateRangeEnd?.toISOString()} strategyId={""} isAuthenticated={isAuthenticated} onCompleted={handleAnalysisCompleted} triggerUnlock={triggerUnlock} compact />
                        </div>
                    </section>
                )}

                {step === "result" && basicMetrics && fullMetrics && canonicalVerdict && saveOutcome && (
                    <AnalyzerResultSummary metrics={basicMetrics} fullMetrics={fullMetrics} diagnosis={canonicalVerdict} saveOutcome={saveOutcome} onViewReport={openReport} onViewSavedReport={() => { const href = completionReportHref(saveOutcome, locale); if (href) window.location.assign(href); }} onAnalyzeAnother={resetAndRestart} />
                )}

                {step === "report" && fullMetrics && parseResult && (
                    <article aria-labelledby="full-report-title" className="space-y-8 animate-fade-in">
                        <header className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-7">
                            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-indigo-300">{t("report.eyebrow")}</p>
                            <h2 id="full-report-title" className="mt-2 text-2xl sm:text-3xl font-black text-white">{t("report.title")}</h2>
                            <p className="mt-2 text-sm text-gray-400">{t("report.subtitle")}</p>
                            <nav aria-label={t("report.navigationLabel")} className="mt-5 flex flex-col sm:flex-row gap-3">
                                <button type="button" onClick={() => { setStep("result"); scrollToAnalyzer(); }} className="btn-secondary w-full sm:w-auto justify-center px-5 py-2.5">{t("report.backToSummary")}</button>
                                <button type="button" onClick={resetAndRestart} className="btn-secondary w-full sm:w-auto justify-center px-5 py-2.5">{t("completion.analyzeAnother")}</button>
                            </nav>
                        </header>
                        <FullReport metrics={fullMetrics} analysisId={analysisId} isPro={isPro} />
                    </article>
                )}
            </div>
        </div>
    );
}
