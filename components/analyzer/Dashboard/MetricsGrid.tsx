import { useTranslations } from 'next-intl';

interface MetricsGridProps {
    metrics: {
        win_rate: number;
        profit_factor: number;
        expectancy_r: number;
        max_drawdown: number;
        average_r: number;
        total_trades: number;
    };
}

export default function MetricsGrid({ metrics }: MetricsGridProps) {
    const t = useTranslations('analyzer.dashboard');
    const { win_rate, profit_factor, expectancy_r, max_drawdown, average_r, total_trades } = metrics;

    const formatPercent = (val: number) => `${(val * 100).toFixed(1)}%`;
    const formatNumber = (val: number) => val.toFixed(2);

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <MetricCard label={t('winRate')} value={formatPercent(win_rate)} subtitle={win_rate > 0.4 ? t('stable') : t('low')} />
            <MetricCard label={t('profitFactor')} value={formatNumber(profit_factor)} subtitle={profit_factor > 1.5 ? t('excellent') : profit_factor > 1 ? t('profitable') : t('loss')} />
            <MetricCard label={t('expectancy')} value={`${formatNumber(expectancy_r)} R`} subtitle={t('perTrade')} />
            <MetricCard label={t('maxDrawdown')} value={`${formatNumber(max_drawdown)} R`} subtitle={t('risk')} />
            <MetricCard label={t('averageR')} value={`${formatNumber(average_r)} R`} subtitle={t('avgWinLoss')} />
            <MetricCard label={t('totalTrades')} value={total_trades.toString()} subtitle={t('sampleSize')} />
        </div>
    );
}

function MetricCard({ label, value, subtitle }: { label: string; value: string; subtitle: string }) {
    return (
        <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <p className="text-sm text-gray-400 mb-1">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
    );
}
