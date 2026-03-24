"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

interface Props {
    histogram: number[];
    minProfit: number;
    maxProfit: number;
}

export default function TradeHistogram({ histogram, minProfit, maxProfit }: Props) {
    const t = useTranslations("analyzer.report.visualizations");
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || histogram.length === 0) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const W = canvas.offsetWidth;
        const H = canvas.offsetHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);

        const range = maxProfit - minProfit || 1;
        const bins = histogram.length;
        const binSize = range / bins;

        const maxCount = Math.max(...histogram, 1);
        const pad = { top: 16, right: 16, bottom: 30, left: 44 };
        const chartW = W - pad.left - pad.right;
        const chartH = H - pad.top - pad.bottom;

        ctx.clearRect(0, 0, W, H);

        // Horizontal grid lines
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 1;
        for (let i = 0; i <= 3; i++) {
            const y = pad.top + (chartH / 3) * i;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(pad.left + chartW, y);
            ctx.stroke();
            // Y count label
            const count = Math.round(maxCount - (maxCount / 3) * i);
            ctx.fillStyle = "#374151";
            ctx.font = "9px Inter, sans-serif";
            ctx.textAlign = "right";
            ctx.fillText(String(count), pad.left - 5, y + 4);
        }

        const barW = chartW / bins;

        for (let i = 0; i < bins; i++) {
            const binStart = minProfit + i * binSize;
            const barH = (histogram[i] / maxCount) * chartH;
            const x = pad.left + i * barW;
            const y = pad.top + chartH - barH;
            // Blue for positive, red for negative
            ctx.fillStyle = binStart >= 0 ? "rgba(59,130,246,0.75)" : "rgba(239,68,68,0.65)";
            ctx.fillRect(x + 1, y, barW - 2, barH);
        }

        // Zero line
        if (minProfit < 0 && maxProfit > 0) {
            const zeroX = pad.left + ((0 - minProfit) / range) * chartW;
            ctx.beginPath();
            ctx.moveTo(zeroX, pad.top);
            ctx.lineTo(zeroX, pad.top + chartH);
            ctx.strokeStyle = "rgba(255,255,255,0.2)";
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // X axis labels
        ctx.font = "10px Inter, sans-serif";
        ctx.fillStyle = "#4b5563";
        ctx.textAlign = "left";
        ctx.fillText(minProfit.toFixed(0), pad.left, pad.top + chartH + 16);
        ctx.textAlign = "right";
        ctx.fillText(maxProfit.toFixed(0), pad.left + chartW, pad.top + chartH + 16);
        if (minProfit < 0 && maxProfit > 0) {
            const zeroX = pad.left + ((0 - minProfit) / range) * chartW;
            ctx.textAlign = "center";
            ctx.fillStyle = "rgba(255,255,255,0.3)";
            ctx.fillText("0", zeroX, pad.top + chartH + 16);
        }
    }, [histogram, minProfit, maxProfit]);

    return (
        <div className="w-full">
            <p className="text-xs font-medium mb-2" style={{ color: "#6b7280" }}>
                {t("tradesDistribution") || "Trade Distribution (P&L)"}
            </p>
            <canvas ref={canvasRef} style={{ width: "100%", height: "140px", display: "block" }} />
            <div className="flex gap-4 mt-2">
                <span className="text-xs flex items-center gap-1.5" style={{ color: "#6b7280" }}>
                    <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(59,130,246,0.75)" }} />
                    {t("winners") || "Winners"}
                </span>
                <span className="text-xs flex items-center gap-1.5" style={{ color: "#6b7280" }}>
                    <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(239,68,68,0.65)" }} />
                    {t("losers") || "Losers"}
                </span>
            </div>
        </div>
    );
}
