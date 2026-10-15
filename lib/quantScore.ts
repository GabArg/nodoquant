// Quant Score System — composite strategy quality metric
// Combines Edge Score, Robustness, Health, and Evolution into a single 0–10 score.

import { calcEdgeScore } from "./edgeScore";

// ── Health Score (0–10) — single dataset diagnostic ──
export function calcHealthScore(
    wr: number,
    pf: number | null,
    dd: number | null,
    trades: number,
    edge: number
): number {
    // Edge Strength: 0–10
    const es = edge >= 8 ? 10 : edge >= 6 ? 7 : edge >= 4 ? 4 : 1;
    // Sample Size: 0–10
    const ss = trades >= 300 ? 10 : trades >= 100 ? 7 : trades >= 50 ? 4 : 1;
    // Drawdown Risk: 0–10 (lower DD = better).
    // Neutral score 6 if drawdown is null (capital not provided/unknown)
    const dr = dd === null ? 6 : (dd < 20 ? 10 : dd <= 35 ? 7 : dd <= 50 ? 4 : 1);
    // Profit Quality: 0–10
    // When pf is null: if wr > 0 (100% win rate / zero losses), 10; if wr === 0 (zero wins), 1
    const pq = pf === null ? (wr > 0 ? 10 : 1) : (pf >= 2.5 ? 10 : pf >= 2.0 ? 8 : pf >= 1.5 ? 5 : pf >= 1.2 ? 2 : 1);
    // Automation Suitability: 0–10
    const isPfStrong = pf === null ? wr > 0 : pf >= 1.8;
    const isPfMedium = pf === null ? wr > 0 : pf >= 1.4;
    const isDdSafe = dd === null || dd < 50;
    const auto = (isPfStrong && trades >= 80 && isDdSafe) ? 10
        : (isPfMedium && trades >= 50) ? 6 : 2;

    return (es + ss + dr + pq + auto) / 5;
}

// ── Robustness Score (0–10) — cross-dataset consistency ──
export function calcRobustnessScore(datasets: {
    trades_count: number;
    winrate: number;
    profit_factor: number | null;
    max_drawdown: number | null;
    edge: number;
}[]): number {
    const n = datasets.length;
    if (n < 2) return 0;

    const validPFs = datasets
        .map((d) => (d.profit_factor != null && Number.isFinite(Number(d.profit_factor)) ? Number(d.profit_factor) : null))
        .filter((v): v is number => v !== null);
    const validDDs = datasets
        .map((d) => (d.max_drawdown != null && Number.isFinite(Number(d.max_drawdown)) ? Number(d.max_drawdown) : null))
        .filter((v): v is number => v !== null);
    const edges = datasets.map((d) => d.edge);

    const dcScore = n >= 4 ? 10 : n === 3 ? 7 : n === 2 ? 4 : 1;

    let pfScore = 6; // default neutral if no finite PFs
    if (validPFs.length > 0) {
        const avgPF = validPFs.reduce((a, b) => a + b, 0) / validPFs.length;
        const pfVar = avgPF > 0 ? (Math.max(...validPFs) - Math.min(...validPFs)) / avgPF : 999;
        pfScore = pfVar < 0.3 ? 10 : pfVar <= 0.6 ? 6 : 2;
    }

    const edgeRatio = edges.filter((e) => e >= 5).length / n;
    const ecScore = edgeRatio >= 0.75 ? 10 : edgeRatio >= 0.5 ? 6 : 2;

    let ddScore = 6; // default neutral if no finite DDs
    if (validDDs.length > 0) {
        const ddSpread = Math.max(...validDDs) - Math.min(...validDDs);
        ddScore = ddSpread < 15 ? 10 : ddSpread <= 30 ? 6 : 2;
    }

    return Math.min(10, Math.max(0, ecScore * 0.4 + pfScore * 0.3 + ddScore * 0.2 + dcScore * 0.1));
}

