import type { Trade } from "./parser";

export interface MonteCarloSimResult {
    worstCase: number;
    averageCase: number;
    bestCase: number;
    riskOfRuin: number; // percentage
    simulations: number[][]; // full equity curves (capped at 100 curves)
}

export function runMonteCarlo(trades: Trade[], iterations = 1000): MonteCarloSimResult {
    const initialBalance = 10000; // standard starting balance for simulation baseline
    const profits = trades.map((t) => t.profit);
    const numTrades = profits.length;
    let ruinCount = 0;

    const finalEquities: number[] = [];
    const simulatedCurves: number[][] = [];

    // Capping iterations to 10k to prevent completely blocking the main thread if called directly,
    // though the UI will call it with 1000.
    const iters = Math.min(iterations, 10000);

    for (let i = 0; i < iters; i++) {
        const shuffled = [...profits];
        // Fisher-Yates shuffle
        for (let j = numTrades - 1; j > 0; j--) {
            const k = Math.floor(Math.random() * (j + 1));
            const temp = shuffled[j];
            shuffled[j] = shuffled[k];
            shuffled[k] = temp;
        }

        let equity = initialBalance;
        let ruined = false;

        // We only save the curve for the first 100 iterations to avoid memory bloat in frontend
        const saveCurve = i < 100;
        let curve: number[] = [];
        if (saveCurve) {
            curve.push(equity);
        }

        for (const p of shuffled) {
            equity += p;
            if (saveCurve) {
                curve.push(equity);
            }
            // Definition: risk of ruin is equity dropping below -50% of starting capital
            // Starting cap is 10k, so < 5k means a 50% drop.
            if (equity <= initialBalance * 0.5) {
                ruined = true;
            }
        }

        if (ruined) {
            ruinCount++;
        }

        finalEquities.push(equity);

        if (saveCurve) {
            simulatedCurves.push(curve);
        }
    }

    // Determine worst (5th percentile), average (50th percentile), and best (95th percentile)
    finalEquities.sort((a, b) => a - b);
    const p5 = Math.floor(iters * 0.05);
    const p50 = Math.floor(iters * 0.5);
    const p95 = Math.floor(iters * 0.95);

    return {
        worstCase: finalEquities[p5] - initialBalance,
        averageCase: finalEquities[p50] - initialBalance,
        bestCase: finalEquities[p95] - initialBalance,
        riskOfRuin: (ruinCount / iters) * 100,
        simulations: simulatedCurves,
    };
}
