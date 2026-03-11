"use client";

import { useState } from "react";

interface Props {
    analysisId: string;
    currentPublicId?: string | null;
    isPublic?: boolean;
    showStrategyName?: boolean;
    showDatasetName?: boolean;
}

export default function ShareReportButton({
    analysisId,
    currentPublicId,
    isPublic: initialPublic = false,
    showStrategyName: initialShowStrategy = false,
    showDatasetName: initialShowDataset = false,
}: Props) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [publicUrl, setPublicUrl] = useState(
        currentPublicId ? `${window.location.origin}/report/${currentPublicId}` : ""
    );
    const [shared, setShared] = useState(initialPublic);
    const [showStrategy, setShowStrategy] = useState(initialShowStrategy);
    const [showDataset, setShowDataset] = useState(initialShowDataset);
    const [copied, setCopied] = useState(false);

    async function handleShare() {
        setLoading(true);
        try {
            const res = await fetch("/api/report/share", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    analysis_id: analysisId,
                    show_strategy_name: showStrategy,
                    show_dataset_name: showDataset,
                }),
            });
            const data = await res.json();
            if (data.ok) {
                setPublicUrl(data.public_url);
                setShared(true);
            }
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }

    function handleCopy() {
        navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="text-sm font-medium px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
                style={{
                    background: shared ? "rgba(52,211,153,0.1)" : "rgba(99,102,241,0.1)",
                    color: shared ? "#34d399" : "#818cf8",
                    border: `1px solid ${shared ? "rgba(52,211,153,0.2)" : "rgba(99,102,241,0.2)"}`,
                }}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                {shared ? "Compartido" : "Share Report"}
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
                    <div
                        className="w-full max-w-md rounded-2xl p-6 space-y-5 animate-fade-in"
                        style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">Compartir análisis</h3>
                            <button
                                onClick={() => setOpen(false)}
                                style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer" }}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showStrategy}
                                    onChange={(e) => setShowStrategy(e.target.checked)}
                                    className="form-checkbox"
                                />
                                <span className="text-sm text-gray-300">Mostrar nombre de estrategia</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showDataset}
                                    onChange={(e) => setShowDataset(e.target.checked)}
                                    className="form-checkbox"
                                />
                                <span className="text-sm text-gray-300">Mostrar nombre del dataset</span>
                            </label>
                        </div>

                        {shared && publicUrl && (
                            <div className="rounded-xl p-3 flex items-center gap-2"
                                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                <input
                                    type="text"
                                    readOnly
                                    value={publicUrl}
                                    className="flex-1 bg-transparent text-sm text-gray-300 outline-none font-mono"
                                />
                                <button
                                    onClick={handleCopy}
                                    className="text-xs font-medium px-3 py-1.5 rounded-lg"
                                    style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}
                                >
                                    {copied ? "✓ Copied" : "Copy"}
                                </button>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                className="btn-primary flex-1 justify-center text-sm"
                                onClick={handleShare}
                                disabled={loading}
                            >
                                {loading ? "Generando..." : shared ? "Actualizar link" : "Generar link público"}
                            </button>
                        </div>

                        <p className="text-xs text-center" style={{ color: "#374151" }}>
                            El reporte público muestra métricas y gráficos sin exponer tus datos personales.
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
