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
    advanced?: AdvancedRobustness;
    propFirm?: PropFirmResult;
    edgeDecay?: EdgeDecay;
    rHistogram?: { counts: number[]; min: number; max: number };
}

export interface EdgeDecay {
    score: number; // 0-100 (100 is healthy)
    signal: "stable" | "caution" | "warning";
    recentSQN: number;
    baselineSQN: number;
}

export type DiagnosisVerdict = "insufficientSample" | "noEdge" | "strongEdge" | "weakEdge" | "unstableEdge";
 
export interface AdvancedRobustness {
    sqn: number;
    sqnLevel: "poor" | "below" | "good" | "excellent" | "elite";
    zScore: number;
    zLevel: "random" | "mild" | "strong";
    edgeConfidence: number;
    robustnessLevel: "fragile" | "moderate" | "robust" | "elite";
    expertTips: string[];
    verdict: DiagnosisVerdict;
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
    sharpeRatio: number;
    skewness: number;
}

export interface MonteCarloResult {
    iterations: number;
    worstCase: number; // final equity at 5th percentile
    averageCase: number; // median
    bestCase: number; // 95th percentile
    riskOfRuin: number; // % of sims that went to 0 or below
    drawdownAt5Pct: number; // max drawdown at 5th percentile
    simulations: number[][]; // the actual equity paths for rendering
    percentilePaths: {
        p5: number[];
        p25: number[];
        p50: number[];
        p75: number[];
        p95: number[];
    };
    horizon: number;
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
    consistencyScore: number; // 0-100 (inverse of profit concentration)
    passTier: "not_ready" | "borderline" | "good" | "strong";
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
            percentilePaths: { p5: [], p25: [], p50: [], p75: [], p95: [] },
            horizon: 0
        };
    }

    const profits = trades.map((t) => t.profit);
    const h = Math.min(200, profits.length);
    
    const finalEquities: number[] = [];
    const maxDrawdowns: number[] = [];
    const simulations: number[][] = [];
    const allPathsForPercentiles: number[][] = [];
    let ruinCount = 0;

    for (let i = 0; i < iterations; i++) {
        const shuffled: number[] = [];
        for (let j = 0; j < h; j++) {
            shuffled.push(profits[Math.floor(Math.random() * profits.length)]);
        }

        let equity = initialBalance;
        let peak = equity;
        let maxDD = 0;
        let ruined = false;
        const curve: number[] = [equity];

        for (const p of shuffled) {
            equity += p;
            curve.push(equity);

            if (equity > peak) peak = equity;
            const dd = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
            if (dd > maxDD) maxDD = dd;
            if (equity <= 0) {
                ruined = true;
                break;
            }
        }

        // Pad curve if ruined
        if (ruined) {
            while (curve.length <= h) curve.push(0);
        }

        finalEquities.push(ruined ? 0 : equity);
        maxDrawdowns.push(maxDD);
        if (ruined || equity <= 0) ruinCount++;
        if (i < 50) simulations.push(curve); // Visual sample
        allPathsForPercentiles.push(curve);
    }

    finalEquities.sort((a, b) => a - b);
    maxDrawdowns.sort((a, b) => a - b);

    const p5Idx = Math.floor(iterations * 0.05);
    const p25Idx = Math.floor(iterations * 0.25);
    const p50Idx = Math.floor(iterations * 0.5);
    const p75Idx = Math.floor(iterations * 0.75);
    const p95Idx = Math.floor(iterations * 0.95);

    // Compute percentile paths
    const p5: number[] = [];
    const p25: number[] = [];
    const p50: number[] = [];
    const p75: number[] = [];
    const p95: number[] = [];

    for (let t = 0; t <= h; t++) {
        const stepValues = allPathsForPercentiles.map(path => path[t]).sort((a, b) => a - b);
        p5.push(round(stepValues[p5Idx], 2));
        p25.push(round(stepValues[p25Idx], 2));
        p50.push(round(stepValues[p50Idx], 2));
        p75.push(round(stepValues[p75Idx], 2));
        p95.push(round(stepValues[p95Idx], 2));
    }

    return {
        iterations,
        worstCase: round(finalEquities[p5Idx] - initialBalance, 2),
        averageCase: round(finalEquities[p50Idx] - initialBalance, 2),
        bestCase: round(finalEquities[p95Idx] - initialBalance, 2),
        riskOfRuin: round((ruinCount / iterations) * 100, 1),
        drawdownAt5Pct: round(maxDrawdowns[p95Idx], 1),
        simulations,
        percentilePaths: { p5, p25, p50, p75, p95 },
        horizon: h
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
        riskAnalysis: calcRiskMetrics(basic, trades, rawDrawdown),
        stabilityAnalysis,
        stabilityScore,
        evolution: {
            last100: trades.length >= 100 ? calcBasicMetrics(trades.slice(-100)) : undefined,
            last50: trades.length >= 50 ? calcBasicMetrics(trades.slice(-50)) : undefined,
            last30: trades.length >= 30 ? calcBasicMetrics(trades.slice(-30)) : undefined,
        },
        advanced: calcAdvancedRobustness(trades, basic, monteCarlo),
        propFirm: calcPropFirmChallenge(trades, {
            balance: 100000,
            targetPct: 10,
            dailyDrawdownPct: 5,
            maxDrawdownPct: 10
        }),
        edgeDecay: calcEdgeDecay(trades),
        rHistogram: calcRHistogram(trades)
    };
}

