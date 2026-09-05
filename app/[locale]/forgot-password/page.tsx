"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/auth/client";
import { getBaseUrl } from "@/lib/url";

export default function ForgotPasswordPage() {
    const locale = useLocale();
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const copy =
        locale === "es"
            ? {
                  title: "Recuperar contraseña",
                  subtitle:
                      "Ingresá tu correo y te enviaremos un enlace para crear una nueva contraseña.",
                  emailLabel: "Correo electrónico",
                  emailPlaceholder: "tu@email.com",
                  submit: "Enviar enlace de recuperación",
                  loading: "Enviando...",
                  sentTitle: "Revisá tu correo",
                  sentText:
                      "Si existe una cuenta asociada a ese correo, recibirás un enlace para restablecer tu contraseña.",
                  back: "Volver a ingresar",
              }
            : {
                  title: "Reset password",
                  subtitle:
                      "Enter your email and we will send you a link to create a new password.",
                  emailLabel: "Email address",
                  emailPlaceholder: "you@example.com",
                  submit: "Send recovery link",
                  loading: "Sending...",
                  sentTitle: "Check your email",
                  sentText:
                      "If an account exists for that email, you will receive a link to reset your password.",
                  back: "Back to login",
              };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const supabase = createClient();
            const baseUrl = getBaseUrl();

            const { error } =
                await supabase.auth.resetPasswordForEmail(
                    email.trim(),
                    {
                        redirectTo: `${baseUrl}/api/auth/callback?next=/${locale}/reset-password&locale=${locale}`,
                    }
                );

            if (error) {
                setError(error.message);
                return;
            }

            setSent(true);
        } catch (err: unknown) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to send recovery email."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen pt-28 pb-12 flex flex-col items-center justify-center bg-[#0a0a0f] text-white">
            <div className="w-full max-w-sm px-4">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold mb-2">
                        {sent ? copy.sentTitle : copy.title}
                    </h1>
                    <p className="text-gray-400 text-sm">
                        {sent
                            ? copy.sentText
                            : copy.subtitle}
                    </p>
                </div>

                <div className="card rounded-2xl p-6 sm:p-8 border border-white/5 bg-[#111118]">
                    {sent ? (
                        <div className="space-y-5">
                            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 text-sm leading-relaxed">
                                {copy.sentText}
                            </div>

                            <Link
                                href={`/${locale}/login`}
                                className="btn-primary w-full justify-center"
                            >
                                {copy.back}
                            </Link>
                        </div>
                    ) : (
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-4"
                        >
                            <div>
                                <label
                                    className="form-label"
                                    htmlFor="email"
                                >
                                    {copy.emailLabel}
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(
                                            e.target.value
                                        )
                                    }
                                    className="form-input"
                                    placeholder={
                                        copy.emailPlaceholder
                                    }
                                    autoComplete="email"
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

                            <div className="text-center pt-2">
                                <Link
                                    href={`/${locale}/login`}
                                    className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                                >
                                    {copy.back}
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
