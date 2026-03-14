import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function PrivacyPage() {
    const t = useTranslations("legal.privacy");
    const common = useTranslations("legal");

    return (
        <main className="min-h-screen bg-[#07090F] text-gray-300 py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <Link 
                    href="/"
                    className="inline-flex items-center text-sm font-medium text-indigo-400 hover:text-indigo-300 mb-12 transition-colors group"
                >
                    <span className="mr-2 transition-transform group-hover:-translate-x-1">←</span>
                    {common("backToHome")}
                </Link>

                <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">
                    {t("title")}
                </h1>
                <p className="text-sm text-gray-500 mb-12 font-medium">
                    {t("lastUpdated")}
                </p>

                <div className="prose prose-invert prose-indigo max-w-none space-y-10">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">{t("sec1")}</h2>
                        <p className="leading-relaxed">
                            {t("sec1_content")}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">{t("sec2")}</h2>
                        <p className="leading-relaxed">
                            {t("sec2_content")}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">{t("sec3")}</h2>
                        <p className="leading-relaxed">
                            {t("sec3_content")}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">{t("sec4")}</h2>
                        <p className="leading-relaxed">
                            {t("sec4_content")}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">{t("sec5")}</h2>
                        <p className="leading-relaxed">
                            {t("sec5_content")}
                        </p>
                    </section>
                </div>

                <div className="mt-20 pt-10 border-t border-white/5">
                    <p className="text-xs text-gray-600 font-medium">
                        {common("compliance")}
                    </p>
                </div>
            </div>
        </main>
    );
}
