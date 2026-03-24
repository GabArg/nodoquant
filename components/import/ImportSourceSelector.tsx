import { useTranslations } from "next-intl";
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
        label: "sources.csv.label",
        description: "sources.csv.desc",
        badge: "Universal",
        badgeColor: "#6366f1",
    },
    {
        id: "mt4",
        icon: "📊",
        label: "sources.mt4.label",
        description: "sources.mt4.desc",
        badge: "MetaTrader 4",
        badgeColor: "#0ea5e9",
    },
    {
        id: "mt5",
        icon: "📈",
        label: "sources.mt5.label",
        description: "sources.mt5.desc",
        badge: "MetaTrader 5",
        badgeColor: "#8b5cf6",
    },
    {
        id: "binance",
        icon: "🔑",
        label: "sources.binance.label",
        description: "sources.binance.desc",
        badge: "Spot + Futures",
        badgeColor: "#f59e0b",
    },
    {
        id: "generic",
        icon: "🔮",
        label: "sources.generic.label",
        description: "sources.generic.desc",
        disabled: true,
    },
];

interface Props {
    onSelect: (source: ImportSource) => void;
}

export default function ImportSourceSelector({ onSelect }: Props) {
    const t = useTranslations("analyzer.sourceSelector");

    return (
        <div className="py-12 space-y-10">
            <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 tracking-tight uppercase italic italic">
                    {t("title")}
                </h2>
                <p className="text-sm font-medium max-w-lg mx-auto leading-relaxed" style={{ color: "#9ca3af" }}>
                    {t("description")}
                </p>
                
                {/* Outcome Clarity Message */}
                <div className="mt-6 flex justify-center">
                    <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {t("outcomeNote")}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {SOURCES.map((src) => (
                    <button
                        key={src.id}
                        onClick={() => !src.disabled && onSelect(src.id)}
                        disabled={src.disabled}
                        className="text-left rounded-2xl p-6 border transition-all group relative overflow-hidden"
                        style={{
                            background: src.disabled
                                ? "rgba(255,255,255,0.01)"
                                : "rgba(255,255,255,0.02)",
                            borderColor: src.disabled
                                ? "rgba(255,255,255,0.04)"
                                : src.id === "csv" ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.08)",
                            cursor: src.disabled ? "not-allowed" : "pointer",
                            opacity: src.disabled ? 0.45 : 1,
                        }}
                    >
                        {src.id === "csv" && !src.disabled && (
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-[40px] pointer-events-none" />
                        )}
                        
                        <div className="flex items-start gap-4 h-full">
                            <span className="text-3xl shrink-0">{src.icon}</span>
                            <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="text-base font-bold text-white tracking-tight">
                                        {t(src.label)}
                                    </span>
                                    {src.badge && (
                                        <span
                                            className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider"
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
                                            {src.disabled ? t("soon") : src.badge}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>
                                    {t(src.description)}
                                </p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            <p className="text-[10px] font-bold text-center uppercase tracking-[0.3em]" style={{ color: "#374151" }}>
                {t("privacyNote")}
            </p>
        </div>
    );
}