export function calcEdgeDecay(trades: Trade[]): EdgeDecay | undefined {
    if (trades.length < 100) return undefined; // Need at least some history for rolling check

    const recentWindow = 50;
    const baselineWindow = 150;
    
    const recentTrades = trades.slice(-recentWindow);
    const baselineTrades = trades.slice(-(recentWindow + baselineWindow), -recentWindow);
    
    if (baselineTrades.length < 50) return undefined;

    const recent = calcBasicMetrics(recentTrades);
    const baseline = calcBasicMetrics(baselineTrades);

    // Calculate SQN for both
    const calcSQN = (b: BasicMetrics, ts: Trade[]) => {
        const stdDev = Math.sqrt(ts.reduce((s, t) => s + Math.pow(t.profit - b.expectancy, 2), 0) / ts.length) || 1;
        return (b.expectancy / stdDev) * Math.sqrt(ts.length);
    };

    const sqnRecent = calcSQN(recent, recentTrades);
    const sqnBaseline = calcSQN(baseline, baselineTrades);

    let score = 100;
    if (sqnBaseline > 0) {
        const ratio = sqnRecent / sqnBaseline;
        score = Math.min(100, Math.max(0, ratio * 100));
    }

    let signal: EdgeDecay["signal"] = "stable";
    if (score < 40) signal = "warning";
    else if (score < 70) signal = "caution";

    return {
        score: Math.round(score),
        signal,
        recentSQN: round(sqnRecent, 2),
        baselineSQN: round(sqnBaseline, 2)
    };
}

export function calcRHistogram(trades: Trade[], bins = 20): { counts: number[]; min: number; max: number } | undefined {
    if (trades.length < 10) return undefined;
    
    // Calculate R-values
    const avgLoss = Math.abs(trades.filter(t => t.profit < 0).reduce((s, t) => s + t.profit, 0) / (trades.filter(t => t.profit < 0).length || 1));
    const rValues = trades.map(t => t.profit / (avgLoss || 1));

    return calcHistogram(rValues, bins);
}

