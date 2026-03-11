// Strategy DNA — Statistical behavior profiler
// Characterizes trading style without evaluating quality.

export interface DNAProfile {
    tradeFrequency: { label: string; color: string; tooltip: string };
    volatility: { label: string; color: string; tooltip: string };
    winDistribution: { label: string; color: string; tooltip: string };
    streakBehavior: { label: string; color: string; tooltip: string };
    riskProfile: { label: string; color: string; tooltip: string };
    tradeDuration: { label: string; color: string; tooltip: string };
    profitConcentration: { label: string; color: string; tooltip: string };
}

export function analyzeStrategyDNA(opts: {
    trades: number;
    pnl: number[];
    maxDrawdown: number;
    oldestDate: string;
    newestDate: string;
    avgTradeDurationMin?: number;
}): DNAProfile {
    const { trades, pnl, maxDrawdown, oldestDate, newestDate, avgTradeDurationMin } = opts;

    // ── Trade Frequency ──
    const msSpan = new Date(newestDate).getTime() - new Date(oldestDate).getTime();
    const months = Math.max(1, msSpan / (1000 * 60 * 60 * 24 * 30));
    const tpm = trades / months;
    const tradeFrequency = tpm > 40
        ? { label: "High Frequency", color: "#818cf8", tooltip: `~${tpm.toFixed(0)} trades/month` }
        : tpm >= 10
            ? { label: "Medium Frequency", color: "#34d399", tooltip: `~${tpm.toFixed(0)} trades/month` }
            : { label: "Low Frequency", color: "#fbbf24", tooltip: `~${tpm.toFixed(0)} trades/month` };

    // ── Volatility (std dev of returns) ──
    let volatility: DNAProfile["volatility"];
    if (pnl.length >= 2) {
        const mean = pnl.reduce((a, b) => a + b, 0) / pnl.length;
        const variance = pnl.reduce((s, v) => s + (v - mean) ** 2, 0) / pnl.length;
        const std = Math.sqrt(variance);
        const cv = mean !== 0 ? std / Math.abs(mean) : std;
        volatility = cv > 2
            ? { label: "Volatile", color: "#f87171", tooltip: `CV: ${cv.toFixed(2)}` }
            : cv > 1
                ? { label: "Moderate", color: "#fbbf24", tooltip: `CV: ${cv.toFixed(2)}` }
                : { label: "Stable", color: "#34d399", tooltip: `CV: ${cv.toFixed(2)}` };
    } else {
        volatility = { label: "Unknown", color: "#4b5563", tooltip: "Not enough PnL data" };
    }

    // ── Win Distribution (skewness) ──
    let winDistribution: DNAProfile["winDistribution"];
    if (pnl.length >= 3) {
        const mean = pnl.reduce((a, b) => a + b, 0) / pnl.length;
        const n = pnl.length;
        const m2 = pnl.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
        const m3 = pnl.reduce((s, v) => s + (v - mean) ** 3, 0) / n;
        const skew = m2 > 0 ? m3 / (m2 ** 1.5) : 0;
        winDistribution = skew > 0.5
            ? { label: "Right Skewed", color: "#34d399", tooltip: `Skew: ${skew.toFixed(2)} — few large wins` }
            : skew < -0.5
                ? { label: "Left Skewed", color: "#f87171", tooltip: `Skew: ${skew.toFixed(2)} — few large losses` }
                : { label: "Balanced", color: "#818cf8", tooltip: `Skew: ${skew.toFixed(2)}` };
    } else {
        winDistribution = { label: "Unknown", color: "#4b5563", tooltip: "Not enough PnL data" };
    }

    // ── Losing Streak ──
    let maxStreak = 0;
    let cur = 0;
    for (const v of pnl) {
        if (v < 0) { cur++; if (cur > maxStreak) maxStreak = cur; }
        else cur = 0;
    }
    const streakBehavior = pnl.length < 2
        ? { label: "Unknown", color: "#4b5563", tooltip: "Not enough PnL data" }
        : maxStreak > 10
            ? { label: "Long Streaks", color: "#f87171", tooltip: `Max losing streak: ${maxStreak}` }
            : maxStreak >= 5
                ? { label: "Medium Streaks", color: "#fbbf24", tooltip: `Max losing streak: ${maxStreak}` }
                : { label: "Short Streaks", color: "#34d399", tooltip: `Max losing streak: ${maxStreak}` };

    // ── Risk Profile ──
    const riskProfile = maxDrawdown < 20
        ? { label: "Conservative", color: "#34d399", tooltip: `Max DD: ${maxDrawdown.toFixed(1)}%` }
        : maxDrawdown <= 40
            ? { label: "Balanced", color: "#818cf8", tooltip: `Max DD: ${maxDrawdown.toFixed(1)}%` }
            : { label: "Aggressive", color: "#f87171", tooltip: `Max DD: ${maxDrawdown.toFixed(1)}%` };
    // ── Trade Duration ──
    let tradeDuration: DNAProfile["tradeDuration"];
    if (avgTradeDurationMin !== undefined && avgTradeDurationMin > 0) {
        const hrs = avgTradeDurationMin / 60;
        tradeDuration = avgTradeDurationMin < 30
            ? { label: "Scalping", color: "#f87171", tooltip: `Avg: ${avgTradeDurationMin.toFixed(0)} min` }
            : avgTradeDurationMin <= 240
                ? { label: "Intraday", color: "#818cf8", tooltip: `Avg: ${hrs.toFixed(1)} hours` }
                : { label: "Swing", color: "#34d399", tooltip: `Avg: ${hrs.toFixed(1)} hours` };
    } else {
        tradeDuration = { label: "Unknown", color: "#4b5563", tooltip: "No duration data available" };
    }

    // ── Profit Concentration ──
    let profitConcentration: DNAProfile["profitConcentration"];
    const wins = pnl.filter((v) => v > 0);
    if (wins.length >= 5) {
        const totalProfit = wins.reduce((a, b) => a + b, 0);
        const sorted = [...wins].sort((a, b) => b - a);
        const top20Count = Math.max(1, Math.ceil(wins.length * 0.2));
        const top20Profit = sorted.slice(0, top20Count).reduce((a, b) => a + b, 0);
        const ratio = totalProfit > 0 ? top20Profit / totalProfit : 0;
        profitConcentration = ratio > 0.8
            ? { label: "High", color: "#fbbf24", tooltip: `Top 20% of wins = ${(ratio * 100).toFixed(0)}% of profit` }
            : ratio > 0.5
                ? { label: "Moderate", color: "#818cf8", tooltip: `Top 20% of wins = ${(ratio * 100).toFixed(0)}% of profit` }
                : { label: "Distributed", color: "#34d399", tooltip: `Top 20% of wins = ${(ratio * 100).toFixed(0)}% of profit` };
    } else {
        profitConcentration = { label: "Unknown", color: "#4b5563", tooltip: "Not enough winning trades" };
    }

    return { tradeFrequency, volatility, winDistribution, streakBehavior, riskProfile, tradeDuration, profitConcentration };
}
