"use client";

import { type OverfitResult } from "@/lib/overfittingRisk";

interface Props {
    result: OverfitResult;
}

export default function OverfittingRiskCard({ result }: Props) {
    const { riskLevel, color, triggeredRules } = result;

    return (
        <div
            className="rounded-xl px-4 py-3"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
            <div className="flex items-center gap-3 mb-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className="flex-shrink-0">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <h2 className="text-xs text-gray-500 uppercase tracking-widest font-semibold flex-1">Overfitting Risk Analysis</h2>
                <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{
                        background: `${color}15`,
                        color,
                        border: `1px solid ${color}30`,
                    }}
                >
                    {riskLevel}
                </span>
            </div>
            {triggeredRules.length > 0 && (
                <div className="mt-2 flex flex-col gap-0.5">
                    {triggeredRules.map((rule, i) => (
                        <p key={i} className="text-xs" style={{ color: "#9ca3af" }}>
                            • {rule}
                        </p>
                    ))}
                </div>
            )}
            <p className="text-[10px] text-gray-600 mt-2">
                Overfitting detection identifies whether a trading strategy may be curve-fit to historical data instead of showing genuine predictive power.
            </p>
        </div>
    );
}
