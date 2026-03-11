export default function SupportedPlatforms() {
    return (
        <section className="pt-[80px] pb-[60px] border-t border-white/5" id="platforms">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-10">
                    Supported Trading Platforms
                </p>
                <div className="flex flex-wrap justify-center items-center gap-12 sm:gap-20 transition-all duration-500">
                    {/* MT4 */}
                    <div className="flex items-center gap-3 transition-all hover:scale-105">
                        <img
                            src="/mt4.png"
                            alt="MetaTrader 4"
                            className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]"
                        />
                        <span className="text-xl font-bold text-white tracking-tight">MT4</span>
                    </div>

                    {/* MT5 */}
                    <div className="flex items-center gap-3 transition-all hover:scale-105">
                        <img
                            src="/mt5.png"
                            alt="MetaTrader 5"
                            className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]"
                        />
                        <span className="text-xl font-bold text-white tracking-tight">MT5</span>
                    </div>

                    {/* Binance */}
                    <div className="flex items-center gap-3 transition-all hover:scale-105">
                        <img
                            src="/binance.svg"
                            alt="Binance"
                            className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]"
                        />
                        <span className="text-xl font-bold text-white tracking-tight">Binance Export</span>
                    </div>

                    {/* Generic CSV */}
                    <div className="flex items-center gap-3 transition-all hover:scale-105">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-indigo-900/20 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">Generic CSV</span>
                    </div>
                </div>
                <p className="mt-10 text-sm text-gray-400 font-medium max-w-sm mx-auto">
                    Works with MT4, MT5, Binance exports and generic CSV files.
                </p>
            </div>
        </section>
    );
}
