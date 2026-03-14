/**
 * Quantitative metrics engine for trade analysis.
 * All functions are pure (no side effects).
 */

import type { Trade } from "./parser";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BasicMetrics {
    totalTrades: number;
    winrate: number; // 0-100
    profitFactor: number;
    maxDrawdown: number; // 0-100 (percentage)
    maxDrawdownAbs: number; // in currency units
    expectancy: number; // avg profit per trade
    sumProfit: number;
}

export interface FullMetrics extends BasicMetrics {
    equityCurve: number[];
    drawdownCurve: number[]; // drawdown % at each trade
    tradeHistogram: number[];
    minProfit: number;
    maxProfit: number;
    longestLosingStreak: number;
    recommendedRiskPct: number; // % of capital per trade (Kelly-based)
    riskOfRuin: number; // 0-100
    monteCarlo: MonteCarloResult;
    timeAnalysis: TimeAnalysis;
    riskAnalysis: RiskMetrics;
    stabilityAnalysis: StabilityAnalysis;
    stabilityScore: number; // 0-100
    evolution?: {
        last100?: BasicMetrics;
        last50?: BasicMetrics;
        last30?: BasicMetrics;
    };
}

export interface StabilityAnalysis {
    segments: Array<{
        segment: string;
        profitFactor: number;
        winrate: number;
        netProfit: number;
    }>;
    interpretation: "Estable" | "Degradando" | "Mejorando";
}

export interface TimeAnalysis {
    byWeekday: number[]; // Index 0-6 (Sun-Sat)
    byHour: number[]; // Index 0-23
    bySession: {
        asian: number;
        london: number;
        ny: number;
    };
}

export interface RiskMetrics {
    maxDrawdown: number;
    avgDrawdown: number;
    recoveryFactor: number;
    profitToDrawdown: number;
}

export interface MonteCarloResult {
    iterations: number;
    worstCase: number; // final equity at 5th percentile
    averageCase: number; // median
    bestCase: number; // 95th percentile
    riskOfRuin: number; // % of sims that went to 0 or below
    drawdownAt5Pct: number; // max drawdown at 5th percentile
    simulations: number[][]; // the actual equity paths for rendering
}

export interface PropFirmParams {
    balance: number;
    targetPct: number; // e.g. 10 for 10%
    dailyDrawdownPct: number; // e.g. 5
    maxDrawdownPct: number; // e.g. 10
}

export interface PropFirmResult {
    passProb: number; // 0-100
    failDailyDDProb: number; // 0-100
    failMaxDDProb: number; // 0-100
    expectedTrades: number;
}

// ── Basic analysis ────────────────────────────────────────────────────────────

export function calcBasicMetrics(trades: Trade[]): BasicMetrics {
    if (trades.length === 0) {
        return {
            totalTrades: 0,
            winrate: 0,
            profitFactor: 0,
            maxDrawdown: 0,
            maxDrawdownAbs: 0,
            expectancy: 0,
            sumProfit: 0,
        };
    }

    const winners = trades.filter((t) => t.profit > 0);
    const losers = trades.filter((t) => t.profit < 0);

    const winrate = (winners.length / trades.length) * 100;
    const grossProfit = winners.reduce((s, t) => s + t.profit, 0);
    const grossLoss = Math.abs(losers.reduce((s, t) => s + t.profit, 0));
    const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? 99.99 : 0) : grossProfit / grossLoss;
    const sumProfit = trades.reduce((s, t) => s + t.profit, 0);
    const expectancy = sumProfit / trades.length;

    const equityCurve = buildEquityCurve(trades);
    const maxDrawdown = calcMaxDrawdownFromCurve(equityCurve);
    const { maxDD: maxDDAbs } = calcMaxDrawdownAbs(equityCurve);

    return {
        totalTrades: trades.length,
        winrate: round(winrate, 1),
        profitFactor: round(profitFactor, 2),
        maxDrawdown: round(maxDrawdown, 1),
        maxDrawdownAbs: round(maxDDAbs, 2),
        expectancy: round(expectancy, 2),
        sumProfit: round(sumProfit, 2),
    };
}

