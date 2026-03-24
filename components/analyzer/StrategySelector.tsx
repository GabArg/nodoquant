"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

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
    const t = useTranslations("analyzer.strategySelector");
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
            setError(t("nameRequired"));
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
                setError(data.error ?? t("createError"));
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
            setError(t("networkError"));
        } finally {
            setCreating(false);
        }
    }

    function handleContinue() {
        if (!selectedId) {
            setError(t("selectStrategyError"));
            return;
        }
        if (!datasetName.trim()) {
            setError(t("datasetNameError"));
            return;
        }
        setError(null);
        onSelect(selectedId, datasetName.trim());
    }

    return (
        <div className="w-full max-w-xl mx-auto animate-fade-in">
            <div className="card rounded-2xl p-6 space-y-5">
                <div>
                    <div className="section-label">{t("organizeLabel")}</div>
                    <h2 className="text-xl font-bold text-white mb-1">{t("title")}</h2>
                    <p className="text-sm" style={{ color: "#6b7280" }}>
                        {t("subtitle")}
                    </p>
                </div>

                {/* Strategy dropdown */}
                <div>
                    <label className="form-label" htmlFor="strategy-select">{t("strategyLabel")}</label>
                    {loading ? (
                        <div className="text-sm text-gray-500">{t("loadingStrategies")}</div>
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
                                    <option value="" disabled>{t("noStrategies")}</option>
                                )}
                                {strategies.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                                <option value="__new__">{t("createNew")}</option>
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
                            {t("newStrategy")}
                        </p>
                        <div>
                            <label className="form-label" htmlFor="new-strategy-name">{t("nameLabel")}</label>
                            <input
                                id="new-strategy-name"
                                type="text"
                                className="form-input"
                                placeholder={t("namePlaceholder")}
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                disabled={creating}
                            />
                        </div>
                        <div>
                            <label className="form-label" htmlFor="new-strategy-desc">{t("descLabel")}</label>
                            <input
                                id="new-strategy-desc"
                                type="text"
                                className="form-input"
                                placeholder={t("descPlaceholder")}
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
                                {creating ? t("creating") : t("create")}
                            </button>
                            <button
                                className="text-sm"
                                style={{ color: "#6b7280", background: "none", border: "none", cursor: "pointer" }}
                                onClick={() => {
                                    setShowCreate(false);
                                    if (strategies.length > 0) setSelectedId(strategies[0].id);
                                }}
                            >
                                {t("cancel")}
                            </button>
                        </div>
                    </div>
                )}

                {/* Dataset name */}
                <div>
                    <label className="form-label" htmlFor="dataset-name">
                        {t("datasetNameLabel")}
                    </label>
                    <input
                        id="dataset-name"
                        type="text"
                        className="form-input"
                        placeholder={t("datasetPlaceholder")}
                        value={datasetName}
                        onChange={(e) => setDatasetName(e.target.value)}
                    />
                </div>

                {error && (
                    <div className="p-3 rounded-lg text-sm bg-red-500/10 border border-red-500/20 text-red-400">
                        <strong>{t("errorPrefix")}:</strong> {error}
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <button className="btn-primary flex-1 justify-center" onClick={handleContinue}>
                        {t("continueBtn")}
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
