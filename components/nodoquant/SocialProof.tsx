import { useTranslations } from "next-intl";

export default function SocialProof() {
    const t = useTranslations("socialProof");

    return (
        <section className="py-20 border-t border-white/5 bg-black/30" id="social-proof">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <p className="text-xl sm:text-2xl font-medium text-gray-300 mb-6">
                    {t("title")}
                </p>
                <div className="flex flex-col items-center justify-center">
                    <span className="text-sm font-semibold text-indigo-400 uppercase tracking-widest mb-2">
                        {t("label")}
                    </span>
                    <span className="text-5xl sm:text-6xl font-black text-white tracking-tight drop-shadow-md">
                        {t("counter")}
                    </span>
                </div>
            </div>
        </section>
    );
}
