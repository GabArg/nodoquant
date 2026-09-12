import type { Trade } from "./parser";

export const NORMALIZED_TRADE_SEQUENCE_VERSION = 1;

export interface NormalizedSimulationTrade {
    index: number;
    profit: number;
    closedAt?: string;
    openedAt?: string;
}

export type CompactSimulationTrade = [profit: number, closedAtEpochMs?: number, openedAtEpochMs?: number];

export interface PersistedSimulationData {
    version: 1;
    trades: CompactSimulationTrade[];
}

function epochToIso(value: number | undefined): string | undefined {
    if (value == null || !Number.isFinite(value)) return undefined;
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
}

function validEpoch(date: Date | undefined, explicitlyInvalid = false): number | undefined {
    if (!date || explicitlyInvalid || !Number.isFinite(date.getTime())) return undefined;
    return date.getTime();
}

export function normalizedTradeSequenceFromTrades(trades: readonly Trade[]): NormalizedSimulationTrade[] {
    return trades.flatMap((trade, index) => {
        if (!Number.isFinite(trade.profit)) return [];
        const closedEpoch = validEpoch(trade.exit_time ?? trade.datetime, trade.timestamp_valid === false);
        const openedEpoch = validEpoch(trade.entry_time ?? trade.open_time);
        return [{
            index,
            profit: trade.profit,
            ...(closedEpoch == null ? {} : { closedAt: new Date(closedEpoch).toISOString() }),
            ...(openedEpoch == null ? {} : { openedAt: new Date(openedEpoch).toISOString() }),
        }];
    });
}

export function serializeNormalizedTradeSequence(trades: readonly NormalizedSimulationTrade[]): PersistedSimulationData {
    return {
        version: NORMALIZED_TRADE_SEQUENCE_VERSION,
        trades: trades.map(trade => {
            const closedAt = trade.closedAt == null ? undefined : Date.parse(trade.closedAt);
            const openedAt = trade.openedAt == null ? undefined : Date.parse(trade.openedAt);
            const tuple: CompactSimulationTrade = [trade.profit];
            if (Number.isFinite(closedAt)) tuple[1] = closedAt;
            if (Number.isFinite(openedAt)) tuple[2] = openedAt;
            return tuple;
        }),
    };
}

export function deserializeNormalizedTradeSequence(value: unknown): NormalizedSimulationTrade[] | null {
    if (!value || typeof value !== "object") return null;
    const candidate = value as Partial<PersistedSimulationData>;
    if (candidate.version !== NORMALIZED_TRADE_SEQUENCE_VERSION || !Array.isArray(candidate.trades)) return null;
    const trades: NormalizedSimulationTrade[] = [];
    for (let index = 0; index < candidate.trades.length; index++) {
        const tuple = candidate.trades[index];
        if (!Array.isArray(tuple) || !Number.isFinite(tuple[0])) return null;
        const closedEpoch = tuple[1];
        const openedEpoch = tuple[2];
        const closedAt = epochToIso(closedEpoch);
        const openedAt = epochToIso(openedEpoch);
        if (closedEpoch != null && !closedAt) return null;
        if (openedEpoch != null && !openedAt) return null;
        trades.push({
            index,
            profit: tuple[0],
            ...(closedAt ? { closedAt } : {}),
            ...(openedAt ? { openedAt } : {}),
        });
    }
    return trades;
}
