"use client";

import { useEffect, useState } from "react";

export interface ImportStep {
    id: string;
    label: string;
    sublabel?: string;
}

export const BINANCE_STEPS: ImportStep[] = [
    { id: "fetch", label: "Fetching trades", sublabel: "Connecting to Binance API…" },
    { id: "parse", label: "Parsing data", sublabel: "Reading trade records…" },
    { id: "normalize", label: "Normalizing trades", sublabel: "Converting to standard format…" },
    { id: "generate", label: "Generating report", sublabel: "Running quantitative analysis…" },
];

export const FILE_STEPS: ImportStep[] = [
    { id: "read", label: "Reading file", sublabel: "Loading your data…" },
    { id: "parse", label: "Parsing data", sublabel: "Detecting format and columns…" },
    { id: "normalize", label: "Normalizing trades", sublabel: "Converting to standard format…" },
    { id: "generate", label: "Generating report", sublabel: "Running quantitative analysis…" },
];

type StepStatus = "pending" | "active" | "done";

interface Props {
    steps: ImportStep[];
    /** Index of the currently active step (0-based). Steps before are "done", after are "pending". */
    currentStep: number;
    error?: string | null;
}

function getStatus(stepIdx: number, currentStep: number): StepStatus {
    if (stepIdx < currentStep) return "done";
    if (stepIdx === currentStep) return "active";
    return "pending";
}

export default function ImportProgressIndicator({ steps, currentStep, error }: Props) {
    const [dots, setDots] = useState(".");

    // Animated dots for active step
    useEffect(() => {
        const t = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 500);
        return () => clearInterval(t);
    }, []);

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                {steps.map((step, i) => {
                    const status = getStatus(i, currentStep);
                    return (
                        <div
                            key={step.id}
                            className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300"
                            style={{
                                background: status === "active"
                                    ? "rgba(99,102,241,0.08)"
                                    : status === "done"
                                        ? "rgba(16,185,129,0.04)"
                                        : "rgba(255,255,255,0.01)",
                                border: `1px solid ${status === "active"
                                    ? "rgba(99,102,241,0.25)"
                                    : status === "done"
                                        ? "rgba(16,185,129,0.12)"
                                        : "rgba(255,255,255,0.04)"}`,
                                opacity: status === "pending" ? 0.45 : 1,
                            }}
                        >
                            {/* Icon */}
                            <div
                                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300"
                                style={{
                                    background: status === "done"
                                        ? "rgba(16,185,129,0.15)"
                                        : status === "active"
                                            ? "rgba(99,102,241,0.15)"
                                            : "rgba(255,255,255,0.04)",
                                }}
                            >
                                {status === "done" ? (
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                ) : status === "active" ? (
                                    <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.5">
                                        <path d="M21 12a9 9 0 11-6.219-8.56" />
                                    </svg>
                                ) : (
                                    <span className="text-xs font-bold" style={{ color: "#374151" }}>{i + 1}</span>
                                )}
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                                <p
                                    className="text-sm font-semibold leading-tight"
                                    style={{
                                        color: status === "done"
                                            ? "#6ee7b7"
                                            : status === "active"
                                                ? "#a5b4fc"
                                                : "#4b5563",
                                    }}
                                >
                                    {step.label}
                                    {status === "active" && (
                                        <span style={{ color: "#6366f1" }}>{dots}</span>
                                    )}
                                </p>
                                {status !== "pending" && step.sublabel && (
                                    <p className="text-xs mt-0.5" style={{ color: status === "done" ? "#059669" : "#6366f1" }}>
                                        {status === "done" ? "Complete" : step.sublabel}
                                    </p>
                                )}
                            </div>

                            {status === "done" && (
                                <span className="text-xs font-medium" style={{ color: "#059669" }}>✓</span>
                            )}
                        </div>
                    );
                })}
            </div>

            {error && (
                <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
                    {error}
                </div>
            )}
        </div>
    );
}
