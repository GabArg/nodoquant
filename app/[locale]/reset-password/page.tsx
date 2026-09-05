"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/auth/client";

export default function ResetPasswordPage() {
    const locale = useLocale();
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] =
        useState("");
    const [showPassword, setShowPassword] =
        useState(false);
    const [error, setError] = useState<string | null>(
        null
    );
    const [loading, setLoading] = useState(false);
    const [checkingSession, setCheckingSession] =
        useState(true);
    const [hasSession, setHasSession] =
        useState(false);

    const copy =
        locale === "es"
            ? {
                  title: "Crear nueva contraseña",
                  subtitle:
                      "Elegí una contraseña nueva para tu cuenta de NodoQuant.",
                  passwordLabel: "Nueva contraseña",
                  confirmLabel: "Confirmar contraseña",
                  passwordPlaceholder:
                      "Mínimo 6 caracteres",
                  mismatch:
                      "Las contraseñas no coinciden.",
                  noSession:
                      "El enlace de recuperación no es válido o expiró. Solicitá uno nuevo.",
                  submit: "Guardar nueva contraseña",
                  loading: "Guardando...",
                  success:
                      "Contraseña actualizada correctamente.",
                  requestAgain:
                      "Solicitar otro enlace",
                  back: "Volver a ingresar",
              }
            : {
                  title: "Create new password",
                  subtitle:
                      "Choose a new password for your NodoQuant account.",
                  passwordLabel: "New password",
                  confirmLabel: "Confirm password",
                  passwordPlaceholder:
                      "At least 6 characters",
                  mismatch:
                      "Passwords do not match.",
                  noSession:
                      "This recovery link is invalid or has expired. Request a new one.",
                  submit: "Save new password",
                  loading: "Saving...",
                  success:
                      "Password updated successfully.",
                  requestAgain:
                      "Request another link",
                  back: "Back to login",
              };

    useEffect(() => {
        const supabase = createClient();

        async function checkSession() {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            setHasSession(Boolean(session));
            setCheckingSession(false);
        }

        void checkSession();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (password.length < 6) {
            setError(copy.passwordPlaceholder);
            return;
        }

        if (password !== confirmPassword) {
            setError(copy.mismatch);
            return;
        }

        setLoading(true);

        try {
            const supabase = createClient();

            const { error } =
                await supabase.auth.updateUser({
                    password,
                });

            if (error) {
                setError(error.message);
                return;
            }

            await supabase.auth.signOut();

            router.push(
                `/${locale}/login?password_reset=success`
            );
            router.refresh();
        } catch (err: unknown) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to update password."
            );
        } finally {
            setLoading(false);
        }
    }

    if (checkingSession) {
        return (
            <div className="min-h-screen pt-28 pb-12 flex items-center justify-center bg-[#0a0a0f] text-white">
                <p className="text-sm text-gray-400">
                    ...
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-28 pb-12 flex flex-col items-center justify-center bg-[#0a0a0f] text-white">
            <div className="w-full max-w-sm px-4">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold mb-2">
                        {copy.title}
                    </h1>
                    <p className="text-gray-400 text-sm">
                        {copy.subtitle}
                    </p>
                </div>

                <div className="card rounded-2xl p-6 sm:p-8 border border-white/5 bg-[#111118]">
                    {!hasSession ? (
                        <div className="space-y-5">
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm leading-relaxed">
                                {copy.noSession}
                            </div>

                            <Link
                                href={`/${locale}/forgot-password`}
                                className="btn-primary w-full justify-center"
                            >
                                {copy.requestAgain}
                            </Link>

                            <div className="text-center">
                                <Link
                                    href={`/${locale}/login`}
                                    className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                                >
                                    {copy.back}
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-4"
                        >
                            <div>
                                <label
                                    className="form-label"
                                    htmlFor="password"
                                >
                                    {copy.passwordLabel}
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(
                                                e.target
                                                    .value
                                            )
                                        }
                                        className="form-input pr-10"
                                        placeholder={
                                            copy.passwordPlaceholder
                                        }
                                        autoComplete="new-password"
                                        minLength={6}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(
                                                !showPassword
                                            )
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors z-10 p-1"
                                        aria-label={
                                            showPassword
                                                ? "Hide password"
                                                : "Show password"
                                        }
                                    >
                                        {showPassword
                                            ? "○"
                                            : "◉"}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label
                                    className="form-label"
                                    htmlFor="confirm-password"
                                >
                                    {copy.confirmLabel}
                                </label>
                                <input
                                    id="confirm-password"
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(
                                            e.target.value
                                        )
                                    }
                                    className="form-input"
                                    placeholder={
                                        copy.passwordPlaceholder
                                    }
                                    autoComplete="new-password"
                                    minLength={6}
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
                                {loading
                                    ? copy.loading
                                    : copy.submit}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
