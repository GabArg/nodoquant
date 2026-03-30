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
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${getBaseUrl()}/api/auth/callback?next=${encodeURIComponent(redirectUrl || `/${locale}/dashboard`)}&locale=${locale}`,
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
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="form-input"
                                placeholder={t("passwordPlaceholder")}
                                required
                                minLength={6}
                            />
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
