"use client";

import { useEffect, useRef } from "react";

interface Props {
    simulations: number[][];
    averageCaseReturn: number;
}

export default function MonteCarloChart({ simulations, averageCaseReturn }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || simulations.length === 0) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const W = canvas.offsetWidth;
        const H = canvas.offsetHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);

        const pad = { top: 20, right: 16, bottom: 30, left: 60 };
        const chartW = W - pad.left - pad.right;
        const chartH = H - pad.top - pad.bottom;

        // Find global Min and Max across all simulated curves to scale properly
        let min = Infinity;
        let max = -Infinity;
        for (const curve of simulations) {
            for (const val of curve) {
                if (val < min) min = val;
                if (val > max) max = val;
            }
        }

        // Prevent flat chart if min == max
        const range = max - min || 1;

        // Clear background
        ctx.fillStyle = "#0a0a0f"; // neutral-950 roughly
        ctx.fillRect(0, 0, W, H);

        const points = simulations[0].length;
        const xStep = chartW / (points - 1);
        const toX = (i: number) => pad.left + i * xStep;
        const toY = (v: number) => pad.top + chartH - ((v - min) / range) * chartH;

        // Grid lines
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = pad.top + (chartH / 4) * i;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(pad.left + chartW, y);
            ctx.stroke();

            const val = max - (range / 4) * i;
            ctx.fillStyle = "#4b5563";
            ctx.font = "10px Inter, sans-serif";
            ctx.textAlign = "right";
            ctx.fillText(`$${val.toFixed(0)}`, pad.left - 8, y + 4);
        }

        // Draw the 100 paths with low opacity
        // Using requestAnimationFrame to unblock if needed, but for 100 lines it's instant
        requestAnimationFrame(() => {
            ctx.lineWidth = 1;
            ctx.strokeStyle = "rgba(99,102,241,0.2)"; // indigo-500 low opacity

            for (const curve of simulations) {
                ctx.beginPath();
                ctx.moveTo(toX(0), toY(curve[0]));
                for (let i = 1; i < curve.length; i++) {
                    ctx.lineTo(toX(i), toY(curve[i]));
                }
                ctx.stroke();
            }

            // Draw average line
            // Average line goes from initialBalance to initialBalance + averageCaseReturn
            const initialBalance = simulations[0][0];
            const finalAverage = initialBalance + averageCaseReturn;

            ctx.strokeStyle = "#818cf8"; // indigo-400
            ctx.lineWidth = 3;
            // shadow for highlight
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#818cf8";

            ctx.beginPath();
            ctx.moveTo(toX(0), toY(initialBalance));
            ctx.lineTo(toX(points - 1), toY(finalAverage));
            ctx.stroke();

            // reset shadow
            ctx.shadowBlur = 0;

            // X Labels
            ctx.fillStyle = "#374151";
            ctx.font = "9px Inter, sans-serif";
            ctx.textAlign = "left";
            ctx.fillText("Inicial", pad.left, pad.top + chartH + 18);
            ctx.textAlign = "right";
            ctx.fillText(`Operación ${points}`, pad.left + chartW, pad.top + chartH + 18);
        });

    }, [simulations, averageCaseReturn]);

    return (
        <div className="w-full">
            <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "300px", display: "block", borderRadius: "8px" }}
            />
        </div>
    );
}
