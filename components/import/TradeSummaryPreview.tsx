"use client";

import type { NormalizedTrade, MarketType } from "@/lib/import/normalizedTrade";

interface Props {
    trades: NormalizedTrade[];
    onConfirm: () => void;
    onBack: () => void;
}

function formatDate(d: Date | null): string {
    if (!d) return "—";
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const MARKET_LABELS: Record<MarketType, string> = {
    forex: "Forex",
    crypto: "Crypto",
    futures: "Futures",
    stocks: "Stocks",
    indices: "Indices",
    unknown: "Mixed",
};

const MARKET_COLORS: Record<MarketType, string> = {
    forex: "#34d399",
    crypto: "#f59e0b",
    futures: "#60a5fa",
    stocks: "#a78bfa",
    indices: "#f472b6",
    unknown: "#9ca3af",
};

export default function TradeSummaryPreview({ trades, onConfirm, onBack }: Props) {
    if (trades.length === 0) return null;

    // Derive stats
    const closeTimes = trades.map(t => t.close_time.getTime());
    const openTimes = trades.map(t => t.open_time?.getTime()).filter(Boolean) as number[];
    const earliest = new Date(Math.min(...(openTimes.length ? openTimes : closeTimes)));
    const latest = new Date(Math.max(...closeTimes));

    // Market type breakdown
    const marketCounts: Partial<Record<MarketType, number>> = {};
    for (const t of trades) {
        marketCounts[t.market_type] = (marketCounts[t.market_type] ?? 0) + 1;
    }
    const primaryMarket = (Object.entries(marketCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "unknown") as MarketType;

    // Symbol count
    const uniqueSymbols = new Set(trades.map(t => t.symbol).filter(Boolean)).size;

    // Win rate preview
    const winners = trades.filter(t => t.profit_loss > 0).length;
    const winRate = trades.length > 0 ? (winners / trades.length) * 100 : 0;

    // Net P&L preview
    const netPnl = trades.reduce((s, t) => s + t.profit_loss, 0);
    const netPnlStr = netPnl >= 0 ? `+${netPnl.toFixed(2)}` : netPnl.toFixed(2);

    const marketColor = MARKET_COLORS[primaryMarket] ?? "#9ca3af";
    const marketLabel = MARKET_LABELS[primaryMarket] ?? "Mixed";

    const fewTrades = trades.length < 30;

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-lg font-bold text-white mb-0.5">Confirm your import</h2>
                <p className="text-sm" style={{ color: "#9ca3af" }}>
                    Review the data below before generating your strategy report.
                </p>
            </div>

            {/* Main stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                    label="Trades"
                    value={trades.length.toLocaleString()}
                    sub={fewTrades ? "⚠ Low sample" : "imported"}
                    color={fewTrades ? "#f59e0b" : "#a5b4fc"}
                />
                <StatCard
                    label="Market"
                    value={marketLabel}
                    sub={`${uniqueSymbols} symbol${uniqueSymbols !== 1 ? "s" : ""}`}
                    color={marketColor}
                />
                <StatCard
                    label="Win Rate"
                    value={`${winRate.toFixed(1)}%`}
                    sub={`${winners}W / ${trades.length - winners}L`}
                    color={winRate >= 50 ? "#34d399" : "#f87171"}
                />
                <StatCard
                    label="Net P&L"
                    value={netPnlStr}
                    sub="account currency"
                    color={netPnl >= 0 ? "#34d399" : "#f87171"}
                />
            </div>

            {/* Date range */}
            <div className="rounded-xl px-4 py-3 flex items-center justify-between gap-4"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div>
                    <p className="text-xs font-medium mb-0.5" style={{ color: "#6b7280" }}>Date range</p>
                    <p className="text-sm font-semibold text-white">
                        {formatDate(earliest)} <span style={{ color: "#4b5563" }}>→</span> {formatDate(latest)}
                    </p>
                </div>
                <div>
                    <p className="text-xs font-medium mb-0.5" style={{ color: "#6b7280" }}>Sources</p>
                    <div className="flex gap-1.5 flex-wrap">
                        {(Object.entries(marketCounts) as [MarketType, number][]).map(([m, c]) => (
                            <span
                                key={m}
                                className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{
                                    background: `${MARKET_COLORS[m] ?? "#9ca3af"}15`,
                                    color: MARKET_COLORS[m] ?? "#9ca3af",
                                    border: `1px solid ${MARKET_COLORS[m] ?? "#9ca3af"}30`,
                                }}
                            >
                                {MARKET_LABELS[m]} ({c})
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Low trade warning */}
            {fewTrades && (
                <div className="rounded-xl px-4 py-3 text-sm flex items-start gap-2"
                    style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", color: "#fcd34d" }}>
                    <svg className="shrink-0 mt-0.5" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span>
                        <strong>Only {trades.length} trades found.</strong> We recommend at least 30 for statistically reliable analysis. You can still generate a report, but interpret results with caution.
                    </span>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="flex-none px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}
                >
                    ← Re-import
                </button>
                <button
                    onClick={onConfirm}
                    className="flex-1 font-bold text-white py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                    style={{
                        background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                        boxShadow: "0 0 20px rgba(99,102,241,0.25)",
                    }}
                >
                    Generate strategy report
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
    return (
        <div
            className="rounded-xl px-3 py-3"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
            <p className="text-xs font-medium mb-1" style={{ color: "#6b7280" }}>{label}</p>
            <p className="text-xl font-bold" style={{ color }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: "#4b5563" }}>{sub}</p>
        </div>
    );
}
