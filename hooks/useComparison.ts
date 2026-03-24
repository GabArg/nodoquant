"use client";

import { useState, useEffect, useCallback } from "react";
import type { BasicMetrics, FullMetrics } from "@/lib/analyzer/metrics";
import type { Trade } from "@/lib/analyzer/parser";

export interface ComparisonStrategy {
    id: string;
    name: string;
    timestamp: number;
    metrics: BasicMetrics;
    fullMetrics: FullMetrics;
    trades: Trade[];
}

export function useComparison(isPro: boolean = false) {
    const [comparisonList, setComparisonList] = useState<ComparisonStrategy[]>([]);
    const [isHydrated, setIsHydrated] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("nodoquant_comparison_v1");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Hydrate dates in trades
                const hydrated = parsed.map((strat: any) => ({
                    ...strat,
                    trades: strat.trades.map((t: any) => ({
                        ...t,
                        open_time: t.open_time ? new Date(t.open_time) : undefined,
                        close_time: t.close_time ? new Date(t.close_time) : undefined,
                        datetime: new Date(t.datetime)
                    }))
                }));
                setComparisonList(hydrated);
            } catch (e) {
                console.error("Failed to load comparison list", e);
            }
        }
        setIsHydrated(true);
    }, []);

    // Save to localStorage
    useEffect(() => {
        if (!isHydrated) return;
        localStorage.setItem("nodoquant_comparison_v1", JSON.stringify(comparisonList));
    }, [comparisonList, isHydrated]);

    const addToComparison = useCallback((strategy: Omit<ComparisonStrategy, "id" | "timestamp">) => {
        setComparisonList(prev => {
            // Limit: 3 for Pro/Trial, 1 for Free
            const limit = isPro ? 3 : 1;
            if (prev.length >= limit) return prev;
            
            // Check if already exists (by name or some heuristic if name is same)
            if (prev.find(s => s.name === strategy.name)) return prev;

            const newItem: ComparisonStrategy = {
                ...strategy,
                id: crypto.randomUUID(),
                timestamp: Date.now()
            };
            return [...prev, newItem];
        });
    }, []);

    const removeFromComparison = useCallback((id: string) => {
        setComparisonList(prev => prev.filter(s => s.id !== id));
    }, []);

    const clearComparison = useCallback(() => {
        setComparisonList([]);
    }, []);

    return {
        comparisonList,
        addToComparison,
        removeFromComparison,
        clearComparison,
        isFull: comparisonList.length >= (isPro ? 3 : 1)
    };
}
