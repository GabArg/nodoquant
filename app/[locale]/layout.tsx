import type { Metadata } from "next";
import { createClient } from "@/lib/auth/server";
import "../globals.css";

export const metadata: Metadata = {
    title: {
        default: "NodoQuant — Discover Your Trading Edge",
        template: "%s | NodoQuant",
    },
    description:
        "Upload your trading history and discover if your strategy has a real statistical edge. Quantitative analysis for serious traders.",
    keywords: [
        "backtesting",
        "trading strategy analysis",
        "quant trading",
        "trade analysis",
        "strategy edge",
        "quantitative laboratory"
    ],
};

import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

export default async function RootLayout({
    children,
    params: { locale }
}: {
    children: React.ReactNode;
    params: { locale: string };
}) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Providing all messages to the client
    // side is the easiest way to get started
    const messages = await getMessages();
    const t = await getTranslations({ locale, namespace: "navbar" });

    return (
        <html lang={locale} className="dark scroll-smooth">
            <body className="antialiased min-h-screen">
                <NextIntlClientProvider messages={messages}>
                    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 backdrop-blur-md bg-black/50">
                        <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
                            {/* Logo */}
                            <Link
                                href="/"
                                className="text-sm font-bold text-white tracking-tight hover:text-indigo-400 transition-colors"
                            >
                                NodoQuant
                            </Link>

                            {/* Desktop nav */}
                            <div className="hidden sm:flex items-center gap-6 text-sm">
                                {user ? (
                                    <>
                                        <Link href="/analyzer" className="text-gray-400 hover:text-white transition-colors font-medium">{t("analyzer")}</Link>
                                        <Link href="/strategies" className="text-gray-400 hover:text-white transition-colors font-medium">{t("library")}</Link>
                                        <Link href="/leaderboard" className="text-gray-400 hover:text-white transition-colors font-medium">{t("leaderboard")}</Link>
                                        <span className="text-white/20">|</span>
                                        <Link href="/dashboard" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">{t("dashboard")}</Link>
                                        <Link href="/account" className="text-gray-400 hover:text-white transition-colors font-medium">{t("account")}</Link>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-5 text-gray-400 mr-4">
                                            <Link href="/strategies" className="hover:text-white transition-colors">{t("library")}</Link>
                                            <Link href="/leaderboard" className="hover:text-white transition-colors">{t("leaderboard")}</Link>
                                            <Link href="/#hero" className="hover:text-white transition-colors">{t("product")}</Link>
                                            <Link href="/#process" className="hover:text-white transition-colors">{t("howItWorks")}</Link>
                                            <Link href="/#score" className="hover:text-white transition-colors">{t("strategyScore")}</Link>
                                            <Link href="/#faq" className="hover:text-white transition-colors">{t("faq")}</Link>
                                        </div>
                                        <span className="text-white/20">|</span>
                                        <Link href="/login" className="text-gray-300 hover:text-white transition-colors font-medium">{t("login")}</Link>
                                        <Link
                                            href="/analyzer"
                                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20"
                                        >
                                            {t("analyzeCta")}
                                        </Link>
                                    </>
                                )}
                                <div className="pl-2 border-l border-white/10 flex items-center">
                                    <LanguageSwitcher />
                                </div>
                            </div>

                            {/* Mobile */}
                            <div className="flex sm:hidden items-center gap-3">
                                <LanguageSwitcher />
                                {user ? (
                                    <Link
                                        href="/dashboard"
                                        className="px-3 py-1.5 rounded-lg text-sm font-medium text-white"
                                        style={{ background: "#6366f1" }}
                                    >
                                        {t("dashboard")}
                                    </Link>
                                ) : (
                                    <Link
                                        href="/analyzer"
                                        className="px-3 py-1.5 rounded-lg text-sm font-medium text-white shadow-md shadow-indigo-500/20"
                                        style={{ background: "#6366f1" }}
                                    >
                                        {t("analyzeCta")}
                                    </Link>
                                )}
                            </div>
                        </nav>
                    </header>
                    <main>{children}</main>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
