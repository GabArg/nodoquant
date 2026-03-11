"use client";

import { useState, useEffect } from "react";

const MARKETS = ["Forex", "Crypto", "Indices", "Stocks", "Futures"];
const TIMEFRAMES = ["M1", "M5", "M15", "H1", "H4", "D1"];
const STYLES = ["Scalping", "Swing", "Trend Following", "Mean Reversion", "Breakout", "Arbitrage"];

interface Props {
    strategyId: string;
    onContinue: () => void;
    onBack: () => void;
}

export default function StrategyContextForm({ strategyId, onContinue, onBack }: Props) {
    const [market, setMarket] = useState("");
    const [asset, setAsset] = useState("");
    const [timeframe, setTimeframe] = useState("");
    const [style, setStyle] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStrategy() {
            try {
                const res = await fetch(`/api/strategies/${strategyId}`);
                const data = await res.json();
                if (data.ok && data.strategy) {
                    setMarket(data.strategy.market || "");
                    setAsset(data.strategy.asset || "");
                    setTimeframe(data.strategy.timeframe || "");
                    setStyle(data.strategy.strategy_style || "");
                }
            } catch {
                // silent
            } finally {
                setLoading(false);
            }
        }
        fetchStrategy();
    }, [strategyId]);

    async function handleSave() {
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`/api/strategies/${strategyId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    market: market || null,
                    asset: asset.trim() || null,
                    timeframe: timeframe || null,
                    strategy_style: style || null,
                })
            });
            const data = await res.json();
            if (!data.ok) {
                setError(data.error ?? "Error al guardar el contexto.");
                setSaving(false);
                return;
            }
            onContinue();
        } catch (err) {
            setError("Error de red.");
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="w-full max-w-xl mx-auto animate-fade-in text-center text-gray-400 py-10">
                Cargando contexto de la estrategia...
            </div>
        );
    }

    return (
        <div className="w-full max-w-xl mx-auto animate-fade-in">
            <div className="card rounded-2xl p-6 space-y-5">
                <div>
                    <div className="section-label">Contexto de la Estrategia</div>
                    <h2 className="text-xl font-bold text-white mb-1">Mejorá tu análisis</h2>
                    <p className="text-sm" style={{ color: "#6b7280" }}>
                        Definí el mercado y estilo de trading. Esto te ayudará a comparar estrategias de forma más precisa. Puedes saltar este paso.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Market */}
                    <div>
                        <label className="form-label" htmlFor="market-select">Mercado</label>
                        <select
                            id="market-select"
                            className="form-input w-full"
                            value={market}
                            onChange={(e) => setMarket(e.target.value)}
                        >
                            <option value="">Seleccionar...</option>
                            {MARKETS.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>

                    {/* Asset */}
                    <div>
                        <label className="form-label" htmlFor="asset-input">Activo</label>
                        <input
                            id="asset-input"
                            type="text"
                            className="form-input w-full"
                            placeholder="Ej: EURUSD, BTCUSDT"
                            value={asset}
                            onChange={(e) => setAsset(e.target.value)}
                        />
                    </div>

                    {/* Timeframe */}
                    <div>
                        <label className="form-label" htmlFor="tf-select">Timeframe base</label>
                        <select
                            id="tf-select"
                            className="form-input w-full"
                            value={timeframe}
                            onChange={(e) => setTimeframe(e.target.value)}
                        >
                            <option value="">Seleccionar...</option>
                            {TIMEFRAMES.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    {/* Strategy Style */}
                    <div>
                        <label className="form-label" htmlFor="style-select">Estilo de Trading</label>
                        <select
                            id="style-select"
                            className="form-input w-full"
                            value={style}
                            onChange={(e) => setStyle(e.target.value)}
                        >
                            <option value="">Seleccionar...</option>
                            {STYLES.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {error && <p className="text-xs text-red-400">{error}</p>}

                <div className="flex gap-3 pt-2">
                    <button className="btn-primary flex-1 justify-center" onClick={handleSave} disabled={saving}>
                        {saving ? "Guardando..." : "Guardar y continuar"}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-1">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                <div className="flex justify-between items-center px-2">
                    <button
                        onClick={onBack}
                        style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#4b5563",
                            fontSize: "0.85rem",
                        }}
                    >
                        ← Volver
                    </button>
                    <button
                        onClick={onContinue}
                        style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#6b7280",
                            fontSize: "0.85rem",
                        }}
                    >
                        Saltar este paso →
                    </button>
                </div>
            </div>
        </div>
    );
}
