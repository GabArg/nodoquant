"use client";

interface Props {
    importSource?: "csv" | "mt4" | "mt5" | "binance" | null;
}

const SOURCE_CONFIG = {
    mt4: {
        icon: "📁",
        step1: "Export your MT4 trade history",
        step1Detail: 'In MetaTrader 4: Account History → right-click → "Save as Detailed Report" (.htm or .csv).',
        badge: "MT4 / MetaTrader 4",
    },
    mt5: {
        icon: "📁",
        step1: "Export your MT5 trade history",
        step1Detail: 'In MetaTrader 5: go to Account History tab → right-click → "Save as Report" to get the CSV.',
        badge: "MT5 / MetaTrader 5",
    },
    binance: {
        icon: "₿",
        step1: "Connect your Binance account",
        step1Detail: "Enter your read-only Binance API key and secret. We fetch your closed trades securely and never store credentials.",
        badge: "Binance API",
    },
    csv: {
        icon: "📄",
        step1: "Upload your trade history CSV",
        step1Detail: "Any CSV with at least a profit column and a date column works. MT5 exports, Binance CSVs, or custom spreadsheets.",
        badge: "CSV Upload",
    },
    default: {
        icon: "📊",
        step1: "Upload your trading history",
        step1Detail: "Export your closed trades from MT4, MT5, Binance, or use any generic CSV with profit data.",
        badge: "Any format",
    },
};

const TRUST_BADGES = [
    { icon: "🔒", label: "No data stored" },
    { icon: "⚡", label: "Results in 60s" },
    { icon: "🆓", label: "100% free" },
];

const AVATAR_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#3b82f6"];
const AVATAR_INITIALS = ["TR", "AM", "JC", "KL", "PE"];

export default function OnboardingPanel({ importSource }: Props) {
    const c = SOURCE_CONFIG[importSource ?? "default"] ?? SOURCE_CONFIG.default;

    return (
        <div className="w-full max-w-2xl mx-auto mb-6 rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>

            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{c.icon}</span>
                    <span className="text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}>
                        {c.badge}
                    </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-2">3 steps to your strategy score</h3>
                <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>
                    Get your Win Rate, Profit Factor, Max Drawdown and a Strategy Score in under 60 seconds.
                </p>
            </div>

            {/* Steps */}
            <div className="px-6 py-5 space-y-5">
                {[
                    { num: "1", label: c.step1, detail: c.step1Detail },
                    { num: "2", label: "Confirm the data mapping", detail: "We auto-detect columns. You simply verify they match, then hit confirm." },
                    { num: "3", label: "Get your Strategy Score", detail: "Receive a full quantitative analysis: Score, Equity Curve, Profit Factor, Drawdown, and 4 strategy insight cards." },
                ].map((s, i) => (
                    <div key={s.num} className="flex gap-4 items-start"
                        style={{ opacity: 0, animation: `fadeSlideIn 0.4s ease ${i * 0.12}s forwards` }}>
                        <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                            style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", color: "#818cf8" }}>
                            {s.num}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">{s.label}</p>
                            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#6b7280" }}>{s.detail}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Trust badges + social proof */}
            <div className="px-6 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t pt-4"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}>

                {/* Trust badges */}
                <div className="flex gap-3 flex-wrap">
                    {TRUST_BADGES.map(b => (
                        <span key={b.label} className="flex items-center gap-1.5 text-xs font-medium"
                            style={{ color: "#4b5563" }}>
                            <span>{b.icon}</span>
                            {b.label}
                        </span>
                    ))}
                </div>

                {/* Social proof */}
                <div className="flex items-center gap-2">
                    <div className="flex -space-x-1.5">
                        {AVATAR_COLORS.map((col, i) => (
                            <div key={i}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white ring-1 ring-black"
                                style={{ background: col }}>
                                {AVATAR_INITIALS[i]}
                            </div>
                        ))}
                    </div>
                    <span className="text-xs" style={{ color: "#6b7280" }}>
                        1,200+ traders analyzed
                    </span>
                </div>
            </div>

            <style>{`
                @keyframes fadeSlideIn {
                    from { opacity:0; transform:translateY(6px); }
                    to   { opacity:1; transform:translateY(0); }
                }
            `}</style>
        </div>
    );
}
