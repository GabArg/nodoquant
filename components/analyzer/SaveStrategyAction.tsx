"use client";

import { useState, useEffect } from "react";

interface Props {
    analysisId: string | null;
}

export default function SaveStrategyAction({ analysisId }: Props) {
    const [strategyName, setStrategyName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPro, setIsPro] = useState<boolean | null>(null);

    useEffect(() => {
        async function checkPlan() {
            try {
                const res = await fetch("/api/user/plan");
                const data = await res.json();
                setIsPro(data.isPro === true);
            } catch {
                setIsPro(false);
            }
        }
        checkPlan();
    }, []);

    async function handleSave() {
        if (!strategyName.trim()) {
            setError("Ingresá un nombre para la estrategia.");
            return;
        }
        if (!analysisId) return;

        setIsSaving(true);
        setError(null);

        try {
            const res = await fetch("/api/strategies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: strategyName,
                    description: "Guardada desde el Analyzer",
                    analysis_id: analysisId
                })
            });

            const data = await res.json();
            if (!data.ok) throw new Error(data.error ?? "Error al guardar");

            setIsSaved(true);
            setShowForm(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    }

    if (isPro === null) return <div className="animate-pulse h-10 w-full bg-white/5 rounded-lg" />;

    if (!isPro) {
        return (
            <div className="p-4 rounded-xl text-center bg-indigo-500/5 border border-indigo-500/10">
                <p className="text-sm text-gray-400 mb-3">
                    Guardar estrategias está disponible en el plan <span className="text-indigo-400 font-bold">Pro</span>.
                </p>
                <button className="btn-primary py-2 px-4 text-xs">
                    Actualizar a Pro
                </button>
            </div>
        );
    }

    if (isSaved) {
        return (
            <div className="p-4 rounded-xl text-center bg-green-500/10 border border-green-500/20">
                <p className="text-sm font-semibold text-green-400">
                    ¡Estrategia guardada correctamente!
                </p>
                <p className="text-xs text-green-500/70 mt-1">
                    Ya podés verla en tu Dashboard.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {!showForm ? (
                <button
                    onClick={() => setShowForm(true)}
                    className="btn-primary w-full justify-center"
                    style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", color: "#818cf8" }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                    </svg>
                    Guardar esta estrategia
                </button>
            ) : (
                <div className="card p-4 rounded-xl space-y-3 animate-fade-in">
                    <div>
                        <label className="form-label text-xs">Nombre de la estrategia</label>
                        <input
                            type="text"
                            className="form-input text-sm"
                            placeholder="Ej: Scalping Oro H1"
                            value={strategyName}
                            onChange={(e) => setStrategyName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    {error && <p className="text-[10px] text-red-400">{error}</p>}
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="btn-primary flex-1 justify-center text-xs"
                        >
                            {isSaving ? "Guardando..." : "Confirmar"}
                        </button>
                        <button
                            onClick={() => setShowForm(false)}
                            className="px-4 py-2 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-gray-400"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
