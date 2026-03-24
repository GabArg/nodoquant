"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { Trade } from "@/lib/analyzer/parser";
import { calcPropFirmChallenge, type PropFirmParams } from "@/lib/analyzer/metrics";
import ProLockOverlay from "@/components/pricing/ProLockOverlay";
import { trackEvent } from "@/lib/analytics";

interface Props {
    trades: Trade[];
    isPro?: boolean;
}

type Mode = "personal" | "challenge" | "funded";

export default function PropFirmSimulator({ trades, isPro = false }: Props) {
    const t = useTranslations("analyzer.propFirm");
    const locale = useLocale();
    const [mode, setMode] = useState<Mode | null>(null);
    const [params, setParams] = useState<PropFirmParams>({
        balance: 10000,
        targetPct: 10,
        dailyDrawdownPct: 5,
        maxDrawdownPct: 10,
    });
    const [result, setResult] = useState<ReturnType<typeof calcPropFirmChallenge> | null>(null);
    const [running, setRunning] = useState(false);

    const MODES = useMemo(() => [
        {
            id: "personal" as const,
            label: t("modes.personal.label"),
            icon: "👤",
            desc: t("modes.personal.desc"),
        },
        {
            id: "challenge" as const,
            label: t("modes.challenge.label"),
            icon: "🎯",
            desc: t("modes.challenge.desc"),
        },
        {
            id: "funded" as const,
            label: t("modes.funded.label"),
            icon: "💼",
            desc: t("modes.funded.desc"),
        },
    ], [t]);

    function runSim() {
        setRunning(true);
        // Defer to avoid blocking the UI paint
        setTimeout(() => {
            const r = calcPropFirmChallenge(trades, params, 2000);
            setResult(r);
            setRunning(false);
        }, 30);
    }

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            <div>
                <div className="section-label">{t("title")}</div>
                <h2 className="text-xl font-bold text-white mb-1">
                    {t("subtitle")}
                </h2>
            </div>

            {/* Mode selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {MODES.map((m) => (
                    <button
                        key={m.id}
                        onClick={() => { setMode(m.id); setResult(null); }}
                        className="card rounded-xl p-4 text-left transition-all duration-150"
                        style={{
                            borderColor: mode === m.id ? "rgba(99,102,241,0.5)" : undefined,
                            background: mode === m.id ? "rgba(99,102,241,0.08)" : undefined,
                            cursor: "pointer",
                        }}
                    >
                        <span className="text-xl">{m.icon}</span>
                        <p className="text-sm font-semibold text-white mt-2 mb-1">{m.label}</p>
                        <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>{m.desc}</p>
                    </button>
                ))}
            </div>

            {/* Personal mode info */}
            {mode === "personal" && (
                <div className="card rounded-xl p-5">
                    <p className="text-sm" style={{ color: "#9ca3af" }}>
                        {t("modes.personal.info")}
                    </p>
                </div>
            )}

            {/* Challenge / Funded form */}
            {(mode === "challenge" || mode === "funded") && (
                <div className="card rounded-xl p-5 space-y-4">
                    <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-1">
                        {t("params.title")}
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label" htmlFor="sim-balance">{t("params.balance")}</label>
                            <input
                                id="sim-balance"
                                type="number"
                                className="form-input"
                                value={params.balance}
                                min={1000}
                                step={1000}
                                onChange={(e) => setParams((p) => ({ ...p, balance: +e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="form-label" htmlFor="sim-target">{t("params.target")}</label>
                            <input
                                id="sim-target"
                                type="number"
                                className="form-input"
                                value={params.targetPct}
                                min={1}
                                max={30}
                                step={1}
                                onChange={(e) => setParams((p) => ({ ...p, targetPct: +e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="form-label" htmlFor="sim-daily">{t("params.dailyDrawdown")}</label>
                            <input
                                id="sim-daily"
                                type="number"
                                className="form-input"
                                value={params.dailyDrawdownPct}
                                min={1}
                                max={20}
                                step={0.5}
                                onChange={(e) =>
                                    setParams((p) => ({ ...p, dailyDrawdownPct: +e.target.value }))
                                }
                            />
                        </div>
                        <div>
                            <label className="form-label" htmlFor="sim-maxdd">{t("params.maxDrawdown")}</label>
                            <input
                                id="sim-maxdd"
                                type="number"
                                className="form-input"
                                value={params.maxDrawdownPct}
                                min={1}
                                max={30}
                                step={0.5}
                                onChange={(e) =>
                                    setParams((p) => ({ ...p, maxDrawdownPct: +e.target.value }))
                                }
                            />
                        </div>
                    </div>

                    <button
                        onClick={runSim}
                        disabled={running || trades.length === 0}
                        className="btn-primary w-full justify-center"
                    >
                        {running ? (
                            <>
                                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                                </svg>
                                {t("params.running")}
                            </>
                        ) : (
                            t("params.run")
                        )}
                    </button>
                </div>
            )}

            {/* Results with ProLockOverlay */}
            {result && (
                <div className="card rounded-xl p-5 space-y-1 animate-fade-in relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">
                            {t("results.title")}
                        </p>
                        {!isPro && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 uppercase tracking-widest">
                                PRO
                            </span>
                        )}
                    </div>

                    <ProLockOverlay
                        isPro={isPro}
                        title={t("proLocked.title")}
                        description={t("proLocked.desc")}
                    >
                        {[
                            {
                                label: t("results.passProb"),
                                value: `${result.passProb.toFixed(1)}%`,
                                good: result.passProb > 50,
                            },
                            {
                                label: t("results.failDaily"),
                                value: `${result.failDailyDDProb.toFixed(1)}%`,
                                good: result.failDailyDDProb < 20,
                            },
                            {
                                label: t("results.failMax"),
                                value: `${result.failMaxDDProb.toFixed(1)}%`,
                                good: result.failMaxDDProb < 20,
                            },
                            {
                                label: t("results.avgTrades"),
                                value: `${result.expectedTrades}`,
                                good: true,
                            },
                        ].map(({ label, value, good }) => (
                            <div
                                key={label}
                                className="flex justify-between items-center py-3"
                                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                            >
                                <span className="text-sm" style={{ color: "#9ca3af" }}>{label}</span>
                                <span
                                    className="text-sm font-semibold tabular-nums"
                                    style={{ color: good ? "#34d399" : "#f87171" }}
                                >
                                    {value}
                                </span>
                            </div>
                        ))}
                    </ProLockOverlay>

                    <p className="text-xs mt-3 pt-2" style={{ color: "#374151" }}>
                        {t("results.disclaimer", { count: trades.length })}
                    </p>
                </div>
            )}
        </div>
    );
}
