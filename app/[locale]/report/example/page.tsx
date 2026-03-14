import PublicReportClient from "../[report_id]/PublicReportClient";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

interface Props {
    params: { locale: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const t = await getTranslations({ locale: params.locale, namespace: "fullReport.metadata" });
    
    return {
        title: "Example Strategy Report | NodoQuant",
        description: "Explore a professional quantitative trading report. Analyze win rate, profit factor, and robustness of a successful strategy.",
    };
}

export default function ExampleReportPage({ params }: Props) {
    // Hardcoded example data to "wow" the user
    const mockData = {
        id: "example",
        public_id: "example-report",
        strategy_name: "Mean Reversion Pro v2",
        dataset_name: "EURUSD H1 (2020-2024)",
        category: "Forex",
        created_at: new Date().toISOString(),
        metrics: {
            strategy_score: 84.5,
            total_trades: 436,
            win_rate: 0.45,
            profit_factor: 1.84,
            max_drawdown: -12.5,
            expectancy_r: 0.42,
            average_r: 0.42,
        },
        equity_curve: [0, 1.2, 0.8, 2.5, 3.1, 2.7, 4.5, 5.2, 4.8, 6.5, 7.2, 8.1, 7.5, 9.4, 10.2, 11.5, 12.8, 12.1, 14.5, 16.2, 18.5, 20.1, 19.5, 22.4, 25.1],
        notes: "This strategy uses a RSI-based mean reversion approach on the H1 timeframe. Execution is automated via Expert Advisor.",
        can_edit: false,
        is_pro: true,
        raw_metrics_json: {
            trades: Array.from({ length: 100 }, (_, i) => ({
                profit: Math.random() > 0.55 ? (Math.random() * 3 + 1) : -(Math.random() * 1 + 0.5),
                symbol: "EURUSD",
                entry_date: new Date(Date.now() - (100 - i) * 86400000).toISOString(),
                exit_date: new Date(Date.now() - (100 - i) * 86400000 + 3600000).toISOString(),
            }))
        },
        public_slug: "example-report"
    };

    return <PublicReportClient reportId="example" locale={params.locale} initialData={mockData} />;
}
