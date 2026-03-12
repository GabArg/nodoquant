import type { Metadata } from "next";
import AnalyzerWizard from "@/components/analyzer/AnalyzerWizard";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
    const t = await getTranslations({ locale: params.locale, namespace: "analyzer.metadata" });
    
    return {
        title: t("title"),
        description: t("description"),
        openGraph: {
            title: t("title"),
            description: t("description"),
            type: "website",
            locale: params.locale === "es" ? "es_AR" : "en_US",
        },
        twitter: {
            card: "summary_large_image",
            title: t("title"),
            description: t("description"),
        },
    };
}

export default function AnalyzerPage() {
    return <AnalyzerWizard />;
}
