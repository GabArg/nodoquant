import type { Metadata } from "next";
import PublicReportClient from "./PublicReportClient";

interface Props {
    params: { locale: string; report_id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    return {
        title: "Strategy Report — NodoQuant",
        description:
            "View this trading strategy's statistical edge: Win Rate, Profit Factor, Max Drawdown, Expectancy and Strategy Score — analyzed with NodoQuant.",
        openGraph: {
            title: "Strategy Report — NodoQuant",
            description: "See the quantitative edge of this trading strategy.",
            siteName: "NodoQuant",
        },
    };
}

export default function PublicReportPage({ params }: Props) {
    return <PublicReportClient reportId={params.report_id} locale={params.locale} />;
}
