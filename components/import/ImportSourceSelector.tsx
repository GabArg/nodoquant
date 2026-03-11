"use client";

import type { ImportSource } from "@/lib/import/normalizedTrade";

interface SourceCard {
    id: ImportSource;
    icon: string;
    label: string;
    description: string;
    badge?: string;
    badgeColor?: string;
    disabled?: boolean;
}

const SOURCES: SourceCard[] = [
    {
        id: "csv",
        icon: "📄",
        label: "Upload CSV",
        description: "Any CSV or TSV export from your broker, EA backtester, or trading journal.",
        badge: "Universal",
        badgeColor: "#6366f1",
    },
    {
        id: "mt4",
        icon: "📊",
        label: "MT4 Statement",
        description: "Import an HTML or CSV account statement exported directly from MetaTrader 4.",
        badge: "MetaTrader 4",
        badgeColor: "#0ea5e9",
    },
    {
        id: "mt5",
        icon: "📈",
        label: "MT5 Statement",
        description: "Import an HTML or CSV Deals report exported from MetaTrader 5.",
        badge: "MetaTrader 5",
        badgeColor: "#8b5cf6",
    },
    {
        id: "binance-spot",
        icon: "🔑",
        label: "Binance API",
        description: "Connect via API key to import Spot and/or USDT-M Futures trade history automatically.",
        badge: "Spot + Futures",
        badgeColor: "#f59e0b",
    },
    {
        id: "generic",
        icon: "🔮",
        label: "More brokers",
        description: "Interactive Brokers, Bybit, OKX, KuCoin and more — coming soon.",
        disabled: true,
    },
];

interface Props {
    onSelect: (source: ImportSource) => void;
}

export default function ImportSourceSelector({ onSelect }: Props) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-white mb-1">Import your trading history</h2>
                <p className="text-sm" style={{ color: "#9ca3af" }}>
                    Choose how you want to import your trades. All sources produce the same analysis.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SOURCES.map((src) => (
                    <button
                        key={src.id}
                        onClick={() => !src.disabled && onSelect(src.id)}
                        disabled={src.disabled}
                        className="text-left rounded-xl p-4 border transition-all group relative"
                        style={{
                            background: src.disabled
                                ? "rgba(255,255,255,0.01)"
                                : "rgba(255,255,255,0.02)",
                            borderColor: src.disabled
                                ? "rgba(255,255,255,0.04)"
                                : "rgba(255,255,255,0.08)",
                            cursor: src.disabled ? "not-allowed" : "pointer",
                            opacity: src.disabled ? 0.45 : 1,
                        }}
                        onMouseEnter={e => {
                            if (!src.disabled) {
                                (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.35)";
                                (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.05)";
                            }
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.borderColor = src.disabled
                                ? "rgba(255,255,255,0.04)"
                                : "rgba(255,255,255,0.08)";
                            (e.currentTarget as HTMLElement).style.background = src.disabled
                                ? "rgba(255,255,255,0.01)"
                                : "rgba(255,255,255,0.02)";
                        }}
                    >
                        <div className="flex items-start gap-3">
                            <span className="text-2xl shrink-0 mt-0.5">{src.icon}</span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                    <span className="text-sm font-semibold text-white">{src.label}</span>
                                    {src.badge && (
                                        <span
                                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                                            style={{
                                                background: src.disabled
                                                    ? "rgba(255,255,255,0.06)"
                                                    : `${src.badgeColor}18`,
                                                color: src.disabled
                                                    ? "#4b5563"
                                                    : src.badgeColor,
                                                border: `1px solid ${src.disabled ? "rgba(255,255,255,0.06)" : `${src.badgeColor}30`}`,
                                            }}
                                        >
                                            {src.disabled ? "Coming Soon" : src.badge}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>
                                    {src.description}
                                </p>
                            </div>
                            {!src.disabled && (
                                <svg
                                    className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    width="14" height="14"
                                    viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5"
                                >
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            )}
                        </div>
                    </button>
                ))}
            </div>

            <p className="text-xs text-center" style={{ color: "#374151" }}>
                All import methods produce the same quantitative report. Your data is never shared.
            </p>
        </div>
    );
}
