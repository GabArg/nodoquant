import { useTranslations } from "next-intl";

export default function AnalyticsPage() {
    const t = useTranslations("dashboard.analytics");

    return (
        <main className="p-8">
            <h1 className="text-3xl font-bold text-white mb-6">{t("title")}</h1>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                <p className="text-gray-400">{t("proNotice")}</p>
            </div>
        </main>
    );
}
