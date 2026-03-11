import Link from "next/link";

export default function BillingCancelPage() {
    return (
        <main className="min-h-screen bg-[#07090F] flex items-center justify-center px-6">
            <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-gray-700/40 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                    ✕
                </div>
                <h1 className="text-3xl font-bold text-white mb-4">Pago cancelado</h1>
                <p className="text-gray-400 mb-8">
                    No se realizó ningún cargo. Podés volver a intentarlo en cualquier momento cuando estés listo.
                </p>
                <div className="flex justify-center gap-4">
                    <Link
                        href="/pricing"
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg"
                    >
                        Ver planes
                    </Link>
                    <Link
                        href="/dashboard"
                        className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors font-semibold"
                    >
                        Volver al Dashboard
                    </Link>
                </div>
            </div>
        </main>
    );
}
