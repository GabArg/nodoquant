"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { type ParseResult, parseTrades, parseGenericCSV, type Trade } from "@/lib/analyzer/parser";

interface ImportWizardProps {
    fileContent: string;
    fileName: string;
    onComplete: (result: ParseResult) => void;
    onCancel: () => void;
}

const FIELDS = [
    { key: "dateIdx", group: "required" },
    { key: "profitIdx", group: "required" },
    { key: "entryPriceIdx", group: "required" },
    { key: "exitPriceIdx", group: "required" },
    { key: "symbolIdx", group: "optional" },
    { key: "directionIdx", group: "optional" },
    { key: "volumeIdx", group: "optional" },
    { key: "entryTimeIdx", group: "optional" },
    { key: "stopLossIdx", group: "optional" },
    { key: "takeProfitIdx", group: "optional" }
];

export default function ImportWizard({ fileContent, fileName, onComplete, onCancel }: ImportWizardProps) {
    const t = useTranslations("analyzer.importWizard");
    const [step, setStep] = useState<"mapping" | "preview">("mapping");
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<Record<string, number>>({});
    const [error, setError] = useState<string | null>(null);
    const [parsedTrades, setParsedTrades] = useState<ParseResult | null>(null);
    const initialized = useRef(false);
    const [lines, setLines] = useState<string[]>([]);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const fileLines = fileContent
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .split("\n")
            .filter((l) => l.trim().length > 0);

        if (fileLines.length < 2) {
            setError(t("validation.emptyOrInvalid"));
            return;
        }

        setLines(fileLines);

        const detectDelimiter = (line: string) => line.includes("\t") ? "\t" : ",";
        const delim = detectDelimiter(fileLines[0]);
        const parseLine = (l: string) => l.split(delim).map(c => c.trim().replace(/^"|"$/g, ""));

        // Use the first line that has enough columns as header
        let h: string[] = [];
        for (let i = 0; i < Math.min(10, fileLines.length); i++) {
            const cols = parseLine(fileLines[i]);
            if (cols.length >= 3) {
                h = cols;
                break;
            }
        }
        setHeaders(h);

        // 1) Attempt pure automatic parsing (for MT5 and perfectly formatted CSVs)
        try {
            const rawResult = parseTrades(fileContent, fileName);
            if (rawResult.trades.length >= 2) { // Allow less for preview, but at least some trades
                if (rawResult.trades.length < 30) {
                    setError(t("validation.lowTradesWarning", { count: rawResult.trades.length }));
                }
                setParsedTrades(rawResult);
                setStep("preview");
                return;
            }
        } catch (e) {
            // Silently fail pure parse, move to heuristics
        }

        // 2) Attempt heuristic column detection
        const autoMap = detectColumns(h, "auto");
        setMapping(autoMap);

        const hasTime = autoMap.dateIdx !== undefined;
        const hasProfit = autoMap.profitIdx !== undefined;
        const hasPrices = autoMap.entryPriceIdx !== undefined && autoMap.exitPriceIdx !== undefined;

        if (hasTime && (hasProfit || hasPrices)) {
            // Auto skip mapping if we confidently matched required fields!
            const success = attemptParse(autoMap, fileLines);
            if (success) return;
        }

        // If we reach here, auto-detect failed. Stay in mapping step.
    }, [fileContent, fileName]);

    const detectColumns = (h: string[], preset: string) => {
        const autoMap: Record<string, number> = {};
        h.forEach((header, idx) => {
            const lower = header.toLowerCase().replace(/[\s_\-]/g, "");

            if (preset === "mt4") {
                if (lower === "time") {
                    if (autoMap.entryTimeIdx === undefined) autoMap.entryTimeIdx = idx;
                    else autoMap.dateIdx = idx;
                }
                if (lower === "profit") autoMap.profitIdx = idx;
                if (lower === "item") autoMap.symbolIdx = idx;
                if (lower === "size") autoMap.volumeIdx = idx;
                if (lower === "type") autoMap.directionIdx = idx;
                if (lower === "price") {
                    if (autoMap.entryPriceIdx === undefined) autoMap.entryPriceIdx = idx;
                    else autoMap.exitPriceIdx = idx;
                }
                if (lower === "s/l") autoMap.stopLossIdx = idx;
                if (lower === "t/p") autoMap.takeProfitIdx = idx;
            } else if (preset === "binance") {
                if (lower.includes("time") || lower.includes("date")) autoMap.dateIdx = idx;
                if (lower.includes("realizedprofit")) autoMap.profitIdx = idx;
                if (lower.includes("symbol")) autoMap.symbolIdx = idx;
                if (lower.includes("executed")) autoMap.volumeIdx = idx;
                if (lower.includes("side")) autoMap.directionIdx = idx;
                if (lower.includes("average") || lower.includes("price")) autoMap.entryPriceIdx = idx;
            } else if (preset === "mt5") {
                if (lower === "time") autoMap.dateIdx = idx;
                if (lower === "profit") autoMap.profitIdx = idx;
                if (lower === "symbol") autoMap.symbolIdx = idx;
                if (lower === "volume") autoMap.volumeIdx = idx;
                if (lower === "direction" || lower === "type") autoMap.directionIdx = idx;
                if (lower === "price") autoMap.entryPriceIdx = idx;
            } else {
                // Auto / Generic
                if (lower.includes("profit") || lower.includes("pnl") || lower.includes("netprofit") || lower.includes("gain") || lower.includes("result")) autoMap.profitIdx = idx;
                if (lower.includes("time") || lower.includes("date") || lower.includes("timestamp")) {
                    if (autoMap.dateIdx === undefined) autoMap.dateIdx = idx;
                    else autoMap.entryTimeIdx = autoMap.dateIdx; // fallback
                }
                if (lower.includes("symbol") || lower.includes("pair") || lower.includes("asset") || lower.includes("instrument") || lower.includes("market")) autoMap.symbolIdx = idx;
                if (lower.includes("vol") || lower.includes("size") || lower.includes("lot") || lower.includes("qty") || lower.includes("quantity")) autoMap.volumeIdx = idx;
                if (lower.includes("type") || lower.includes("dir") || lower.includes("side")) autoMap.directionIdx = idx;
                if (lower.includes("entryprice") || lower.includes("openprice") || (lower.includes("price") && lower.includes("in"))) autoMap.entryPriceIdx = idx;
                if (lower.includes("exitprice") || lower.includes("closeprice") || (lower.includes("price") && lower.includes("out"))) autoMap.exitPriceIdx = idx;
            }
        });

        // Ensure dateIdx is set if entryTimeIdx was set instead
        if (autoMap.dateIdx === undefined && autoMap.entryTimeIdx !== undefined) {
            autoMap.dateIdx = autoMap.entryTimeIdx;
        }

        return autoMap;
    };

    const applyPreset = (preset: string) => {
        const detected = detectColumns(headers, preset);
        setMapping(detected);
    };

    const handleMapChange = (fieldKey: string, colIdx: number) => {
        setMapping(prev => ({ ...prev, [fieldKey]: colIdx }));
    };

    const attemptParse = (currentMapping: Record<string, number>, linesArray?: string[]) => {
        setError(null);
        if (currentMapping.dateIdx === undefined || currentMapping.dateIdx === -1) {
            setError(t("validation.missingTime"));
            return false;
        }

        const hasProfit = currentMapping.profitIdx !== undefined && currentMapping.profitIdx !== -1;
        const hasPrices = currentMapping.entryPriceIdx !== undefined && currentMapping.entryPriceIdx !== -1 &&
            currentMapping.exitPriceIdx !== undefined && currentMapping.exitPriceIdx !== -1;

        if (!hasProfit && !hasPrices) {
            setError(t("validation.missingProfitOrPrices"));
            return false;
        }

        try {
            const dataLinesToUse = linesArray || lines;
            const dataLines = dataLinesToUse.slice(1); // naive skip 1 header

            const result = parseGenericCSV(dataLines, {
                profitIdx: currentMapping.profitIdx ?? -1,
                dateIdx: currentMapping.dateIdx ?? -1,
                symbolIdx: currentMapping.symbolIdx ?? -1,
                volumeIdx: currentMapping.volumeIdx ?? -1,
                directionIdx: currentMapping.directionIdx ?? -1,
                entryPriceIdx: currentMapping.entryPriceIdx ?? -1,
                exitPriceIdx: currentMapping.exitPriceIdx ?? -1,
                stopLossIdx: currentMapping.stopLossIdx ?? -1,
                takeProfitIdx: currentMapping.takeProfitIdx ?? -1,
                entryTimeIdx: currentMapping.entryTimeIdx ?? -1,
                fileName
            });

            if (result.trades.length < 30) {
                setError(t("validation.tooFewTrades", { count: result.trades.length }));
                // Still allow preview, user can decide to proceed.
            }

            setParsedTrades(result);
            setStep("preview");
            return true;
        } catch (err: any) {
            setError(err.message || t("validation.parseError"));
            return false;
        }
    };

    const handlePreview = () => {
        attemptParse(mapping);
    };

    return (
        <div className="card p-6 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">{t("mapping.title")}</h2>
                <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors">{t("mapping.cancel")}</button>
            </div>

            {error && (
                <div className="mb-4 p-4 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
                    {error}
                </div>
            )}

            {step === "mapping" && (
                <div className="space-y-6 animate-fade-in">
                    <div>
                        <p className="text-sm text-gray-400 mb-3">
                            {t.rich("mapping.undetectedPrompt", { bold: (chunks) => <strong>{chunks}</strong> })}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-4">
                            <span className="text-sm text-gray-500 py-1.5 mr-2">{t("mapping.presets")}</span>
                            <button onClick={() => applyPreset("mt4")} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-sm text-gray-300 transition-colors">{t("mapping.mt4")}</button>
                            <button onClick={() => applyPreset("mt5")} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-sm text-gray-300 transition-colors">{t("mapping.mt5")}</button>
                            <button onClick={() => applyPreset("binance")} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-sm text-gray-300 transition-colors">{t("mapping.binance")}</button>
                            <button onClick={() => applyPreset("auto")} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-sm text-gray-300 transition-colors">{t("mapping.csv")}</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-xl border border-white/5 bg-black/20">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-indigo-400 text-sm tracking-wide uppercase">{t("mapping.requiredData")}</h3>
                            {FIELDS.filter(f => f.group === "required").map(f => (
                                <div key={f.key} className="flex flex-col gap-1">
                                    <label className="text-sm text-gray-300">{t(`fields.${f.key}`)}</label>
                                    <select
                                        className="bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none"
                                        value={mapping[f.key] ?? -1}
                                        onChange={(e) => handleMapChange(f.key, parseInt(e.target.value))}
                                    >
                                        <option value={-1}>{t("mapping.ignore")}</option>
                                        {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-semibold text-indigo-400 text-sm tracking-wide uppercase">{t("mapping.optionalData")}</h3>
                            {FIELDS.filter(f => f.group === "optional").map(f => (
                                <div key={f.key} className="flex flex-col gap-1">
                                    <label className="text-sm text-gray-300">{t(`fields.${f.key}`)}</label>
                                    <select
                                        className="bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none"
                                        value={mapping[f.key] ?? -1}
                                        onChange={(e) => handleMapChange(f.key, parseInt(e.target.value))}
                                    >
                                        <option value={-1}>{t("mapping.ignore")}</option>
                                        {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button onClick={handlePreview} className="btn-primary">
                            {t("mapping.previewBtn")}
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {step === "preview" && parsedTrades && (
                <div className="space-y-6 animate-fade-in">
                    {parsedTrades.trades.length < 100 && (
                        <div className="p-4 rounded-xl text-sm" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "#fcd34d" }}>
                            {t.rich("preview.statisticalWarning", { count: parsedTrades.trades.length, bold: (chunks) => <strong>{chunks}</strong> })}
                        </div>
                    )}

                    <p className="text-sm text-gray-400">{t("preview.detectedCount", { count: parsedTrades.trades.length })}</p>

                    <div className="overflow-x-auto border border-white/5 rounded-xl">
                        <table className="w-full text-left text-sm text-gray-300">
                            <thead className="text-xs uppercase bg-white/5 text-gray-400">
                                <tr>
                                    <th className="px-4 py-3">{t("preview.table.time")}</th>
                                    <th className="px-4 py-3">{t("preview.table.profit")}</th>
                                    <th className="px-4 py-3">{t("preview.table.symbol")}</th>
                                    <th className="px-4 py-3">{t("preview.table.direction")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parsedTrades.trades.slice(0, 3).map((t, i) => (
                                    <tr key={i} className="border-b border-white/5 bg-black/10">
                                        <td className="px-4 py-3">{t.exit_time?.toLocaleString() ?? t.datetime.toLocaleString()}</td>
                                        <td className={`px-4 py-3 font-medium ${t.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{t.profit.toFixed(2)}</td>
                                        <td className="px-4 py-3">{t.symbol || '-'}</td>
                                        <td className="px-4 py-3">{t.direction || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="pt-4 flex justify-between items-center">
                        <button onClick={() => setStep("mapping")} className="text-sm text-gray-400 hover:text-white transition-colors">
                            {t("preview.backBtn")}
                        </button>
                        <button
                            onClick={() => onComplete(parsedTrades)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center shadow-lg shadow-indigo-600/20"
                            disabled={parsedTrades.trades.length < 30}
                        >
                            {t("preview.analyzeBtn")}
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