// ── Equity + drawdown curves ──────────────────────────────────────────────────

export function buildEquityCurve(trades: Trade[], initialBalance = 0): number[] {
    const curve: number[] = [initialBalance];
    let running = initialBalance;
    for (const t of trades) {
        running += t.profit;
        curve.push(round(running, 2));
    }
    return curve;
}

export function buildDrawdownCurve(equityCurve: number[], baseBalance = 10000): number[] {
    const dd: number[] = [];
    let peak = -Infinity;
    for (const val of equityCurve) {
        // Use a base balance to prevent division by zero or very small numbers
        const currentEquity = val + baseBalance;
        if (currentEquity > peak) peak = currentEquity;
        
        const drawdown = peak <= 0 ? 0 : ((peak - currentEquity) / peak) * 100;
        dd.push(round(drawdown, 2));
    }
    return dd;
}

function calcMaxDrawdownFromCurve(equityCurve: number[]): number {
    const ddCurve = buildDrawdownCurve(equityCurve);
    return Math.max(...ddCurve, 0);
}

export function calcMaxDrawdownAbs(equityCurve: number[]): { maxDD: number; peakIdx: number; troughIdx: number } {
    let maxDD = 0;
    let peak = -Infinity;
    let peakIdx = 0;
    let tPeakIdx = 0;
    let troughIdx = 0;

    equityCurve.forEach((val, i) => {
        if (val > peak) {
            peak = val;
            tPeakIdx = i;
        }
        const dd = peak - val;
        if (dd > maxDD) {
            maxDD = dd;
            peakIdx = tPeakIdx;
            troughIdx = i;
        }
    });

    return { maxDD, peakIdx, troughIdx };
}

// ── Downsampling & Histogram ──────────────────────────────────────────────────

export function downsample(data: number[], maxPoints = 500): number[] {
    if (data.length <= maxPoints || data.length === 0) return data;
    const step = data.length / maxPoints;
    const result: number[] = [];
    for (let i = 0; i < maxPoints; i++) {
        // use Math.round to pick the nearest index
        const idx = Math.min(Math.floor(i * step), data.length - 1);
        result.push(data[idx]);
    }
    // ensure last point is included for accuracy at the end
    result[result.length - 1] = data[data.length - 1];
    return result;
}

export function calcHistogram(profits: number[], bins = 20): { counts: number[]; min: number; max: number } {
    if (profits.length === 0) return { counts: [], min: 0, max: 0 };
    const min = Math.min(...profits);
    const max = Math.max(...profits);
    const range = max - min || 1;
    const binSize = range / bins;

    const counts = new Array(bins).fill(0);
    for (const p of profits) {
        const idx = Math.min(Math.floor((p - min) / binSize), bins - 1);
        counts[idx]++;
    }

    return { counts, min, max };
}

// ── Losing streak ─────────────────────────────────────────────────────────────

export function calcLongestLosingStreak(trades: Trade[]): number {
    let max = 0;
    let current = 0;
    for (const t of trades) {
        if (t.profit < 0) {
            current++;
            max = Math.max(max, current);
        } else {
            current = 0;
        }
    }
    return max;
}

// ── Recommended risk (simplified Kelly) ──────────────────────────────────────

export function calcRecommendedRisk(metrics: BasicMetrics): number {
    const w = metrics.winrate / 100;
    const l = 1 - w;
    if (w === 0 || l === 0) return 1;

    const winners = metrics.profitFactor > 0 ? metrics.profitFactor : 1;
    // Kelly: w - (l / winners)
    const kelly = w - l / winners;
    // Use half-Kelly for conservatism, cap at 5%
    const halfKelly = kelly / 2;
    return round(Math.max(0.5, Math.min(5, halfKelly * 100)), 1);
}

// ── Monte Carlo ───────────────────────────────────────────────────────────────

