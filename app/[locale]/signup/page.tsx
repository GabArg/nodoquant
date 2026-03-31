"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/auth/client";
import { getBaseUrl } from "@/lib/url";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";

export default function SignupPage() {
    const t = useTranslations("auth.signup");
    const locale = useLocale();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get("redirect");

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const supabase = createClient();
        const baseUrl = getBaseUrl();
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${baseUrl}/api/auth/callback?next=${encodeURIComponent(redirectUrl || `/${locale}/dashboard`)}&locale=${locale}`,
            },
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            // Enroll in trial immediately after signup
            if (data?.user) {
                try {
                    // We call the API or the function if we can, but since this is client side,
                    // we might need an API endpoint or just rely on the route.ts catch-all.
                    // However, the user said "enrollment should also trigger during user signup".
                    // Let's call the plan API to force enrollment.
                    await fetch(`/${locale}/api/user/plan`);
                } catch (e) {
                    console.error("Trial enrollment fallback failed:", e);
                }
            }
            router.push(redirectUrl || `/${locale}/dashboard`);
            router.refresh();
        }
    }

    return (
        <div className="min-h-screen pt-28 pb-12 flex flex-col items-center justify-center bg-[#0a0a0f] text-white">
            <div className="w-full max-w-sm px-4">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold mb-2">{t("title")}</h1>
                    <p className="text-gray-400 text-sm">{t("subtitle")}</p>
                </div>

                <div className="card rounded-2xl p-6 sm:p-8 border border-white/5 bg-[#111118]">
                    <form onSubmit={handleSignup} className="space-y-4">
                        <div>
                            <label className="form-label" htmlFor="email">{t("emailLabel")}</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="form-input"
                                placeholder={t("emailPlaceholder")}
                                required
                            />
                        </div>
                        <div>
                            <label className="form-label" htmlFor="password">{t("passwordLabel")}</label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="form-input pr-10"
                                    placeholder={t("passwordPlaceholder")}
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors z-10 p-1"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                            <line x1="1" y1="1" x2="23" y2="23"></line>
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-1">{t("passwordPlaceholder")}.</p>
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
                            {loading ? t("loading") : t("submit")}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        {t("haveAccount")}{" "}
                        <Link href={`/${locale}/login`} className="text-indigo-400 hover:text-indigo-300 font-medium">
                            {t("loginLink")}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
