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
import StrategyInsight from "@/components/analyzer/StrategyInsight";
import OnboardingPanel from "@/components/analyzer/OnboardingPanel";
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


type Step = "source" | "upload" | "importing" | "confirm" | "basic" | "gate" | "full";

function getUIStepIndex(s: Step) {
    if (s === "source" || s === "upload") return 0;
    if (s === "importing" || s === "confirm") return 1;
    if (s === "basic") return 2;
    return 3; // gate, full
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
    const [triggerUnlock, setTriggerUnlock] = useState(0);
    const [analysisId, setAnalysisId] = useState<string | null>(null);
    const [datasetName, setDatasetName] = useState("");
    const [pendingNormalized, setPendingNormalized] = useState<{ trades: NormalizedTrade[]; source: ImportSource } | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);
    const searchParams = useSearchParams();
    const uploadRef = useRef<HTMLDivElement>(null);
    const isRestoring = useRef(false);

    useEffect(() => {
        if (isRestoring.current) return;
        isRestoring.current = true;

        const saved = sessionStorage.getItem("nodoquant_analyzer_state");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const hydrateState = (obj: any): any => {
                    if (!obj || typeof obj !== 'object') return obj;
                    const newObj = Array.isArray(obj) ? [...obj] : { ...obj };
                    for (const key in newObj) {
                        const val = newObj[key];
                        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
                            newObj[key] = new Date(val);
                        } else if (typeof val === 'object' && val !== null) {
                            newObj[key] = hydrateState(val);
                        }
                    }
                    return newObj;
                };

                const hydrated = hydrateState(parsed);
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

                setTimeout(() => setIsHydrated(true), 100);
            } catch (e) {
                console.error("Failed to restore session", e);
                setIsHydrated(true); 
            }
        } else {
            setIsHydrated(true);
        }
    }, []);

    useEffect(() => {
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
        const timer = setTimeout(() => {
            sessionStorage.setItem("nodoquant_analyzer_state", JSON.stringify(stateToSave));
        }, 500);
        return () => clearTimeout(timer);
    }, [step, importSource, fileState, parseResult, basicMetrics, fullMetrics, unlockedEmail, analysisId, datasetName, pendingNormalized, isHydrated]);

    useEffect(() => {
        if (!isHydrated) return;
        const saved = sessionStorage.getItem("nodoquant_analyzer_state");
        if (searchParams.get("sample") === "true" && !saved) {
            handleFile(sampleCsvData, "sample_data.csv");
        }
    }, [searchParams, isHydrated]);

    useEffect(() => {
        async function checkPlan() {
            try {
                const supabase = (await import("@/lib/auth/client")).createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) setIsAuthenticated(true);
                const res = await fetch(`/${locale}/api/user/plan`);
                const data = await res.json();
                if (data.isPro) setIsPro(true);
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
            setParseResult({ ...fakeResult, trades: uniqueTrades } as any);
            setBasicMetrics(basic);
            setFullMetrics(full);
            setStep("basic");
            trackEvent('analyzer_run', { source, total_trades: basic.totalTrades, win_rate: basic.winrate, profit_factor: basic.profitFactor, removed_duplicates: legacyTrades.length - uniqueTrades.length });
            trackEvent("analysis_completed", { trades: basic.totalTrades, profitFactor: basic.profitFactor, isPro });
        } catch (err: unknown) {
            setParseError(err instanceof Error ? err.message : "Error calculating metrics.");
            setStep("source");
        }
    }, [pendingNormalized]);

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
            setStep("basic");
            trackEvent('analyzer_run', { source: result.format, total_trades: basic.totalTrades, win_rate: basic.winrate, profit_factor: basic.profitFactor, removed_duplicates: result.trades.length - uniqueTrades.length });
            trackEvent("analysis_completed", { trades: basic.totalTrades, profitFactor: basic.profitFactor, isPro });
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
        try {
            const { data: { user } } = await (await import("@/lib/auth/client")).createClient().auth.getUser();
            if (user) {
                const res = await fetch(`/${locale}/api/user/trial`, { method: "POST" });
                const data = await res.json();
                if (data.ok && data.isPro) setIsPro(true);
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

    const isNoEdge = fullMetrics?.advanced?.verdict === "noEdge";
    const currentIdx = getUIStepIndex(step);

    return (
        <div className="min-h-screen pt-20 pb-24" style={{ background: "var(--bg)" }}>
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

                {step === "basic" && basicMetrics && parseResult && fullMetrics && (
                    <div className="space-y-12 animate-fade-in">
                        <div className="order-1">
                            <BasicResults metrics={basicMetrics} fullMetrics={fullMetrics} format={parseResult.format} fileName={parseResult.fileName} trades={parseResult.trades} onReset={resetToSource} onViewFullReport={() => { setStep("gate"); setTriggerUnlock(prev => prev + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
                        </div>
                        <div className="order-2 animate-fade-in" style={{ animationDelay: "200ms" }}>
                            <EquityChart data={fullMetrics.equityCurve} />
                        </div>
                        <div className="order-3 animate-fade-in" style={{ animationDelay: "300ms" }}>
                            <ScoreExplanation />
                        </div>
                        <div className="order-4 animate-fade-in" style={{ animationDelay: "400ms" }}>
                            <StrategyDiagnostics metrics={basicMetrics} fullMetrics={fullMetrics} trades={parseResult.trades} isNoEdge={isNoEdge} isPro={isPro} />
                        </div>
                        <div className="order-5 animate-fade-in" style={{ animationDelay: "500ms" }}>
                            <StrategyInsight profitFactor={basicMetrics.profitFactor} winrate={basicMetrics.winrate} maxDrawdown={basicMetrics.maxDrawdown} totalTrades={basicMetrics.totalTrades} trades={parseResult.trades} isNoEdge={isNoEdge} />
                        </div>
                        <div className="order-6 pt-16 border-t border-white/[0.05] animate-fade-in" style={{ animationDelay: "600ms" }}>
                            <div className="text-center mb-10 space-y-4">
                                <h3 className="text-3xl font-black text-white mb-2 tracking-tight italic uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">{t("nextStepsTitle")}</h3>
                                <p className="text-base text-gray-400 font-bold max-w-lg mx-auto leading-relaxed italic">{(basicMetrics?.profitFactor ?? 0) >= 1.05 ? t("nextStepsDescGood") : t("nextStepsDescBad")}</p>
                            </div>
                            <div className="flex flex-col items-center gap-8">
                                <div className="flex flex-col items-center gap-4 w-full sm:w-auto">
                                    <button onClick={() => { setStep("gate"); setTriggerUnlock(prev => prev + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="btn-primary px-16 py-6 w-full sm:w-auto text-[13px] font-black uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(99,102,241,0.5)] group rounded-3xl border border-white/20 active:scale-95 transition-all">
                                        <span className="flex items-center gap-3">{t("viewReport") || "Unlock full analysis"}<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14M12 5l7 7-7 7" /></svg></span>
                                    </button>
                                    <div className="text-center space-y-2">
                                        <p className="text-[11px] text-indigo-300 font-black uppercase tracking-[0.2em] drop-shadow-sm">{t("viewReportSubtitle") || "See failure scenarios, risk simulations, and real expectancy."}</p>
                                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.1em] opacity-40">Basado en tus trades reales · No es una opinión</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === "gate" && parseResult && basicMetrics && (
                    <div className="space-y-4">
                        <BasicResults metrics={basicMetrics} fullMetrics={fullMetrics || undefined} format={parseResult.format} fileName={parseResult.fileName} trades={parseResult.trades} onReset={resetToSource} onViewFullReport={() => { setTriggerUnlock(prev => prev + 1); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }} />
                        <EmailGate metricsPayload={{ basic: basicMetrics, equity_curve: fullMetrics?.equityCurve, drawdown_curve: fullMetrics?.drawdownCurve, trade_histogram: fullMetrics?.tradeHistogram }} basicMetrics={{ trades_count: basicMetrics.totalTrades, winrate: basicMetrics.winrate, profit_factor: basicMetrics.profitFactor, max_drawdown: basicMetrics.maxDrawdown, sum_profit: basicMetrics.sumProfit }} fileName={parseResult.fileName} dateRangeStart={parseResult.dateRangeStart?.toISOString()} dateRangeEnd={parseResult.dateRangeEnd?.toISOString()} strategyId={""} datasetName={datasetName} isAuthenticated={isAuthenticated} onUnlocked={handleEmailUnlocked} triggerUnlock={triggerUnlock} />
                    </div>
                )}

                {step === "full" && fullMetrics && parseResult && (
                    <div className="space-y-10 animate-fade-in">
                        <FullReport metrics={fullMetrics} trades={parseResult.trades} email={unlockedEmail} analysisId={analysisId} isPro={isPro} />
                    </div>
                )}
            </div>
        </div>
    );
}
