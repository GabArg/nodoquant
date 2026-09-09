import Link from "next/link";

export default function BetaPage({ params }: { params: { locale: string } }) {
    const es = params.locale === "es";
    const features = es
        ? ["Hasta 500 trades por análisis", "1 análisis guardado por usuario", "Reportes públicos y herramientas cuantitativas incluidas en la beta"]
        : ["Up to 500 trades per analysis", "1 saved analysis per user", "Public reports and quantitative tools included in the beta"];

    return (
        <main className="min-h-screen bg-[#07090F] pt-28 pb-20 px-6 text-white">
            <div className="max-w-3xl mx-auto text-center">
                <span className="inline-flex px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6">{es ? "Beta pública" : "Public beta"}</span>
                <h1 className="text-4xl md:text-5xl font-black mb-5">{es ? "NodoQuant es gratis durante la beta" : "NodoQuant is free during beta"}</h1>
                <p className="text-lg text-gray-400 mb-10">{es ? "Todavía no ofrecemos planes pagos ni checkout. Usá la beta limitada y ayudanos con tu feedback." : "We do not offer paid plans or checkout yet. Use the limited beta and help us with your feedback."}</p>
                <div className="rounded-3xl p-8 border border-indigo-500/25 bg-indigo-500/5 text-left mb-8">
                    <h2 className="text-xl font-bold mb-5">{es ? "Qué incluye" : "What's included"}</h2>
                    <ul className="space-y-4 text-gray-300">{features.map((feature) => <li key={feature} className="flex gap-3"><span className="text-emerald-400">✓</span>{feature}</li>)}</ul>
                </div>
                <Link href={`/${params.locale}/analyzer`} className="btn-primary px-8 py-4 inline-flex justify-center">{es ? "Analizar una estrategia" : "Analyze a strategy"}</Link>
            </div>
        </main>
    );
}