export function calcMonteCarloSimulation(
    trades: Trade[],
    iterations = 1000,
    initialBalance = 10000
): MonteCarloResult {
    if (trades.length === 0) {
        return {
            iterations,
            worstCase: 0,
            averageCase: 0,
            bestCase: 0,
            riskOfRuin: 100,
            drawdownAt5Pct: 100,
            simulations: [],
        };
    }

    const profits = trades.map((t) => t.profit);
    const finalEquities: number[] = [];
    const maxDrawdowns: number[] = [];
    const simulations: number[][] = [];
    let ruinCount = 0;

    for (let i = 0; i < iterations; i++) {
        // Sample WITH REPLACEMENT so that final equities vary and statistical bounds work.
        // A simple Fisher-Yates array permutation keeps the final sum constant.
        const shuffled: number[] = [];
        for (let j = 0; j < profits.length; j++) {
            shuffled.push(profits[Math.floor(Math.random() * profits.length)]);
        }

        let equity = initialBalance;
        let peak = equity;
        let maxDD = 0;
        let ruined = false;

        const saveCurve = i < 100; // Only collect 100 paths for visualization
        const curve: number[] = [];
        if (saveCurve) curve.push(equity);

        for (const p of shuffled) {
            equity += p;
            if (saveCurve) curve.push(equity);

            if (equity > peak) peak = equity;
            const dd = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
            if (dd > maxDD) maxDD = dd;
            if (equity <= 0) {
                ruined = true;
                break;
            }
        }

        finalEquities.push(ruined ? 0 : equity);
        maxDrawdowns.push(maxDD);
        if (ruined || equity <= 0) ruinCount++;
        if (saveCurve) simulations.push(curve);
    }

    finalEquities.sort((a, b) => a - b);
    maxDrawdowns.sort((a, b) => a - b);

    const p5 = Math.floor(iterations * 0.05);
    const p50 = Math.floor(iterations * 0.5);
    const p95 = Math.floor(iterations * 0.95);

    return {
        iterations,
        worstCase: round(finalEquities[p5] - initialBalance, 2),
        averageCase: round(finalEquities[p50] - initialBalance, 2),
        bestCase: round(finalEquities[p95] - initialBalance, 2),
        riskOfRuin: round((ruinCount / iterations) * 100, 1),
        drawdownAt5Pct: round(maxDrawdowns[p95], 1), // worst 5% drawdown
        simulations,
    };
}

// ── Full metrics ──────────────────────────────────────────────────────────────

export function calcFullMetrics(trades: Trade[]): FullMetrics {
    const basic = calcBasicMetrics(trades);
    const rawEquity = buildEquityCurve(trades);
    const rawDrawdown = buildDrawdownCurve(rawEquity);

    const equityCurve = downsample(rawEquity, 500);
    const drawdownCurve = downsample(rawDrawdown, 500);

    const profits = trades.map((t) => t.profit);
    const histogramData = calcHistogram(profits, 20);

    const longestLosingStreak = calcLongestLosingStreak(trades);
    const recommendedRiskPct = calcRecommendedRisk(basic);
    const monteCarlo = calcMonteCarloSimulation(trades, 1000);
    const timeAnalysis = calcTimeAnalysis(trades);
    const riskAnalysis = calcRiskMetrics(basic, rawDrawdown);
    const stabilityAnalysis = calcStabilityAnalysis(trades);
    const stabilityScore = calcStabilityScore(stabilityAnalysis);

    return {
        ...basic,
        equityCurve,
        drawdownCurve,
        tradeHistogram: histogramData.counts,
        minProfit: histogramData.min,
        maxProfit: histogramData.max,
        longestLosingStreak,
        recommendedRiskPct,
        riskOfRuin: calcProbabilisticRiskOfRuin(basic),
        monteCarlo,
        timeAnalysis,
        riskAnalysis,
        stabilityAnalysis,
        stabilityScore,
        evolution: {
            last100: trades.length >= 100 ? calcBasicMetrics(trades.slice(-100)) : undefined,
            last50: trades.length >= 50 ? calcBasicMetrics(trades.slice(-50)) : undefined,
            last30: trades.length >= 30 ? calcBasicMetrics(trades.slice(-30)) : undefined,
        }
    };
}

