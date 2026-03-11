import { useTranslations } from "next-intl";

export default function FooterNote() {
    const t = useTranslations("footerNote");

    return (
        <footer className="border-t border-white/5 py-16 bg-black">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 sm:gap-8 border-b border-white/5 pb-12">
                    {/* Brand / Description */}
                    <div className="md:col-span-1">
                        <p className="text-lg font-bold text-white mb-4">NodoQuant</p>
                        <p className="text-sm text-gray-500 leading-relaxed pr-4">
                            The Quantitative Laboratory for Traders. Upload your trades and discover if your strategy actually has statistical edge.
                        </p>
                    </div>

                    {/* Product */}
                    <div>
                        <p className="text-sm font-semibold text-white mb-5">Product</p>
                        <ul className="space-y-3">
                            <li><a href="/analyzer" className="text-sm text-gray-400 hover:text-white transition-colors">Analyzer</a></li>
                            <li><a href="/#score" className="text-sm text-gray-400 hover:text-white transition-colors">Strategy Score</a></li>
                            <li><a href="/leaderboard" className="text-sm text-gray-400 hover:text-white transition-colors">Leaderboard</a></li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <p className="text-sm font-semibold text-white mb-5">Resources</p>
                        <ul className="space-y-3">
                            <li><a href="/#faq" className="text-sm text-gray-400 hover:text-white transition-colors">FAQ</a></li>
                            <li><a href="/report/example" className="text-sm text-gray-400 hover:text-white transition-colors">Sample Report</a></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <p className="text-sm font-semibold text-white mb-5">Legal</p>
                        <ul className="space-y-3">
                            <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
                            <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-gray-600">
                        © {new Date().getFullYear()} NodoQuant. {t("rights")}.
                    </p>
                    <p className="text-xs text-gray-600 text-center sm:text-right max-w-xl">
                        {t("disclaimer")} {t("d2")} {t("d3")}
                    </p>
                </div>
            </div>
        </footer>
    );
}
