import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function FooterNote() {
    const t = useTranslations("footerNote");
    const n = useTranslations("navbar");

    return (
        <footer className="border-t border-white/5 py-16 bg-black">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 sm:gap-8 border-b border-white/5 pb-12">
                    {/* Brand / Description */}
                    <div className="md:col-span-1">
                        <p className="text-lg font-bold text-white mb-4">NodoQuant</p>
                        <p className="text-sm text-gray-500 leading-relaxed pr-4">
                            {t("description")}
                        </p>
                    </div>

                    {/* Product */}
                    <div>
                        <p className="text-sm font-semibold text-white mb-5">{t("product")}</p>
                        <ul className="space-y-3">
                            <li><Link href="/analyzer" className="text-sm text-gray-400 hover:text-white transition-colors">{n("analyzer")}</Link></li>
                            <li><Link href="/#score" className="text-sm text-gray-400 hover:text-white transition-colors">{n("strategyScore")}</Link></li>
                            <li><Link href="/leaderboard" className="text-sm text-gray-400 hover:text-white transition-colors">{n("leaderboard")}</Link></li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <p className="text-sm font-semibold text-white mb-5">{t("resources")}</p>
                        <ul className="space-y-3">
                            <li><Link href="/#faq" className="text-sm text-gray-400 hover:text-white transition-colors">{n("faq")}</Link></li>
                            <li><Link href="/report/example" className="text-sm text-gray-400 hover:text-white transition-colors">{t("cta_sample_report") || "Sample Report"}</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <p className="text-sm font-semibold text-white mb-5">{t("legal")}</p>
                        <ul className="space-y-3">
                            <li><Link href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">{t("terms")}</Link></li>
                            <li><Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">{t("privacy")}</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-gray-600">
                        © {new Date().getFullYear()} NodoQuant. {t("rights")}.
                    </p>
                    <p className="text-xs text-gray-600 text-center sm:text-right max-w-xl">
                        {t("disclaimer")} {t("d2")} {t("d3")}
                    </p>
                </div>
            </div>
        </footer>
    );
}

// Note: I used n("analyzer") and n("strategyScore") from navbar namespace to avoid duplication.
// I'll add "cta_sample_report" to footerNote section if needed, or just use a fallback for now.