export function calcProbabilisticRiskOfRuin(metrics: BasicMetrics, capitalUnits = 10): number {
    const { winrate, expectancy } = metrics;
    // Formula: RiskOfRuin ≈ ((1 - Edge) / (1 + Edge)) ^ CapitalUnits
    // Normalize edge to a decimal representation based on winrate/expectancy
    // For simplicity, let's use the provided logic or a robust variant if edge is small.
    const w = winrate / 100;
    const l = 1 - w;
    // Normalized edge relative to average size
    const edge = expectancy > 0 ? (w - l) : 0; 
    
    if (edge <= 0) return 100;
    if (edge >= 1) return 0.1;

    const r = ((1 - edge) / (1 + edge));
    const prob = Math.pow(r, capitalUnits) * 100;
    return round(Math.max(0.1, Math.min(100, prob)), 1);
}

export function calcStabilityAnalysis(trades: Trade[]): StabilityAnalysis {
    if (trades.length < 4) {
        return {
            segments: [],
            interpretation: "Estable"
        };
    }

    const segmentSize = Math.floor(trades.length / 4);
    const segments = [];

    for (let i = 0; i < 4; i++) {
        const start = i * segmentSize;
        const end = (i === 3) ? trades.length : (i + 1) * segmentSize;
        const segmentTrades = trades.slice(start, end);
        const stats = calcBasicMetrics(segmentTrades);
        
        segments.push({
            segment: `${i * 25 + 1}-${(i + 1) * 25}%`,
            profitFactor: stats.profitFactor,
            winrate: stats.winrate,
            netProfit: stats.sumProfit
        });
    }

    // Simple interpretation based on Net Profit trend
    const firstHalf = segments[0].netProfit + segments[1].netProfit;
    const secondHalf = segments[2].netProfit + segments[3].netProfit;
    
    let interpretation: "Estable" | "Degradando" | "Mejorando" = "Estable";
    if (secondHalf < firstHalf * 0.7) interpretation = "Degradando";
    else if (secondHalf > firstHalf * 1.3) interpretation = "Mejorando";

    return { segments, interpretation };
}

export function calcStabilityScore(analysis: StabilityAnalysis): number {
    if (analysis.segments.length < 4) return 0;

    const pfs = analysis.segments.map(s => s.profitFactor);
    const mean = pfs.reduce((a, b) => a + b, 0) / pfs.length;
    const variance = pfs.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / pfs.length;
    
    // Convert variance to 0-100 score. Low variance (stable PF) -> 100.
    // PF variance usually is small, e.g. 0.1 to 1.0. 
    // Let's say variance 0 is 100, variance 0.5 is 50, variance 1+ is 0.
    const score = Math.max(0, 100 - (variance * 100));
    return Math.round(score);
}

export function calcTimeAnalysis(trades: Trade[]): TimeAnalysis {
    const byWeekday = new Array(7).fill(0);
    const byHour = new Array(24).fill(0);
    let asian = 0, london = 0, ny = 0;

    for (const t of trades) {
        const d = t.datetime;
        byWeekday[d.getUTCDay()] += t.profit;
        const hour = d.getUTCHours();
        byHour[hour] += t.profit;

        // Simplified sessions (UTC)
        // Asian: 00:00 - 08:00
        // London: 08:00 - 16:00
        // NY: 13:00 - 21:00 (overlap with London)
        if (hour >= 0 && hour < 8) asian += t.profit;
        if (hour >= 8 && hour < 16) london += t.profit;
        if (hour >= 13 && hour < 21) ny += t.profit;
    }

    return {
        byWeekday: byWeekday.map(v => round(v, 2)),
        byHour: byHour.map(v => round(v, 2)),
        bySession: {
            asian: round(asian, 2),
            london: round(london, 2),
            ny: round(ny, 2)
        }
    };
}

