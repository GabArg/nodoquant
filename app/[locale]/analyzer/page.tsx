import type { Metadata } from "next";
import AnalyzerWizard from "@/components/analyzer/AnalyzerWizard";

export const metadata: Metadata = {
    title: "Strategy Analyzer — NodoQuant",
    description:
        "Sube tu historial de trading y obtené un análisis cuantitativo de tu estrategia. Compatible con CSV y export de MetaTrader 5. Gratis.",
    openGraph: {
        title: "Strategy Analyzer — NodoQuant",
        description:
            "Analizá tu estrategia de trading con métricas cuantitativas: Winrate, Profit Factor, Monte Carlo, Equity Curve y simulación de Prop Firm.",
        type: "website",
        locale: "es_AR",
    },
    twitter: {
        card: "summary_large_image",
        title: "Strategy Analyzer — NodoQuant",
        description:
            "Subí tu historial CSV o MT5 y recibí un análisis cuantitativo gratuito de tu estrategia.",
    },
};

export default function AnalyzerPage() {
    return <AnalyzerWizard />;
}
