"use client";

import { useState, useCallback } from "react";
import type { NormalizedTrade } from "@/lib/import/normalizedTrade";
import { parseMT4Html, parseMT4Csv } from "@/lib/import/adapters/mt4Adapter";
import ImportProgressIndicator, { FILE_STEPS } from "@/components/import/ImportProgressIndicator";

interface Props {
    onComplete: (trades: NormalizedTrade[]) => void;
    onBack: () => void;
}

export default function MT4ImportPanel({ onComplete, onBack }: Props) {
    const [dragOver, setDragOver] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    const processFile = useCallback(async (file: File) => {
        setError(null);
        setLoading(true);
        setFileName(file.name);
        setCurrentStep(0); // Reading file

        try {
            const content = await file.text();
            setCurrentStep(1); // Parsing data
            const isHtml = file.name.endsWith(".htm") || file.name.endsWith(".html") ||
                content.includes("<html") || content.includes("<table");

            let trades: NormalizedTrade[];
            if (isHtml) {
                trades = parseMT4Html(content);
                if (trades.length === 0) {
                    const res = await fetch("/api/import/mt4", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ html: content }),
                    });
                    const json = await res.json();
                    if (!res.ok) throw new Error(json.error ?? "Failed to parse MT4 statement");
                    trades = json.trades ?? [];
                }
            } else {
                trades = parseMT4Csv(content);
            }

            if (trades.length === 0) {
                throw new Error(
                    "No trades found in this file. Make sure you exported the full account history from MT4 (Reports → Full Account → HTML or CSV)."
                );
            }

            setCurrentStep(2); // Normalizing
            await new Promise(r => setTimeout(r, 300));
            setCurrentStep(3); // Generating report
            await new Promise(r => setTimeout(r, 200));

            if (trades.length < 30) {
                setError(`Warning: Only ${trades.length} trades found. At least 30 are recommended for meaningful analysis.`);
            }

            onComplete(trades);
        } catch (e: any) {
            setError(e?.message ?? "Failed to parse file.");
        } finally {
            setLoading(false);
        }
    }, [onComplete]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    }, [processFile]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    }, [processFile]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                    Back
                </button>
                <h2 className="text-lg font-bold text-white">Import MT4 Statement</h2>
            </div>

            {/* How to export guide */}
            <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.15)" }}>
                <p className="font-semibold mb-1" style={{ color: "#7dd3fc" }}>How to export from MetaTrader 4</p>
                <ol className="space-y-1 text-xs leading-relaxed" style={{ color: "#93c5fd" }}>
                    <li>1. Open MT4 → <strong>Account History</strong> tab in the Terminal</li>
                    <li>2. Right-click on any trade → <strong>Save as Report (Full Account)</strong></li>
                    <li>3. Choose <strong>HTML</strong> format → save the file</li>
                    <li>4. Upload it below</li>
                </ol>
                <p className="text-xs mt-2" style={{ color: "#60a5fa" }}>
                    Supported: MT4 HTML statements (.htm/.html) and MT4 CSV exports (.csv)
                </p>
            </div>

            {/* Drop zone */}
            <label
                className="flex flex-col items-center justify-center gap-3 rounded-2xl cursor-pointer transition-all select-none"
                style={{
                    minHeight: "200px",
                    border: `2px dashed ${dragOver ? "#6366f1" : "rgba(255,255,255,0.1)"}`,
                    background: dragOver ? "rgba(99,102,241,0.06)" : "rgba(255,255,255,0.01)",
                }}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    accept=".htm,.html,.csv,.txt"
                    className="hidden"
                    onChange={handleFileInput}
                />
                {loading ? (
                    <div className="py-4">
                        <p className="text-sm text-white mb-4">Processing <span className="font-mono text-indigo-300">{fileName}</span></p>
                        <ImportProgressIndicator steps={FILE_STEPS} currentStep={currentStep} />
                    </div>
                ) : (
                    <>
                        <div className="text-4xl">📊</div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-white mb-0.5">Drop your MT4 file here</p>
                            <p className="text-xs" style={{ color: "#6b7280" }}>or click to browse</p>
                        </div>
                        <p className="text-xs" style={{ color: "#374151" }}>.htm · .html · .csv</p>
                    </>
                )}
            </label>

            {/* Error / warning */}
            {error && (
                <div
                    className="rounded-xl px-4 py-3 text-sm"
                    style={{
                        background: error.startsWith("Warning") ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)",
                        border: `1px solid ${error.startsWith("Warning") ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)"}`,
                        color: error.startsWith("Warning") ? "#fcd34d" : "#fca5a5",
                    }}
                >
                    {error}
                </div>
            )}
        </div>
    );
}
