"use client";

import { useEffect, useRef, useState } from "react";
import { SAMPLE_STRATEGIES, type SampleStrategy } from "@/lib/sampleDatasets";
import { useTranslations } from "next-intl";

interface Props {
    onTryWithData: () => void;
}

function MiniEquityChart({ data, color }: { data: number[]; color: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || data.length < 2) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const W = canvas.offsetWidth;
        const H = canvas.offsetHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);

        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        const pad = { top: 16, right: 12, bottom: 24, left: 48 };
        const chartW = W - pad.left - pad.right;
        const chartH = H - pad.top - pad.bottom;

        ctx.clearRect(0, 0, W, H);

        // Grid lines
        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.lineWidth = 1;
        for (let i = 0; i <= 3; i++) {
            const y = pad.top + (chartH / 3) * i;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(pad.left + chartW, y);
            ctx.stroke();
            const val = max - (range / 3) * i;
            ctx.fillStyle = "#374151";
            ctx.font = "9px Inter, sans-serif";
            ctx.textAlign = "right";
            ctx.fillText(`${val.toFixed(0)}`, pad.left - 5, y + 4);
        }

        const xStep = chartW / (data.length - 1);
        const toX = (i: number) => pad.left + i * xStep;
        const toY = (v: number) => pad.top + chartH - ((v - min) / range) * chartH;

        // Parse color to rgba
        const hex = color.replace("#", "");
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
        grad.addColorStop(0, `rgba(${r},${g},${b},0.22)`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);

        ctx.beginPath();
        ctx.moveTo(toX(0), toY(data[0]));
        for (let i = 1; i < data.length; i++) ctx.lineTo(toX(i), toY(data[i]));
        ctx.lineTo(toX(data.length - 1), pad.top + chartH);
        ctx.lineTo(toX(0), pad.top + chartH);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.moveTo(toX(0), toY(data[0]));
        for (let i = 1; i < data.length; i++) ctx.lineTo(toX(i), toY(data[i]));
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineJoin = "round";
        ctx.stroke();
        ctx.shadowBlur = 0;
    }, [data, color]);

    return (
        <canvas ref={canvasRef} style={{ width: "100%", height: "140px", display: "block" }} />
    );
}

function ScoreRing({ score, color }: { score: number; color: string }) {
    const t = useTranslations("analyzer.preview");
    return (
        <div className="flex flex-col items-center">
            <div className="text-3xl font-black tabular-nums" style={{ color }}>{score}</div>
            <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#6b7280" }}>{t("score")}</div>
        </div>
    );
}

function StrategyTab({ strategy, active, onClick }: { strategy: SampleStrategy; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
                background: active ? `${strategy.color}18` : "rgba(255,255,255,0.02)",
                color: active ? strategy.color : "#6b7280",
                border: `1px solid ${active ? `${strategy.color}35` : "rgba(255,255,255,0.06)"}`,
            }}
        >
            {strategy.badge}
        </button>
    );
}

export default function ExamplePreview({ onTryWithData }: Props) {
    const t = useTranslations("analyzer.preview");
    const [activeId, setActiveId] = useState(SAMPLE_STRATEGIES[0].id);
    const strategy = SAMPLE_STRATEGIES.find((s) => s.id === activeId) ?? SAMPLE_STRATEGIES[0];
    const { metrics, equityCurve, color, name, description } = strategy;

    return (
        <div className="w-full max-w-2xl mx-auto mb-8">
            <div className="rounded-2xl overflow-hidden"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>

                {/* Header with tabs */}
                <div className="px-5 pt-5 pb-3 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <span className="badge badge-soon text-xs">{t("demo")}</span>
                        <p className="text-sm font-medium text-white">{t("strategyExamples")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {SAMPLE_STRATEGIES.map((s) => (
                            <StrategyTab
                                key={s.id}
                                strategy={s}
                                active={activeId === s.id}
                                onClick={() => setActiveId(s.id)}
                            />
                        ))}
                    </div>
                </div>

                {/* Strategy name + score + description */}
                <div className="px-5 pb-3 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-white mb-0.5">{name}</h3>
                        <p className="text-xs leading-relaxed" style={{ color: "#9ca3af" }}>{description}</p>
                    </div>
                    <div className="shrink-0">
                        <ScoreRing score={strategy.strategyScore} color={color} />
                    </div>
                </div>

                {/* Metrics row */}
                <div className="grid grid-cols-4 gap-0 mx-5 mb-4 rounded-xl overflow-hidden"
                    style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                    {[
                        { label: t("winrate"), value: `${metrics.winrate}%` },
                        { label: t("profitFactor"), value: metrics.profitFactor.toFixed(2) },
                        { label: t("maxDrawdown"), value: `${metrics.maxDrawdown}%` },
                        { label: t("expectancy"), value: `+${metrics.expectancy.toFixed(2)}R` },
                    ].map((m) => (
                        <div key={m.label}
                            className="px-3 py-3 text-center"
                            style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}>
                            <p className="text-xs mb-1" style={{ color: "#4b5563" }}>{m.label}</p>
                            <p className="text-sm font-bold text-white">{m.value}</p>
                        </div>
                    ))}
                </div>

                {/* Equity Curve */}
                <div className="px-5 pb-4">
                    <MiniEquityChart data={equityCurve} color={color} />
                </div>

                {/* CTA */}
                <div className="px-5 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <p className="text-xs mb-3" style={{ color: "#6b7280" }}>
                        {t("uploadPrompt")}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {[t("winrate"), t("profitFactor"), t("maxDrawdown"), t("monteCarlo"), t("simPropFirm")].map((f) => (
                            <span key={f} className="text-xs px-2.5 py-1 rounded-full"
                                style={{
                                    background: "rgba(99,102,241,0.08)",
                                    border: "1px solid rgba(99,102,241,0.15)",
                                    color: "#a5b4fc",
                                }}>
                                {f}
                            </span>
                        ))}
                    </div>
                    <button onClick={onTryWithData} className="btn-primary w-full justify-center">
                        {t("tryOwnData")}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
