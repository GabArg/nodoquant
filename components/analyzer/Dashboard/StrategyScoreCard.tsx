interface StrategyScoreCardProps {
    score: number;
}

export default function StrategyScoreCard({ score }: StrategyScoreCardProps) {
    // Score out of 100
    const roundedScore = Math.round(score);

    let colorClass = "text-emerald-400";
    let bgClass = "from-emerald-900/40 to-emerald-900/10";
    let borderClass = "border-emerald-500/20";
    let label = "Estrategia Validada";

    if (roundedScore < 40) {
        colorClass = "text-rose-400";
        bgClass = "from-rose-900/40 to-rose-900/10";
        borderClass = "border-rose-500/20";
        label = "Sin Ventaja Estadística";
    } else if (roundedScore < 70) {
        colorClass = "text-amber-400";
        bgClass = "from-amber-900/40 to-amber-900/10";
        borderClass = "border-amber-500/20";
        label = "Ventaja Marginal";
    }

    return (
        <div className={`p-6 rounded-2xl bg-gradient-to-br ${bgClass} border ${borderClass} flex flex-col items-center justify-center text-center`}>
            <p className="text-sm text-white/60 mb-2 uppercase tracking-widest font-semibold">Strategy Score</p>
            <div className={`text-6xl font-black ${colorClass} mb-2 drop-shadow-lg`}>
                {roundedScore}
            </div>
            <div className={`px-4 py-1 rounded-full text-sm font-medium border ${borderClass} ${colorClass} bg-black/20`}>
                {label}
            </div>
        </div>
    );
}
