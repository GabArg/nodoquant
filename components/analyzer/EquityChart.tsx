"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

interface Props {
    data: number[];
}

export default function EquityChart({ data }: Props) {
    const t = useTranslations("analyzer.charts");
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; trade: number; profit: number } | null>(null);

    // Filter/Downsample data for performance if it's very large
    const processedData = data.length > 2000 
        ? data.filter((_, i) => i % Math.ceil(data.length / 2000) === 0) 
        : data;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || processedData.length < 2) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const W = canvas.offsetWidth;
        const H = canvas.offsetHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);

        const min = Math.min(...processedData);
        const max = Math.max(...processedData);
        const range = max - min || 1;
        const pad = { top: 24, right: 32, bottom: 40, left: 60 };
        const chartW = W - pad.left - pad.right;
        const chartH = H - pad.top - pad.bottom;

        ctx.clearRect(0, 0, W, H);

        // Grid lines
        ctx.strokeStyle = "rgba(255,255,255,0.03)";
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = pad.top + (chartH / 4) * i;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(pad.left + chartW, y);
            ctx.stroke();
            const val = max - (range / 4) * i;
            ctx.fillStyle = "rgba(255,255,255,0.3)";
            ctx.font = "9px tabular-nums font-mono";
            ctx.textAlign = "right";
            ctx.fillText(val.toFixed(0), pad.left - 12, y + 3);
        }

        // Axis Titles
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.font = "bold 9px uppercase tracking-widest";
        ctx.textAlign = "left";
        ctx.fillText(t("equityLabel"), pad.left, pad.top - 12);
        
        ctx.textAlign = "right";
        ctx.fillText(t("trades"), pad.left + chartW, pad.top + chartH + 20);

        const xStep = chartW / (processedData.length - 1);
        const toX = (i: number) => pad.left + i * xStep;
        const toY = (v: number) => pad.top + chartH - ((v - min) / range) * chartH;

        // Gradient fill
        const isProfitable = processedData[processedData.length - 1] >= processedData[0];
        const color = isProfitable ? "#10b981" : "#f87171";

        const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
        grad.addColorStop(0, `${color}20`);
        grad.addColorStop(1, "transparent");

        ctx.beginPath();
        ctx.moveTo(toX(0), toY(processedData[0]));
        for (let i = 1; i < processedData.length; i++) ctx.lineTo(toX(i), toY(processedData[i]));
        ctx.lineTo(toX(processedData.length - 1), pad.top + chartH);
        ctx.lineTo(toX(0), pad.top + chartH);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // Glow line - THICKER (4px)
        ctx.shadowBlur = 30;
        ctx.shadowColor = `${color}80`; // Stronger glow
        ctx.beginPath();
        ctx.moveTo(toX(0), toY(processedData[0]));
        for (let i = 1; i < processedData.length; i++) ctx.lineTo(toX(i), toY(processedData[i]));
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Zero line
        if (min < 0 && max > 0) {
            ctx.beginPath();
            ctx.moveTo(pad.left, toY(0));
            ctx.lineTo(pad.left + chartW, toY(0));
            ctx.strokeStyle = "rgba(255,255,255,0.2)";
            ctx.lineWidth = 1;
            ctx.setLineDash([8, 8]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }, [processedData, t]);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current || processedData.length < 2) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pad = { left: 60, right: 32 };
        const chartW = rect.width - pad.left - pad.right;
        
        const relativeX = Math.min(Math.max(x - pad.left, 0), chartW);
        const pct = relativeX / chartW;
        const index = Math.round(pct * (processedData.length - 1));
        const val = processedData[index];

        const xStep = chartW / (processedData.length - 1);
        const snappedX = pad.left + index * xStep;

        const min = Math.min(...processedData);
        const max = Math.max(...processedData);
        const range = max - min || 1;
        const padTop = 24;
        const chartH = rect.height - 64; 
        const snappedY = padTop + chartH - ((val - min) / range) * chartH;

        // Actual trade index in original data
        const originalIndex = data.length > 2000 
            ? Math.round((index / (processedData.length - 1)) * (data.length - 1))
            : index;

        setTooltip({ 
            x: snappedX, 
            y: snappedY, 
            trade: originalIndex + 1, 
            profit: val 
        });
    };

    if (processedData.length < 2) {
        return (
            <div className="w-full h-[220px] flex items-center justify-center rounded-[24px] bg-white/[0.02] border border-white/[0.05]">
                <p className="text-[10px] text-gray-700 font-black uppercase tracking-[0.3em]">{t("noData")}</p>
            </div>
        );
    }

    return (
        <div 
            ref={containerRef}
            className="w-full card p-6 rounded-[32px] relative overflow-hidden group cursor-crosshair transition-all duration-300 hover:border-white/10"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setTooltip(null)}
        >
            <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-gray-500">{t("equityTitle")}</p>
            
            <div className="relative h-[180px]">
                <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
                
                {/* Tooltip Overlay */}
                {tooltip && (
                    <>
                        {/* Vertical line */}
                        <div 
                            className="absolute top-0 bottom-0 w-px bg-white/10 pointer-events-none"
                            style={{ left: tooltip.x }}
                        />
                        {/* Dot on line */}
                        <div 
                            className="absolute w-2 h-2 rounded-full bg-white ring-4 ring-indigo-500/50 pointer-events-none shadow-[0_0_15px_rgba(99,102,241,0.5)] z-10"
                            style={{ left: tooltip.x - 4, top: tooltip.y - 4 }}
                        />
                        {/* Floating Tooltip */}
                        <div 
                            className="absolute pointer-events-none p-3 rounded-xl bg-gray-950/90 border border-white/10 backdrop-blur-md shadow-2xl z-20 min-w-[140px] animate-in fade-in zoom-in duration-150"
                            style={{ 
                                left: tooltip.x + 20 > containerRef.current!.offsetWidth - 160 ? tooltip.x - 160 : tooltip.x + 20, 
                                top: Math.min(Math.max(tooltip.y - 60, 0), 100),
                            }}
                        >
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
                                {t("tradeNum", { num: tooltip.trade })}
                            </p>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{t("equityLabel")}</span>
                                <span className="text-base font-black tabular-nums" style={{ color: tooltip.profit >= 0 ? '#10b981' : '#f87171' }}>
                                    {tooltip.profit >= 0 ? '+' : ''}${tooltip.profit.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
