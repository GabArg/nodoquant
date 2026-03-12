import type { Metadata } from "next";
import PublicReportClient from "./PublicReportClient";
import { getTranslations } from "next-intl/server";

interface Props {
    params: { locale: string; report_id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const t = await getTranslations({ locale: params.locale, namespace: "fullReport.metadata" });
    
    return {
        title: t("title"),
        description: t("description"),
        openGraph: {
            title: t("title"),
            description: t("description"),
            siteName: "NodoQuant",
        },
    };
}

export default function PublicReportPage({ params }: Props) {
    return <PublicReportClient reportId={params.report_id} locale={params.locale} />;
}
