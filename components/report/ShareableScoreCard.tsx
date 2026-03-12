"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

interface Props {
    strategyScore: number;
    strategyName: string;
    winRate: number;      // 0-100
    profitFactor: number;
    expectancy: number;   // in R
    maxDrawdown: number;  // positive number, %
    totalTrades: number;
    reportUrl: string;
}

export default function ShareableScoreCard({
    strategyScore, strategyName, winRate, profitFactor,
    expectancy, maxDrawdown, totalTrades, reportUrl,
}: Props) {
    const t = useTranslations("fullReport");
    const cardRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);

    function scoreTier(s: number): { label: string; color: string; bg: string; border: string } {
        if (s >= 80) return { label: t("score.strongEdge"), color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" };
        if (s >= 60) return { label: t("score.positiveEdge"), color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd" };
        if (s >= 40) return { label: t("score.marginalEdge"), color: "#d97706", bg: "#fffbeb", border: "#fde68a" };
        return { label: t("score.noEdge"), color: "#dc2626", bg: "#fef2f2", border: "#fecaca" };
    }

    const tier = scoreTier(strategyScore);
    const score = Math.round(strategyScore);
    const wr = winRate > 1 ? winRate : winRate * 100;

    const downloadPng = async () => {
        if (!cardRef.current || downloading) return;
        setDownloading(true);
        try {
            const html2canvas = (await import("html2canvas")).default;
            const canvas = await html2canvas(cardRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: null,
                logging: false,
            });
            const url = canvas.toDataURL("image/png");
            const a = document.createElement("a");
            a.href = url;
            a.download = `nodoquant-strategy-score.png`;
            a.click();
        } catch (e) {
            console.error("Failed to export PNG:", e);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* The card itself — white background for social sharing */}
            <div
                ref={cardRef}
                style={{
                    background: "#ffffff",
                    borderRadius: "20px",
                    padding: "32px",
                    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                    boxShadow: "0 4px 32px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)",
                    maxWidth: "520px",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Subtle gradient accent top bar */}
                <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: "4px",
                    background: "linear-gradient(90deg, #6366f1 0%, #10b981 100%)",
                }} />

                {/* Header: NodoQuant brand */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{
                            width: "28px", height: "28px", borderRadius: "8px",
                            background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <span style={{ color: "#fff", fontSize: "14px", fontWeight: "900" }}>N</span>
                        </div>
                        <span style={{ fontSize: "14px", fontWeight: "700", color: "#111827" }}>NodoQuant</span>
                    </div>
                    <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: "500", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        {t("sharing.analysisLabel")}
                    </span>
                </div>

                {/* Strategy name */}
                <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "6px", fontWeight: "500" }}>
                    {strategyName || t("sharing.tradingStrategy")}
                </p>

                {/* Score hero */}
                <div style={{
                    display: "flex", alignItems: "center", gap: "20px",
                    padding: "20px", borderRadius: "16px",
                    background: tier.bg, border: `1.5px solid ${tier.border}`,
                    marginBottom: "20px",
                }}>
                    <div style={{ textAlign: "center", minWidth: "80px" }}>
                        <div style={{ fontSize: "56px", fontWeight: "900", lineHeight: "1", color: tier.color, fontVariantNumeric: "tabular-nums" }}>
                            {score}
                        </div>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: tier.color, marginTop: "4px" }}>
                            / 100
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: "18px", fontWeight: "800", color: tier.color, marginBottom: "4px" }}>
                            {tier.label}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            {t("score.analyzed", { count: totalTrades })}
                        </div>
                    </div>
                </div>

                {/* Metrics grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
                    {[
                        { label: t("metrics.winrate.label"), value: `${wr.toFixed(1)}%`, good: wr >= 50 },
                        { label: t("metrics.profitFactor.label"), value: profitFactor.toFixed(2), good: profitFactor >= 1.5 },
                        { label: t("metrics.expectancy.label"), value: `${expectancy >= 0 ? "+" : ""}${expectancy.toFixed(2)}R`, good: expectancy > 0 },
                        { label: t("metrics.maxDrawdown.label"), value: `${maxDrawdown.toFixed(1)}%`, good: maxDrawdown <= 20 },
                    ].map(m => (
                        <div key={m.label} style={{
                            background: "#f9fafb", borderRadius: "12px", padding: "12px 14px",
                            border: "1px solid #f3f4f6",
                        }}>
                            <div style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "600", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                {m.label}
                            </div>
                            <div style={{ fontSize: "20px", fontWeight: "800", color: m.good ? "#059669" : "#dc2626", fontVariantNumeric: "tabular-nums" }}>
                                {m.value}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer: URL */}
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    paddingTop: "16px", borderTop: "1px solid #f3f4f6",
                }}>
                    <p style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "500" }}>
                        nodoquant.com
                    </p>
                    <p style={{ fontSize: "11px", color: "#9ca3af", maxWidth: "280px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {reportUrl}
                    </p>
                </div>
            </div>

            {/* Download button */}
            <button
                onClick={downloadPng}
                disabled={downloading}
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
                style={{
                    background: downloading ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: downloading ? "#6b7280" : "#e5e7eb",
                    cursor: downloading ? "not-allowed" : "pointer",
                }}
                onMouseEnter={e => { if (!downloading) (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.4)"; }}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"}
            >
                {downloading ? (
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>
                ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                )}
                {downloading ? t("sharing.downloading") : t("sharing.downloadBtn")}
            </button>
        </div>
    );
}
