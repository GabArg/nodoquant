"use client";

import { useState, useCallback } from "react";
import type { NormalizedTrade } from "@/lib/import/normalizedTrade";
import { parseMT5File } from "@/lib/import/adapters/mt5Adapter";
import ImportProgressIndicator, { FILE_STEPS } from "@/components/import/ImportProgressIndicator";

interface Props {
    onComplete: (trades: NormalizedTrade[]) => void;
    onBack: () => void;
}

export default function MT5ImportPanel({ onComplete, onBack }: Props) {
    const [dragOver, setDragOver] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    const processFile = useCallback(async (file: File) => {
        setError(null);
        setLoading(true);
        setCurrentStep(0);
        setFileName(file.name);

        try {
            const content = await file.text();
            setCurrentStep(1); // Parsing
            const trades = parseMT5File(content, file.name);

            if (trades.length === 0) {
                throw new Error(
                    "No trades found. Make sure you're exporting the Deals tab from MT5 (not Positions or Orders). Use Reports → Report to save as HTML or CSV."
                );
            }

            setCurrentStep(2); // Normalizing
            await new Promise(r => setTimeout(r, 300));
            setCurrentStep(3); // Generating
            await new Promise(r => setTimeout(r, 200));

            if (trades.length < 30) {
                setError(`Warning: Only ${trades.length} trades detected. At least 30 are recommended for reliable statistical analysis.`);
            }

            onComplete(trades);
        } catch (e: any) {
            setError(e?.message ?? "Failed to parse MT5 file.");
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
                <h2 className="text-lg font-bold text-white">Import MT5 Statement</h2>
            </div>

            {/* How to export */}
            <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)" }}>
                <p className="font-semibold mb-1" style={{ color: "#c4b5fd" }}>How to export from MetaTrader 5</p>
                <ol className="space-y-1 text-xs leading-relaxed" style={{ color: "#a78bfa" }}>
                    <li>1. Open MT5 → <strong>Toolbox</strong> (Ctrl+T) → <strong>History</strong> tab</li>
                    <li>2. Select date range → right-click → <strong>Report</strong></li>
                    <li>3. Save as <strong>HTML</strong> or <strong>CSV</strong></li>
                    <li>4. ⚠️ Make sure you export <em>Deals</em>, not Positions or Orders</li>
                </ol>
                <p className="text-xs mt-2" style={{ color: "#818cf8" }}>
                    Supported: MT5 HTML statements (.htm/.html) and MT5 Deals CSV export (.csv)
                </p>
            </div>

            {/* Drop zone */}
            <label
                className="flex flex-col items-center justify-center gap-3 rounded-2xl cursor-pointer transition-all select-none"
                style={{
                    minHeight: "200px",
                    border: `2px dashed ${dragOver ? "#8b5cf6" : "rgba(255,255,255,0.1)"}`,
                    background: dragOver ? "rgba(139,92,246,0.05)" : "rgba(255,255,255,0.01)",
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
                        <p className="text-sm text-white mb-4">Processing <span className="font-mono" style={{ color: "#c4b5fd" }}>{fileName}</span></p>
                        <ImportProgressIndicator steps={FILE_STEPS} currentStep={currentStep} />
                    </div>
                ) : (
                    <>
                        <div className="text-4xl">📈</div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-white mb-0.5">Drop your MT5 file here</p>
                            <p className="text-xs" style={{ color: "#6b7280" }}>or click to browse</p>
                        </div>
                        <p className="text-xs" style={{ color: "#374151" }}>.htm · .html · .csv</p>
                    </>
                )}
            </label>

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
