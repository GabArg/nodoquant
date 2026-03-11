import Link from "next/link";

export default function BillingSuccessPage() {
    return (
        <main className="min-h-screen bg-[#07090F] flex items-center justify-center px-6">
            <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                    ✓
                </div>
                <h1 className="text-3xl font-bold text-white mb-4">¡Bienvenido a Pro!</h1>
                <p className="text-gray-400 mb-8">
                    Tu suscripción a <span className="text-indigo-400 font-semibold">NodoQuant Pro</span> está activa.
                    Ahora tenés acceso ilimitado a todas las herramientas avanzadas.
                </p>
                <div className="flex justify-center gap-4">
                    <Link
                        href="/dashboard"
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg"
                    >
                        Ir al Dashboard
                    </Link>
                    <Link
                        href="/analyzer"
                        className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors font-semibold"
                    >
                        Analizar Estrategia
                    </Link>
                </div>
            </div>
        </main>
    );
}
