export interface SampleStrategy {
    id: string;
    name: string;
    description: string;
    badge: string;
    color: string;
    metrics: {
        totalTrades: number;
        winrate: number;
        profitFactor: number;
        maxDrawdown: number;
        expectancy: number;
        sumProfit: number;
    };
    equityCurve: number[];
    strategyScore: number;
}

// Equity curves are cumulative profit values (simulated for demo)
function buildTrendCurve(): number[] {
    const curve: number[] = [0];
    let val = 0;
    for (let i = 0; i < 180; i++) {
        const upBias = 0.6;
        const move = Math.random() < upBias
            ? Math.random() * 3.5
            : -(Math.random() * 2.2);
        val += move;
        curve.push(Math.round(val * 100) / 100);
    }
    return curve;
}

function buildMeanReversionCurve(): number[] {
    const curve: number[] = [0];
    let val = 0;
    for (let i = 0; i < 220; i++) {
        const upBias = 0.67;
        // Mean reversion: smaller wins, very small losses
        const move = Math.random() < upBias
            ? Math.random() * 1.8
            : -(Math.random() * 1.4);
        val += move;
        curve.push(Math.round(val * 100) / 100);
    }
    return curve;
}

function buildScalpingCurve(): number[] {
    const curve: number[] = [0];
    let val = 0;
    for (let i = 0; i < 400; i++) {
        const upBias = 0.54;
        // Scalping: tiny moves, very high frequency
        const move = Math.random() < upBias
            ? Math.random() * 0.7
            : -(Math.random() * 0.65);
        val += move;
        curve.push(Math.round(val * 100) / 100);
    }
    return curve;
}

// We pre-seed the curves with deterministic-looking values
// so the preview is always consistent (seed via simple sequence)
function seededCurve(
    n: number,
    winBias: number,
    winMax: number,
    lossMax: number
): number[] {
    const curve: number[] = [0];
    let val = 0;
    // Use a simple LCG for consistent pseudo-random sequence
    let seed = 42;
    const rand = () => {
        seed = (seed * 1664525 + 1013904223) & 0xffffffff;
        return (seed >>> 0) / 0xffffffff;
    };
    for (let i = 0; i < n; i++) {
        const move = rand() < winBias
            ? rand() * winMax
            : -(rand() * lossMax);
        val += move;
        curve.push(Math.round(val * 100) / 100);
    }
    return curve;
}

export const SAMPLE_STRATEGIES: SampleStrategy[] = [
    {
        id: "trend",
        name: "Trend Following",
        description:
            "A classic momentum strategy that enters on trend breakouts and rides directional moves. Lower win rate offset by large risk-reward ratios.",
        badge: "📈 Trend",
        color: "#6366f1",
        metrics: {
            totalTrades: 182,
            winrate: 41.2,
            profitFactor: 2.18,
            maxDrawdown: 12.4,
            expectancy: 1.34,
            sumProfit: 4280,
        },
        equityCurve: seededCurve(182, 0.41, 4.2, 2.0),
        strategyScore: 74,
    },
    {
        id: "mean-reversion",
        name: "Mean Reversion",
        description:
            "A counter-trend approach that fades extreme moves and captures the snap-back to equilibrium. High win rate with tight stops.",
        badge: "🔄 Mean Rev.",
        color: "#10b981",
        metrics: {
            totalTrades: 224,
            winrate: 67.8,
            profitFactor: 1.42,
            maxDrawdown: 7.6,
            expectancy: 0.62,
            sumProfit: 3150,
        },
        equityCurve: seededCurve(224, 0.68, 1.6, 1.4),
        strategyScore: 69,
    },
    {
        id: "scalping",
        name: "Scalping",
        description:
            "A high-frequency strategy targeting small intraday price movements. Very large trade count with small per-trade P&L but consistent edge.",
        badge: "⚡ Scalping",
        color: "#f59e0b",
        metrics: {
            totalTrades: 412,
            winrate: 54.1,
            profitFactor: 1.09,
            maxDrawdown: 4.2,
            expectancy: 0.14,
            sumProfit: 1820,
        },
        equityCurve: seededCurve(412, 0.54, 0.7, 0.65),
        strategyScore: 52,
    },
];
