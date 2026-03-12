"use client";

import { useEffect, useRef } from "react";

interface Props {
    data: number[];
    labels: string[];
    title: string;
    type?: "bar" | "line";
    color?: string;
}

export default function MiniBarChart({ data, labels, title, color = "#6366f1" }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || data.length === 0) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const W = canvas.offsetWidth;
        const H = canvas.offsetHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);

        const max = Math.max(...data.map(Math.abs), 1);
        const pad = { top: 20, right: 10, bottom: 20, left: 35 };
        const chartW = W - pad.left - pad.right;
        const chartH = H - pad.top - pad.bottom;

        ctx.clearRect(0, 0, W, H);

        // Grid
        ctx.strokeStyle = "rgba(255,255,255,0.03)";
        ctx.lineWidth = 1;
        for (let i = 0; i <= 3; i++) {
            const y = pad.top + (chartH / 3) * i;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(pad.left + chartW, y);
            ctx.stroke();
            
            const val = max - (max / 3) * i * 2; // bidirectional grid
            ctx.fillStyle = "#374151";
            ctx.font = "8px Inter";
            ctx.textAlign = "right";
            // ctx.fillText(String(val.toFixed(0)), pad.left - 5, y + 3);
        }

        const barW = chartW / data.length;
        const midY = pad.top + chartH / 2;

        data.forEach((val, i) => {
            const h = (val / max) * (chartH / 2);
            const x = pad.left + i * barW;
            const y = midY - (val >= 0 ? h : 0);
            const ah = Math.abs(h) || 1;

            ctx.fillStyle = val >= 0 ? "#34d399" : "#f87171";
            ctx.globalAlpha = 0.8;
            ctx.fillRect(x + 2, y, barW - 4, ah);
            ctx.globalAlpha = 1.0;
            
            // Label
            if (labels[i]) {
                ctx.fillStyle = "#4b5563";
                ctx.font = "8px Inter";
                ctx.textAlign = "center";
                ctx.fillText(labels[i], x + barW / 2, H - 5);
            }
        });
    }, [data, labels]);

    return (
        <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{title}</p>
            <canvas ref={canvasRef} style={{ width: "100%", height: "120px" }} />
        </div>
    );
}
