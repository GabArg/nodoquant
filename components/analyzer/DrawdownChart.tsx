"use client";

import { useEffect, useRef } from "react";

interface Props {
    data: number[];
}

export default function DrawdownChart({ data }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

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

        const max = Math.max(...data, 1);
        const pad = { top: 20, right: 16, bottom: 30, left: 52 };
        const chartW = W - pad.left - pad.right;
        const chartH = H - pad.top - pad.bottom;

        ctx.clearRect(0, 0, W, H);

        // Grid + Y labels
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = pad.top + (chartH / 4) * i;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(pad.left + chartW, y);
            ctx.stroke();
            const val = max - (max / 4) * i;
            ctx.fillStyle = "#4b5563";
            ctx.font = "10px Inter, sans-serif";
            ctx.textAlign = "right";
            ctx.fillText(`${val.toFixed(0)}%`, pad.left - 6, y + 4);
        }

        // X labels
        ctx.fillStyle = "#374151";
        ctx.font = "9px Inter, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("T1", pad.left, pad.top + chartH + 18);
        ctx.textAlign = "right";
        ctx.fillText(`T${data.length}`, pad.left + chartW, pad.top + chartH + 18);

        const xStep = chartW / (processedData.length - 1);
        const toX = (i: number) => pad.left + i * xStep;
        const toY = (v: number) => pad.top + (v / max) * chartH;

        // Red gradient fill
        const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
        grad.addColorStop(0, "rgba(239,68,68,0.45)");
        grad.addColorStop(1, "rgba(239,68,68,0.05)");

        ctx.beginPath();
        ctx.moveTo(toX(0), pad.top);
        for (let i = 0; i < processedData.length; i++) ctx.lineTo(toX(i), toY(processedData[i]));
        ctx.lineTo(toX(processedData.length - 1), pad.top);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // Red line
        ctx.beginPath();
        ctx.moveTo(toX(0), toY(processedData[0]));
        for (let i = 1; i < processedData.length; i++) ctx.lineTo(toX(i), toY(processedData[i]));
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 1.5;
        ctx.lineJoin = "round";
        ctx.stroke();
    }, [processedData, data.length]);

    return (
        <div className="w-full">
            <p className="text-xs font-medium mb-2" style={{ color: "#6b7280" }}>Curva de Drawdown (%)</p>
            <canvas ref={canvasRef} style={{ width: "100%", height: "140px", display: "block" }} />
        </div>
    );
}
