import { useTranslations } from "next-intl";

export default function SocialProof() {
    const t = useTranslations("socialProof");

    return (
        <section className="py-24 bg-black overflow-hidden border-b border-white/[0.02]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fade-in">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 tracking-tight">
                    {t("title")}
                </h2>
                <p className="text-gray-500 text-sm font-black uppercase tracking-[0.3em]">
                    {t("desc")}
                </p>
            </div>
        </section>
    );
}
