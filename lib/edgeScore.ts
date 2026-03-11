// Shared Edge Score v2 utilities

export function calcEdgeScore(winrate: number, profitFactor: number, maxDrawdown: number, tradeCount: number): number {
    let s = 0;
    // Profit Factor → 0–3.5 pts
    s += profitFactor >= 2 ? 3.5 : profitFactor >= 1.5 ? 3 : profitFactor >= 1.2 ? 2 : profitFactor >= 1 ? 1 : 0;
    // Winrate → 0–2 pts
    s += winrate > 60 ? 2 : winrate >= 55 ? 1.5 : winrate >= 50 ? 1 : winrate >= 40 ? 0.5 : 0;
    // Drawdown → 0–2.5 pts (lower is better)
    s += maxDrawdown < 10 ? 2.5 : maxDrawdown <= 20 ? 2 : maxDrawdown <= 30 ? 1.5 : maxDrawdown <= 40 ? 1 : maxDrawdown <= 50 ? 0.5 : 0;
    // Sample Size → 0–2 pts
    s += tradeCount > 300 ? 2 : tradeCount >= 100 ? 1.5 : tradeCount >= 60 ? 1 : tradeCount >= 30 ? 0.5 : 0;
    return Math.min(10, Math.max(0, s));
}

export function edgeScoreColor(score: number): string {
    if (score >= 8) return "#34d399";
    if (score >= 6) return "#818cf8";
    if (score >= 4) return "#fbbf24";
    return "#f87171";
}

export function edgeScoreLabel(score: number): string {
    if (score >= 8) return "Excellent";
    if (score >= 6) return "Good";
    if (score >= 4) return "Average";
    return "Weak";
}

export function safeStrategyName(name: string | null | undefined): string {
    return name || "Strategy Report";
}

export function safeDatasetName(name: string | null | undefined, index?: number): string {
    if (name) return name;
    return index !== undefined ? `Dataset #${index + 1}` : "Dataset";
}

export function formatDate(dateStr: string): string {
    return new Date(dateStr).toISOString().slice(0, 10);
}