// ── Evolution Score (0–10) — temporal trend ──
export function calcEvolutionScore(datasets: {
    created_at: string;
    winrate: number;
    profit_factor: number | null;
    max_drawdown: number | null;
    edge: number;
}[]): number {
    if (datasets.length < 2) return 5; // neutral if insufficient data

    const sorted = [...datasets].sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const mid = Math.floor(sorted.length / 2);
    const first = sorted.slice(0, mid);
    const last = sorted.slice(mid);
    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

    const fe = avg(first.map((d) => d.edge)) ?? 5;
    const le = avg(last.map((d) => d.edge)) ?? 5;

    const fpfArr = first
        .map((d) => (d.profit_factor != null && Number.isFinite(Number(d.profit_factor)) ? Number(d.profit_factor) : null))
        .filter((v): v is number => v !== null);
    const lpfArr = last
        .map((d) => (d.profit_factor != null && Number.isFinite(Number(d.profit_factor)) ? Number(d.profit_factor) : null))
        .filter((v): v is number => v !== null);
    const fpf = avg(fpfArr);
    const lpf = avg(lpfArr);

    const fddArr = first
        .map((d) => (d.max_drawdown != null && Number.isFinite(Number(d.max_drawdown)) ? Number(d.max_drawdown) : null))
        .filter((v): v is number => v !== null);
    const lddArr = last
        .map((d) => (d.max_drawdown != null && Number.isFinite(Number(d.max_drawdown)) ? Number(d.max_drawdown) : null))
        .filter((v): v is number => v !== null);
    const fdd = avg(fddArr);
    const ldd = avg(lddArr);

    const fwr = avg(first.map((d) => Number(d.winrate))) ?? 50;
    const lwr = avg(last.map((d) => Number(d.winrate))) ?? 50;

    // Each trend: improving=10, stable=6, degrading=2
    const edgeT = (le - fe) > 0.5 ? 10 : (le - fe) < -0.5 ? 2 : 6;
    const pfT = (fpf !== null && lpf !== null) ? ((lpf - fpf) > 0.2 ? 10 : (lpf - fpf) < -0.2 ? 2 : 6) : 6;
    const ddT = (fdd !== null && ldd !== null) ? ((ldd - fdd) < -5 ? 10 : (ldd - fdd) > 5 ? 2 : 6) : 6; // lower DD = better
    const wrT = (lwr - fwr) > 3 ? 10 : (lwr - fwr) < -3 ? 2 : 6;

    return (edgeT + pfT + ddT + wrT) / 4;
}

// ── Quant Score (0–10) — composite with penalties ──
export interface QuantScoreResult {
    score: number;
    baseScore: number;
    penalties: {
        lowSample: boolean;
        extremeDrawdown: boolean;
    };
}

export function calcQuantScore(
    edgeScore: number,
    robustnessScore: number,
    healthScore: number,
    evolutionScore: number,
    trades?: number,
    maxDrawdown?: number | null,
): QuantScoreResult {
    // Step 1 — base score
    const baseScore = Math.min(10, Math.max(0,
        edgeScore * 0.4 +
        robustnessScore * 0.3 +
        healthScore * 0.2 +
        evolutionScore * 0.1
    ));

    let score = baseScore;
    const penalties = { lowSample: false, extremeDrawdown: false };

    // Step 2 — sample size penalty
    if (trades !== undefined) {
        if (trades < 50) {
            score *= 0.6;
            penalties.lowSample = true;
        } else if (trades < 100) {
            score *= 0.8;
            penalties.lowSample = true;
        }
    }

    // Step 3 — extreme drawdown penalty
    if (maxDrawdown !== undefined && maxDrawdown !== null && Number.isFinite(maxDrawdown)) {
        if (maxDrawdown > 80) {
            score *= 0.6;
            penalties.extremeDrawdown = true;
        } else if (maxDrawdown > 60) {
            score *= 0.8;
            penalties.extremeDrawdown = true;
        }
    }

    // Step 4 — clamp
    score = Math.min(10, Math.max(0, score));

    return { score, baseScore, penalties };
}

// Simple helper for API/leaderboard where only the number is needed
export function calcQuantScoreSimple(
    edgeScore: number,
    healthScore: number,
    trades: number,
    maxDrawdown: number | null,
): number {
    let quant = Math.min(10, Math.max(0, edgeScore * 0.6 + healthScore * 0.4));
    if (trades < 50) quant *= 0.6;
    else if (trades < 100) quant *= 0.8;
    if (maxDrawdown !== null && Number.isFinite(maxDrawdown)) {
        if (maxDrawdown > 80) quant *= 0.6;
        else if (maxDrawdown > 60) quant *= 0.8;
    }
    return Math.min(10, Math.max(0, quant));
}

export function quantScoreLabel(s: number): string {
    if (s >= 8) return "Elite Strategy";
    if (s >= 7) return "Robust Strategy";
    if (s >= 6) return "Promising Strategy";
    if (s >= 4) return "Weak Edge";
    return "No Edge";
}

export function quantScoreColor(s: number): string {
    if (s >= 8) return "#34d399";
    if (s >= 7) return "#818cf8";
    if (s >= 6) return "#fbbf24";
    if (s >= 4) return "#fb923c";
    return "#f87171";
}