export function calcRiskMetrics(basic: BasicMetrics & { maxDrawdownAbs?: number }, ddCurve: number[]): RiskMetrics {
    const sumDD = ddCurve.reduce((s, v) => s + v, 0);
    const avgDrawdown = ddCurve.length > 0 ? sumDD / ddCurve.length : 0;
    
    // Recovery Factor = Net Profit / Max Drawdown (Absolute)
    const maxDDAbs = basic.maxDrawdownAbs || 1;
    const recoveryFactor = basic.sumProfit / maxDDAbs;
    
    return {
        maxDrawdown: basic.maxDrawdown,
        avgDrawdown: round(avgDrawdown, 2),
        recoveryFactor: round(Math.max(0, recoveryFactor), 2),
        profitToDrawdown: round(Math.max(0, recoveryFactor), 2),
    };
}

// ── Prop firm simulation ──────────────────────────────────────────────────────

export function calcPropFirmChallenge(
    trades: Trade[],
    params: PropFirmParams,
    iterations = 1000
): PropFirmResult {
    const { balance, targetPct, dailyDrawdownPct, maxDrawdownPct } = params;
    const profits = trades.map((t) => t.profit);
    const targetGain = balance * (targetPct / 100);
    const dailyDDLimit = balance * (dailyDrawdownPct / 100);
    const maxDDLimit = balance * (maxDrawdownPct / 100);

    let passCount = 0;
    let failDailyDD = 0;
    let failMaxDD = 0;
    let totalTradesNeeded = 0;
    let simCount = 0;

    for (let i = 0; i < iterations; i++) {
        const shuffled = [...profits];
        for (let j = shuffled.length - 1; j > 0; j--) {
            const k = Math.floor(Math.random() * (j + 1));
            [shuffled[j], shuffled[k]] = [shuffled[k], shuffled[j]];
        }

        let equity = balance;
        const dayStart = balance;
        let peakEquity = balance;
        let passed = false;
        let failedDD = false;
        let failedMaxDD = false;
        let tradesUsed = 0;

        for (const p of shuffled) {
            equity += p;
            tradesUsed++;

            // Daily DD check (simplified: relative to starting balance)
            const dailyLoss = dayStart - equity;
            if (dailyLoss >= dailyDDLimit) {
                failedDD = true;
                break;
            }

            // Max DD check (from peak)
            if (equity > peakEquity) peakEquity = equity;
            const maxLoss = peakEquity - equity;
            if (maxLoss >= maxDDLimit) {
                failedMaxDD = true;
                break;
            }

            // Target reached
            if (equity - balance >= targetGain) {
                passed = true;
                break;
            }
        }

        if (passed) {
            passCount++;
            totalTradesNeeded += tradesUsed;
            simCount++;
        } else if (failedDD) {
            failDailyDD++;
        } else if (failedMaxDD) {
            failMaxDD++;
        }
    }

    return {
        passProb: round((passCount / iterations) * 100, 1),
        failDailyDDProb: round((failDailyDD / iterations) * 100, 1),
        failMaxDDProb: round((failMaxDD / iterations) * 100, 1),
        expectedTrades: simCount > 0 ? Math.round(totalTradesNeeded / simCount) : trades.length,
    };
}

// ── Utility ───────────────────────────────────────────────────────────────────

function round(n: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(n * factor) / factor;
}

/** Interpret basic metrics to generate a plain-text signal label */
export function interpretEdge(metrics: BasicMetrics): {
    label: string;
    color: "green" | "yellow" | "red";
} {
    const { winrate, profitFactor, totalTrades } = metrics;
    if (totalTrades < 20) {
        return { label: "Muestra insuficiente (menos de 20 trades).", color: "yellow" };
    }
    if (profitFactor >= 1.5 && winrate >= 45) {
        return { label: "Tu estrategia muestra señales claras de edge estadístico.", color: "green" };
    }
    if (profitFactor >= 1.1) {
        return { label: "Tu estrategia muestra señales iniciales de edge.", color: "yellow" };
    }
    return {
        label: "No se detectó edge estadístico en esta muestra. Revisá tu estrategia.",
        color: "red",
    };
}
