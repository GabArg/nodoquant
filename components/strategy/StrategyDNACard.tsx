"use client";

import { type DNAProfile } from "@/lib/strategyDNA";

interface Props {
    dna: DNAProfile;
}

const rows: { key: keyof DNAProfile; label: string }[] = [
    { key: "riskProfile", label: "Risk Profile" },
    { key: "tradeDuration", label: "Trade Duration" },
    { key: "winDistribution", label: "Win Distribution" },
    { key: "profitConcentration", label: "Profit Concentration" },
    { key: "streakBehavior", label: "Streak Behavior" },
    { key: "volatility", label: "Volatility" },
    { key: "tradeFrequency", label: "Trade Frequency" },
];

export default function StrategyDNACard({ dna }: Props) {
    return (
        <div className="card rounded-2xl border border-white/5 bg-[#111118] p-5 mb-8">
            <div className="mb-4">
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Strategy DNA</p>
                <p className="text-xs text-gray-600 mt-0.5">Behavioral fingerprint — style, not quality.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rows.map(({ key, label }) => {
                    const item = dna[key];
                    return (
                        <div
                            key={key}
                            className="flex items-center justify-between rounded-xl px-4 py-3"
                            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                            title={item.tooltip}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400">{label}</span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" className="opacity-50 cursor-help">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="16" x2="12" y2="12" />
                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                            </div>
                            <span
                                className="text-xs font-bold px-2.5 py-1 rounded-full"
                                style={{
                                    background: `${item.color}15`,
                                    color: item.color,
                                    border: `1px solid ${item.color}30`,
                                }}
                            >
                                {item.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
