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

type SerializedTrade = Omit<
    Trade,
    "datetime" | "entry_time" | "exit_time" | "open_time"
> & {
    datetime: string | Date;
    entry_time?: string | Date;
    exit_time?: string | Date;
    open_time?: string | Date;
    close_time?: string | Date;
};

type SerializedComparisonStrategy = Omit<ComparisonStrategy, "trades"> & {
    trades: SerializedTrade[];
};

function hydrateTrade(trade: SerializedTrade): Trade {
    return {
        ...trade,
        entry_time: trade.entry_time
            ? new Date(trade.entry_time)
            : undefined,
        exit_time: trade.exit_time
            ? new Date(trade.exit_time)
            : undefined,
        open_time: trade.open_time
            ? new Date(trade.open_time)
            : undefined,
        datetime: new Date(trade.datetime),
    };
}

export function useComparison(isPro: boolean = false) {
    const [comparisonList, setComparisonList] = useState<
        ComparisonStrategy[]
    >([]);
    const [isHydrated, setIsHydrated] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("nodoquant_comparison_v1");

        if (saved) {
            try {
                const parsed = JSON.parse(
                    saved
                ) as SerializedComparisonStrategy[];

                const hydrated: ComparisonStrategy[] = parsed.map(
                    (strategy) => ({
                        ...strategy,
                        trades: strategy.trades.map(hydrateTrade),
                    })
                );

                setComparisonList(hydrated);
            } catch (error: unknown) {
                console.error(
                    "Failed to load comparison list",
                    error
                );
            }
        }

        setIsHydrated(true);
    }, []);

    // Save to localStorage
    useEffect(() => {
        if (!isHydrated) return;

        localStorage.setItem(
            "nodoquant_comparison_v1",
            JSON.stringify(comparisonList)
        );
    }, [comparisonList, isHydrated]);

    const addToComparison = useCallback(
        (
            strategy: Omit<
                ComparisonStrategy,
                "id" | "timestamp"
            >
        ) => {
            setComparisonList((previous) => {
                // Limit: 3 for Pro/Trial, 1 for Free
                const limit = isPro ? 3 : 1;

                if (previous.length >= limit) {
                    return previous;
                }

                // Check if already exists by name
                if (
                    previous.some(
                        (item) => item.name === strategy.name
                    )
                ) {
                    return previous;
                }

                const newItem: ComparisonStrategy = {
                    ...strategy,
                    id: crypto.randomUUID(),
                    timestamp: Date.now(),
                };

                return [...previous, newItem];
            });
        },
        [isPro]
    );

    const removeFromComparison = useCallback((id: string) => {
        setComparisonList((previous) =>
            previous.filter((strategy) => strategy.id !== id)
        );
    }, []);

    const clearComparison = useCallback(() => {
        setComparisonList([]);
    }, []);

    return {
        comparisonList,
        addToComparison,
        removeFromComparison,
        clearComparison,
        isFull: comparisonList.length >= (isPro ? 3 : 1),
    };
}
