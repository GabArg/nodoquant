"use client";

import { useState, useEffect } from "react";

export interface Strategy {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
}

interface Props {
    onSelect: (strategyId: string, datasetName: string) => void;
    onBack: () => void;
}

export default function StrategySelector({ onSelect, onBack }: Props) {
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState("");
    const [datasetName, setDatasetName] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStrategies();
    }, []);

    async function fetchStrategies() {
        setLoading(true);
        try {
            const res = await fetch("/api/strategies");
            const data = await res.json();
            if (data.ok) {
                setStrategies(data.strategies ?? []);
                if (data.strategies?.length > 0) {
                    setSelectedId(data.strategies[0].id);
                }
            }
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate() {
        if (!newName.trim()) {
            setError("El nombre es obligatorio.");
            return;
        }
        setCreating(true);
        setError(null);
        try {
            const payload = { 
                name: newName.trim(), 
                description: newDesc.trim() || null 
            };
            console.log("[StrategySelector] Creating strategy with payload:", payload);

            const res = await fetch("/api/strategies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            console.log("[StrategySelector] API response:", data);

            if (!data.ok) {
                setError(data.error ?? "Error al crear la estrategia.");
                return;
            }
            // Success! Append to list and select it
            setStrategies((prev) => [data.strategy, ...prev]);
            setSelectedId(data.strategy.id);
            setShowCreate(false);
            setNewName("");
            setNewDesc("");
        } catch (err) {
            console.error("[StrategySelector] Fetch error:", err);
            setError("Error de red.");
        } finally {
            setCreating(false);
        }
    }

    function handleContinue() {
        if (!selectedId) {
            setError("Seleccioná una estrategia.");
            return;
        }
        if (!datasetName.trim()) {
            setError("Ingresá un nombre para el dataset.");
            return;
        }
        setError(null);
        onSelect(selectedId, datasetName.trim());
    }

    return (
        <div className="w-full max-w-xl mx-auto animate-fade-in">
            <div className="card rounded-2xl p-6 space-y-5">
                <div>
                    <div className="section-label">Organizar análisis</div>
                    <h2 className="text-xl font-bold text-white mb-1">Seleccioná tu estrategia</h2>
                    <p className="text-sm" style={{ color: "#6b7280" }}>
                        Agrupá tus análisis por estrategia para compararlos después.
                    </p>
                </div>

                {/* Strategy dropdown */}
                <div>
                    <label className="form-label" htmlFor="strategy-select">Estrategia</label>
                    {loading ? (
                        <div className="text-sm text-gray-500">Cargando estrategias...</div>
                    ) : (
                        <div className="flex gap-2">
                            <select
                                id="strategy-select"
                                className="form-input flex-1"
                                value={selectedId}
                                onChange={(e) => {
                                    if (e.target.value === "__new__") {
                                        setShowCreate(true);
                                    } else {
                                        setSelectedId(e.target.value);
                                        setShowCreate(false);
                                    }
                                }}
                            >
                                {strategies.length === 0 && (
                                    <option value="" disabled>No hay estrategias</option>
                                )}
                                {strategies.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                                <option value="__new__">+ Crear nueva estrategia</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Create new strategy inline form */}
                {showCreate && (
                    <div
                        className="rounded-xl p-4 space-y-3"
                        style={{
                            background: "rgba(99,102,241,0.06)",
                            border: "1px solid rgba(99,102,241,0.2)",
                        }}
                    >
                        <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">
                            Nueva estrategia
                        </p>
                        <div>
                            <label className="form-label" htmlFor="new-strategy-name">Nombre</label>
                            <input
                                id="new-strategy-name"
                                type="text"
                                className="form-input"
                                placeholder="Ej: Scalping EUR/USD"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                disabled={creating}
                            />
                        </div>
                        <div>
                            <label className="form-label" htmlFor="new-strategy-desc">Descripción (opcional)</label>
                            <input
                                id="new-strategy-desc"
                                type="text"
                                className="form-input"
                                placeholder="Breve descripción de la estrategia"
                                value={newDesc}
                                onChange={(e) => setNewDesc(e.target.value)}
                                disabled={creating}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                className="btn-primary text-sm"
                                onClick={handleCreate}
                                disabled={creating}
                            >
                                {creating ? "Creando..." : "Crear"}
                            </button>
                            <button
                                className="text-sm"
                                style={{ color: "#6b7280", background: "none", border: "none", cursor: "pointer" }}
                                onClick={() => {
                                    setShowCreate(false);
                                    if (strategies.length > 0) setSelectedId(strategies[0].id);
                                }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                {/* Dataset name */}
                <div>
                    <label className="form-label" htmlFor="dataset-name">
                        Nombre del dataset
                    </label>
                    <input
                        id="dataset-name"
                        type="text"
                        className="form-input"
                        placeholder="Ej: Backtest 2023, Forward Test, Live trades"
                        value={datasetName}
                        onChange={(e) => setDatasetName(e.target.value)}
                    />
                </div>

                {error && (
                    <div className="p-3 rounded-lg text-sm bg-red-500/10 border border-red-500/20 text-red-400">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <button className="btn-primary flex-1 justify-center" onClick={handleContinue}>
                        Continuar al análisis
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
                <div className="text-center">
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
                </div>
            </div>
        </div>
    );
}
