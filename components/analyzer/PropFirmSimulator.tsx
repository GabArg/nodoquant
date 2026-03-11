"use client";

import { useState } from "react";
import type { Trade } from "@/lib/analyzer/parser";
import { calcPropFirmChallenge, type PropFirmParams } from "@/lib/analyzer/metrics";

interface Props {
    trades: Trade[];
}

type Mode = "personal" | "challenge" | "funded";

const MODES: { id: Mode; label: string; icon: string; desc: string }[] = [
    {
        id: "personal",
        label: "Cuenta personal",
        icon: "👤",
        desc: "Analizá el riesgo de tu cuenta propia sin restricciones externas.",
    },
    {
        id: "challenge",
        label: "Prop Firm Challenge",
        icon: "🎯",
        desc: "Simulá la probabilidad de pasar un desafío de prop firm.",
    },
    {
        id: "funded",
        label: "Cuenta financiada",
        icon: "💼",
        desc: "Evaluá tu estrategia bajo las reglas de una cuenta financiada.",
    },
];

export default function PropFirmSimulator({ trades }: Props) {
    const [mode, setMode] = useState<Mode | null>(null);
    const [params, setParams] = useState<PropFirmParams>({
        balance: 10000,
        targetPct: 10,
        dailyDrawdownPct: 5,
        maxDrawdownPct: 10,
    });
    const [result, setResult] = useState<ReturnType<typeof calcPropFirmChallenge> | null>(null);
    const [running, setRunning] = useState(false);

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
                <div className="section-label">Simulación de escenario</div>
                <h2 className="text-xl font-bold text-white mb-1">
                    ¿Cómo querés evaluar tu estrategia?
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
                        En cuenta personal, los límites los ponés vos. Las métricas clave son el Profit Factor,
                        la racha perdedora y el riesgo recomendado por operación que ya se calcularon en el informe completo.
                    </p>
                </div>
            )}

            {/* Challenge / Funded form */}
            {(mode === "challenge" || mode === "funded") && (
                <div className="card rounded-xl p-5 space-y-4">
                    <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-1">
                        Parámetros
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label" htmlFor="sim-balance">Balance inicial (USD)</label>
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
                            <label className="form-label" htmlFor="sim-target">Objetivo de ganancia (%)</label>
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
                            <label className="form-label" htmlFor="sim-daily">Daily drawdown máx. (%)</label>
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
                            <label className="form-label" htmlFor="sim-maxdd">Max drawdown total (%)</label>
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
                                Simulando 2.000 iteraciones...
                            </>
                        ) : (
                            "Ejecutar simulación"
                        )}
                    </button>
                </div>
            )}

            {/* Results */}
            {result && (
                <div className="card rounded-xl p-5 space-y-1 animate-fade-in">
                    <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">
                        Resultados de simulación
                    </p>

                    {[
                        {
                            label: "Probabilidad de aprobar",
                            value: `${result.passProb.toFixed(1)}%`,
                            good: result.passProb > 50,
                        },
                        {
                            label: "Probabilidad de fallar por Daily DD",
                            value: `${result.failDailyDDProb.toFixed(1)}%`,
                            good: result.failDailyDDProb < 20,
                        },
                        {
                            label: "Probabilidad de fallar por Max DD",
                            value: `${result.failMaxDDProb.toFixed(1)}%`,
                            good: result.failMaxDDProb < 20,
                        },
                        {
                            label: "Trades necesarios (promedio)",
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

                    <p className="text-xs mt-3 pt-2" style={{ color: "#374151" }}>
                        Simulación basada en {trades.length} trades históricos con 2.000 iteraciones de Monte Carlo.
                        No garantiza resultados futuros.
                    </p>
                </div>
            )}
        </div>
    );
}