export function calcAdvancedRobustness(trades: Trade[], basic: BasicMetrics, mc: MonteCarloResult): AdvancedRobustness {
    const profits = trades.map(t => t.profit);
    const n = trades.length;
    
    // 1. SQN = (Expectancy / StdDev) * sqrt(N)
    // Refinement: SQN is highly sensitive to outlier trades. We use a normalized stdDev.
    const avg = basic.expectancy;
    const stdDev = n > 1 
        ? Math.sqrt(profits.reduce((s, p) => s + Math.pow(p - avg, 2), 0) / (n - 1))
        : 1;
    const sqn = stdDev === 0 ? 0 : (avg / stdDev) * Math.sqrt(n);
    
    let sqnLevel: AdvancedRobustness["sqnLevel"] = "poor";
    if (sqn >= 7) sqnLevel = "elite";
    else if (sqn >= 5) sqnLevel = "excellent";
    else if (sqn >= 3) sqnLevel = "good";
    else if (sqn >= 1.6) sqnLevel = "below";

    // 2. Z-Score (Trade sequence dependency)
    // Formula: Z = (N*(R - 0.5) - X) / sqrt((X*(X - N)) / (N - 1))
    // Interpret: > 2.0 (clustering/dependency), < -2.0 (alternating/randomness)
    const winners = profits.map(p => p > 0);
    let runs = profits.length > 0 ? 1 : 0;
    for (let i = 1; i < winners.length; i++) {
        if (winners[i] !== winners[i - 1]) runs++;
    }
    
    const W = profits.filter(p => p > 0).length;
    const L = n - W;
    const X = 2 * W * L;
    let zScore = 0;
    if (n > 1 && X > 0 && n !== X) {
        const numerator = n * (runs - 0.5) - X;
        const denominator = Math.sqrt((X * (X - n)) / (n - 1));
        zScore = denominator === 0 ? 0 : numerator / denominator;
    }

    let zLevel: AdvancedRobustness["zLevel"] = "random";
    const absZ = Math.abs(zScore);
    if (absZ > 2) zLevel = "strong";
    else if (absZ >= 1) zLevel = "mild";

    // 3. Edge Confidence (0-100 composite)
    // Components: SQN (40%), PF (25%), MC Stability (15%), Sample Size (10%), Risk of Ruin (10%)
    // Non-linear mapping for SQN and PF to be more punitive
    const sqnScore = Math.min(100, Math.pow(Math.max(0, sqn / 4), 1.5) * 100);
    const pfScore = Math.min(100, Math.pow(Math.max(0, (basic.profitFactor - 1) / 1.5), 1.2) * 100);
    const mcScore = Math.max(0, 100 - (mc.drawdownAt5Pct > 0 ? (mc.drawdownAt5Pct / 40) * 100 : 0));
    const sampleScore = Math.min(100, (n / 100) * 100);
    const rorScore = Math.max(0, 100 - (mc.riskOfRuin * 3));

    let edgeConfidence = (sqnScore * 0.4) + (pfScore * 0.25) + (mcScore * 0.15) + (sampleScore * 0.1) + (rorScore * 0.1);
    
    // Martingale / Skewness Penalty
    // Calculate ratio of largest loss to average win
    const maxLoss = Math.abs(Math.min(...profits, 0));
    const avgWin = basic.sumProfit > 0 ? (basic.sumProfit / (profits.filter(p => p > 0).length || 1)) : 1;
    if (maxLoss > avgWin * 15) {
        edgeConfidence *= 0.6; // High penalty for extreme outliers (Martingale sign)
    }

    // Penalty for small samples
    if (n < 30) edgeConfidence *= 0.4;
    else if (n < 50) edgeConfidence *= 0.8;

    edgeConfidence = Math.min(100, Math.max(0, edgeConfidence));

    // 4. Robustness Level
    let robustnessLevel: AdvancedRobustness["robustnessLevel"] = "fragile";
    if (n >= 30) {
        if (edgeConfidence >= 75 && sqn >= 2.5) robustnessLevel = "elite";
        else if (edgeConfidence >= 55 && sqn >= 1.8) robustnessLevel = "robust";
        else if (edgeConfidence >= 35 && sqn >= 1.2) robustnessLevel = "moderate";
    }

    // 5. Expert Tips Logic
    const expertTips: string[] = [];
    if (absZ > 2) expertTips.push("tipZScoreHigh");
    if (sqn < 2 && n >= 30) expertTips.push("tipSQNLow");
    if (mc.drawdownAt5Pct > basic.maxDrawdown * 2) expertTips.push("tipMCDDHigh");
    if (n < 50) expertTips.push("tipSampleSizeLow");

    // 6. Diagnosis Verdict Logic (Hierarchical)
    let verdict: DiagnosisVerdict = "unstableEdge";

    if (n < 30) {
        verdict = "insufficientSample";
    } else if (basic.profitFactor < 1 || edgeConfidence < 40 || basic.expectancy <= 0) {
        verdict = "noEdge";
    } else if (edgeConfidence >= 75 && basic.profitFactor >= 1.3 && n >= 100) {
        verdict = "strongEdge";
    } else if (edgeConfidence >= 55 && basic.profitFactor >= 1.1 && n >= 50) {
        verdict = "weakEdge";
    }

    return {
        sqn: round(sqn, 2),
        sqnLevel,
        zScore: round(zScore, 2),
        zLevel,
        edgeConfidence: Math.round(edgeConfidence),
        robustnessLevel,
        expertTips,
        verdict
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

export function calcRiskMetrics(basic: BasicMetrics & { maxDrawdownAbs?: number }, trades: Trade[], ddCurve: number[]): RiskMetrics {
    const sumDD = ddCurve.reduce((s, v) => s + v, 0);
    const avgDrawdown = ddCurve.length > 0 ? sumDD / ddCurve.length : 0;
    
    // Recovery Factor = Net Profit / Max Drawdown (Absolute)
    const maxDDAbs = basic.maxDrawdownAbs || 1;
    const recoveryFactor = basic.sumProfit / maxDDAbs;

    // Trade-based Sharpe Ratio = Expectancy / StdDev
    const profits = trades.map(t => t.profit);
    const avg = basic.expectancy;
    const n = trades.length;
    const stdDev = n > 1 
        ? Math.sqrt(profits.reduce((s, p) => s + Math.pow(p - avg, 2), 0) / (n - 1))
        : 1;
    const sharpeRatio = stdDev === 0 ? 0 : avg / stdDev;

    // Skewness
    const skewness = calcSkewness(profits, avg, stdDev);
    
    return {
        maxDrawdown: basic.maxDrawdown,
        avgDrawdown: round(avgDrawdown, 2),
        recoveryFactor: round(Math.max(0, recoveryFactor), 2),
        profitToDrawdown: round(Math.max(0, recoveryFactor), 2),
        sharpeRatio: round(sharpeRatio, 2),
        skewness: round(skewness, 2),
    };
}

export function calcSkewness(values: number[], mean: number, stdDev: number): number {
    const n = values.length;
    if (n < 3 || stdDev === 0) return 0;
    
    const sumCubicDeviations = values.reduce((s, v) => s + Math.pow(v - mean, 3), 0);
    const skewness = (n / ((n - 1) * (n - 2))) * (sumCubicDeviations / Math.pow(stdDev, 3));
    return skewness;
}

// ── Prop firm simulation ──────────────────────────────────────────────────────

export function calcPropFirmChallenge(
    trades: Trade[],
    params: PropFirmParams,
    iterations = 1000
): PropFirmResult {
    const { targetPct, dailyDrawdownPct, maxDrawdownPct } = params;
    
    // R-based distribution: use risk_reward if available, otherwise normalize profit to "risk units"
    // If no risk_reward, we assume a standard 1% risk per trade logic to simulate the edge.
    const rValues = trades.map(t => {
        if (t.risk_reward != null) return t.risk_reward;
        // Fallback: If no RR data, we can't truly know R. We normalize profit relative to average loss to estimate R.
        return t.profit; 
    });

    const avgLoss = Math.abs(rValues.filter(v => v < 0).reduce((s, v) => s + v, 0) / (rValues.filter(v => v < 0).length || 1));
    const normalizedR = rValues.map(v => v / (avgLoss || 1));

    let passCount = 0;
    let failDailyDD = 0;
    let failMaxDD = 0;
    let totalTradesNeeded = 0;
    let simCount = 0;

    for (let i = 0; i < iterations; i++) {
        const shuffled = [...normalizedR];
        for (let j = shuffled.length - 1; j > 0; j--) {
            const k = Math.floor(Math.random() * (j + 1));
            [shuffled[j], shuffled[k]] = [shuffled[k], shuffled[j]];
        }

        let equity = 100; // Start at 100%
        let peakEquity = 100;
        let dayStartEquity = 100;
        let dailyPeakEquity = 100;
        
        let passed = false;
        let failedDaily = false;
        let failedMax = false;
        let tradesUsed = 0;
        
        // Simulation parameters assuming 1% risk per 1R
        const riskPerR = 1.0; 

        for (const r of shuffled) {
            const pPct = r * riskPerR;
            equity += pPct;
            tradesUsed++;

            if (equity > peakEquity) peakEquity = equity;
            if (equity > dailyPeakEquity) dailyPeakEquity = equity;

            // Daily DD check (from intraday peak)
            const dailyLoss = dailyPeakEquity - equity;
            if (dailyLoss >= dailyDrawdownPct) {
                failedDaily = true;
                break;
            }

            // Max DD check (from absolute peak)
            const maxLoss = peakEquity - equity;
            if (maxLoss >= maxDrawdownPct) {
                failedMax = true;
                break;
            }

            // Target reached
            if (equity - 100 >= targetPct) {
                passed = true;
                break;
            }
            
            // Note: In real prop firms, daily resets happen at midnight. 
            // Here we simplify by treating every 5 trades as a "day" if we don't have time data,
            // or just using the intraday peak logic continuously for simplicity in Monte Carlo.
        }

        if (passed) {
            passCount++;
            totalTradesNeeded += tradesUsed;
            simCount++;
        } else if (failedDaily) {
            failDailyDD++;
        } else if (failedMax) {
            failMaxDD++;
        }
    }

    const passProb = (passCount / iterations) * 100;
    let passTier: PropFirmResult["passTier"] = "not_ready";
    if (passProb >= 70) passTier = "strong";
    else if (passProb >= 50) passTier = "good";
    else if (passProb >= 30) passTier = "borderline";

    // Consistency Score
    const sortedProfits = [...normalizedR].sort((a, b) => b - a);
    const topCount = Math.max(1, Math.ceil(normalizedR.length * 0.1));
    const topSum = sortedProfits.slice(0, topCount).reduce((s, v) => s + Math.max(0, v), 0);
    const totalPositiveSum = normalizedR.reduce((s, v) => s + Math.max(0, v), 0);
    const concentration = totalPositiveSum > 0 ? (topSum / totalPositiveSum) * 100 : 0;
    const consistencyScore = Math.max(0, 100 - (concentration > 50 ? (concentration - 50) * 2 : 0));

    return {
        passProb: round(passProb, 1),
        failDailyDDProb: round((failDailyDD / iterations) * 100, 1),
        failMaxDDProb: round((failMaxDD / iterations) * 100, 1),
        expectedTrades: simCount > 0 ? Math.round(totalTradesNeeded / simCount) : trades.length,
        consistencyScore: Math.round(consistencyScore),
        passTier
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
