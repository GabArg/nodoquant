import { useTranslations } from "next-intl";

export default function FinalCTA() {
    const t = useTranslations("finalCta");

    return (
        <section className="py-[60px] relative overflow-hidden" id="start">
            <div className="absolute inset-0 bg-indigo-900/10 pointer-events-none" />
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10 border border-white/10 rounded-3xl p-10 sm:p-20 shadow-2xl"
                style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0) 100%), rgba(0,0,0,0.4)" }}>

                <p className="text-indigo-400 font-semibold tracking-wide uppercase text-sm mb-4">
                    {t("label")}
                </p>

                <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight">
                    {t("title")}
                </h2>

                <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
                    {t("desc")}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <a href="/analyzer" className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] hover:-translate-y-1 w-full sm:w-auto flex justify-center items-center">
                        {t("cta")}
                        <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </a>
                </div>

                <p className="mt-6 text-sm text-gray-500 font-medium">
                    {t("note")}
                </p>
            </div>
        </section>
    );
}
