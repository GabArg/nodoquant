"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/auth/client";

export default function CreateProject({ onSuccess }: { onSuccess?: () => void }) {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user?.id) {
            setError("Debes iniciar sesión.");
            setLoading(false);
            return;
        }

        const { error: insertError } = await supabase
            .from("projects")
            .insert({ name, user_id: session.user.id });

        if (insertError) {
            setError(insertError.message);
        } else {
            setName("");
            if (onSuccess) onSuccess();
            router.refresh();
        }
        setLoading(false);
    }

    return (
        <form onSubmit={handleSubmit} className="card rounded-2xl p-5 border border-white/5 bg-[#111118]">
            <h3 className="text-sm font-medium text-white mb-3">Nuevo Proyecto</h3>
            <div className="flex gap-3">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Estrategias VIX H1"
                    className="form-input flex-1 bg-black/40"
                    required
                />
                <button type="submit" disabled={loading} className="btn-primary py-2">
                    {loading ? "Creando..." : "Crear"}
                </button>
            </div>
            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        </form>
    );
}
