"use client";

import { useState } from "react";
import { fetchBinanceTrades, type BinanceMarket } from "@/lib/import/adapters/binanceAdapter";
import type { NormalizedTrade } from "@/lib/import/normalizedTrade";
import ImportProgressIndicator, { BINANCE_STEPS } from "@/components/import/ImportProgressIndicator";

interface Props {
    onComplete: (trades: NormalizedTrade[]) => void;
    onBack: () => void;
}

const MARKET_OPTIONS: { id: BinanceMarket; label: string; description: string }[] = [
    { id: "spot", label: "Spot", description: "Spot trading history" },
    { id: "futures", label: "Futures (USDT-M)", description: "Perpetual & delivery contracts" },
    { id: "both", label: "Both", description: "Merge Spot + Futures trades" },
];

export default function BinanceImportPanel({ onComplete, onBack }: Props) {
    const [apiKey, setApiKey] = useState("");
    const [secretKey, setSecretKey] = useState("");
    const [market, setMarket] = useState<BinanceMarket>("both");
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [showSecret, setShowSecret] = useState(false);
    const [result, setResult] = useState<{ spotCount: number; futuresCount: number } | null>(null);

    const handleFetch = async () => {
        if (!apiKey.trim() || !secretKey.trim()) {
            setError("Both API key and secret key are required.");
            return;
        }
        setError(null);
        setLoading(true);
        setCurrentStep(0); // Step 1: Fetching trades

        try {
            // Simulate step progression with a minimum time per step for UX
            await delay(600);
            setCurrentStep(1); // Step 2: Parsing data

            const res = await fetchBinanceTrades({ apiKey: apiKey.trim(), secretKey: secretKey.trim(), market });

            if (res.error) {
                setError(res.error);
                setLoading(false);
                return;
            }
            if (res.trades.length === 0) {
                setError("No trades found. Make sure your API key has Read access and you have closed positions.");
                setLoading(false);
                return;
            }

            setCurrentStep(2); // Step 3: Normalizing trades
            await delay(400);

            setCurrentStep(3); // Step 4: Generating report
            await delay(300);

            setResult({ spotCount: res.spotCount, futuresCount: res.futuresCount });
            onComplete(res.trades);
        } catch (e: any) {
            setError(e?.message ?? "Connection failed. Check your internet and try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                    Back
                </button>
                <h2 className="text-lg font-bold text-white">Connect Binance Account</h2>
            </div>

            {/* Show progress indicator while loading */}
            {loading ? (
                <ImportProgressIndicator steps={BINANCE_STEPS} currentStep={currentStep} error={error} />
            ) : (
                <>
                    {/* Security notice */}
                    <div className="rounded-xl px-4 py-3 text-sm flex items-start gap-3"
                        style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", color: "#6ee7b7" }}>
                        <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        <div>
                            <strong className="font-semibold text-emerald-300">Your keys are never stored.</strong>
                            {" "}They are sent over HTTPS, used once to fetch your trade history, and immediately discarded. We recommend creating a <strong>read-only</strong> API key.
                        </div>
                    </div>

                    {/* Market selector */}
                    <div>
                        <label className="text-sm font-medium text-white mb-2 block">Markets to import</label>
                        <div className="flex gap-2">
                            {MARKET_OPTIONS.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setMarket(opt.id)}
                                    className="flex-1 py-2.5 px-3 rounded-xl text-sm font-medium border transition-all"
                                    style={{
                                        background: market === opt.id ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.02)",
                                        borderColor: market === opt.id ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.07)",
                                        color: market === opt.id ? "#fcd34d" : "#9ca3af",
                                    }}
                                >
                                    <div className="font-semibold">{opt.label}</div>
                                    <div className="text-xs opacity-70 mt-0.5">{opt.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* API Key inputs */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-white mb-1.5 block">API Key</label>
                            <input
                                type="text"
                                value={apiKey}
                                onChange={e => setApiKey(e.target.value)}
                                placeholder="Paste your Binance API key..."
                                autoComplete="off"
                                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none font-mono"
                                style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}
                                onFocus={e => (e.target.style.borderColor = "rgba(99,102,241,0.5)")}
                                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-white mb-1.5 block">Secret Key</label>
                            <div className="relative">
                                <input
                                    type={showSecret ? "text" : "password"}
                                    value={secretKey}
                                    onChange={e => setSecretKey(e.target.value)}
                                    placeholder="Paste your Binance secret key..."
                                    autoComplete="new-password"
                                    className="w-full rounded-xl px-4 py-3 pr-12 text-sm text-white outline-none font-mono"
                                    style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}
                                    onFocus={e => (e.target.style.borderColor = "rgba(99,102,241,0.5)")}
                                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowSecret(s => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                >
                                    {showSecret
                                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" /></svg>
                                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                    }
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* How to create a read-only key */}
                    <details className="rounded-xl p-4 cursor-pointer"
                        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <summary className="text-sm font-medium text-white list-none flex items-center gap-2">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                            How to create a Binance read-only API key
                        </summary>
                        <ol className="text-xs mt-3 space-y-1.5 leading-relaxed" style={{ color: "#9ca3af" }}>
                            <li>1. Log in to Binance → click your profile → <strong className="text-white">API Management</strong></li>
                            <li>2. Click <strong className="text-white">Create API</strong> → choose System Generated</li>
                            <li>3. Enable only <strong className="text-white">Read</strong> permissions — <em>do not</em> enable trading or withdrawals</li>
                            <li>4. Copy the API Key and Secret Key, then paste them above</li>
                        </ol>
                    </details>

                    {/* Error */}
                    {error && (
                        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
                            {error}
                        </div>
                    )}

                    {/* Success */}
                    {result && (
                        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#6ee7b7" }}>
                            ✓ Fetched {result.spotCount + result.futuresCount} trades
                            {result.spotCount > 0 && result.futuresCount > 0 && ` (${result.spotCount} Spot + ${result.futuresCount} Futures)`}
                        </div>
                    )}

                    <button
                        onClick={handleFetch}
                        disabled={!apiKey.trim() || !secretKey.trim()}
                        className="w-full font-bold text-white py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                        style={{
                            background: !apiKey.trim() || !secretKey.trim()
                                ? "rgba(99,102,241,0.3)"
                                : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                            cursor: !apiKey.trim() || !secretKey.trim() ? "not-allowed" : "pointer",
                            boxShadow: "0 0 20px rgba(99,102,241,0.25)",
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                        Import {market === "both" ? "Spot + Futures" : market === "futures" ? "USDT-M Futures" : "Spot"} trades
                    </button>
                </>
            )}
        </div>
    );
}

function delay(ms: number) {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
}
