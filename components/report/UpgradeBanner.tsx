"use client";

export default function UpgradeBanner() {
    return (
        <div className="card rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] -mr-32 -mt-32 rounded-full" />
            
            <div className="relative z-10 space-y-3 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    Mejora tu cuenta
                </div>
                <h3 className="text-xl font-bold text-white leading-tight">
                    Desbloqueá el diagnóstico avanzado de estrategias
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                    {[
                        "Análisis de performance por tiempo",
                        "Insights de distribución de trades",
                        "Métricas de estabilidad de riesgo",
                        "Simulaciones Monte Carlo ilimitadas"
                    ].map((item) => (
                        <li key={item} className="flex items-center gap-2 text-sm text-gray-400">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            {item}
                        </li>
                    ))}
                </ul>
            </div>
            
            <div className="relative z-10 shrink-0">
                <a 
                    href="/pricing"
                    className="btn-primary py-3 px-8 text-sm shadow-lg shadow-indigo-500/20 hover:scale-105 transition-transform"
                >
                    Actualizar a Pro
                </a>
            </div>
        </div>
    );
}
