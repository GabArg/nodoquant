"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/auth/client";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push("/dashboard");
            router.refresh();
        }
    }

    return (
        <div className="min-h-screen pt-28 pb-12 flex flex-col items-center justify-center bg-[#0a0a0f] text-white">
            <div className="w-full max-w-sm px-4">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold mb-2">Iniciá sesión</h1>
                    <p className="text-gray-400 text-sm">Bienvenido de nuevo a NodoQuant.</p>
                </div>

                <div className="card rounded-2xl p-6 sm:p-8 border border-white/5 bg-[#111118]">
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="form-label" htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="form-input"
                                placeholder="tu@email.com"
                                required
                            />
                        </div>
                        <div>
                            <label className="form-label" htmlFor="password">Contraseña</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="form-input"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full mt-2 justify-center"
                        >
                            {loading ? "Entrando..." : "Ingresar a mi cuenta"}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        ¿No tenés cuenta?{" "}
                        <a href="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium">
                            Registrate acá
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
