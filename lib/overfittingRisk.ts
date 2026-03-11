// Overfitting Risk Detector
// Flags strategies that may be curve-fitted to historical data.

export interface OverfitResult {
    riskPoints: number;
    riskLevel: "Low" | "Moderate" | "High";
    color: string;
    triggeredRules: string[];
}

export function detectOverfitting(opts: {
    profitFactor: number;
    maxDrawdown: number;
    trades: number;
    datasetsCount: number;
    confidenceScore: number;
    edgeScores: number[];
    expectancy?: number;
}): OverfitResult {
    const { profitFactor, maxDrawdown, trades, datasetsCount, confidenceScore, edgeScores, expectancy } = opts;
    let riskPoints = 0;
    const triggeredRules: string[] = [];

    // Rule 1 — High PF + Small Sample
    if (profitFactor > 2.5 && trades < 100) {
        riskPoints += 2;
        triggeredRules.push("High PF with small sample size");
    }

    // Rule 2 — High PF + High Drawdown
    if (profitFactor > 2 && maxDrawdown > 50) {
        riskPoints += 1;
        triggeredRules.push("High PF combined with high drawdown");
    }

    // Rule 3 — Edge Inconsistency across datasets
    if (edgeScores.length >= 2) {
        const variation = Math.max(...edgeScores) - Math.min(...edgeScores);
        if (variation > 3) {
            riskPoints += 2;
            triggeredRules.push(`Edge variation across datasets: ${variation.toFixed(1)}`);
        }
    }

    // Rule 4 — Low Confidence
    if (confidenceScore < 5) {
        riskPoints += 2;
        triggeredRules.push("Low confidence score");
    }

    // Rule 5 — Few Datasets
    if (datasetsCount === 1) {
        riskPoints += 2;
        triggeredRules.push("Only one dataset available");
    } else if (datasetsCount === 2) {
        riskPoints += 1;
        triggeredRules.push("Only two datasets — still fragile");
    }

    // Rule 6 — Too-perfect equity curve
    if (profitFactor > 2.5 && maxDrawdown < 15 && trades < 200) {
        riskPoints += 1;
        triggeredRules.push("Suspiciously perfect curve (high PF, low DD, small sample)");
    }

    // Rule 7 — Unrealistic expectancy
    if (expectancy !== undefined && expectancy > 2 && trades < 150) {
        riskPoints += 1;
        triggeredRules.push(`Unusually high expectancy (${expectancy.toFixed(1)}R) with limited trades`);
    }

    // Rule 8 — Extreme Profit Factor
    if (profitFactor > 4 && trades < 300) {
        riskPoints += 1;
        triggeredRules.push(`Extremely high PF (${profitFactor.toFixed(2)}) — rare in live trading`);
    }

    // Classification
    const riskLevel = riskPoints >= 5 ? "High" : riskPoints >= 3 ? "Moderate" : "Low";
    const color = riskPoints >= 5 ? "#f87171" : riskPoints >= 3 ? "#fbbf24" : "#34d399";

    return { riskPoints, riskLevel, color, triggeredRules };
}
