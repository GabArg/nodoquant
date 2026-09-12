import type { NormalizedSimulationTrade } from "./normalizedTradeSequence";

export type EvaluationTimeZone =
    | { kind: "iana"; name: string }
    | { kind: "fixedOffset"; offsetMinutes: number; name: string };

export interface DailyResetConfig {
    timeZone: EvaluationTimeZone;
    hour: number;
    minute: number;
    semantics: "evaluationDayStart";
}

export const UTC_DAILY_RESET: DailyResetConfig = {
    timeZone: { kind: "iana", name: "UTC" },
    hour: 0,
    minute: 0,
    semantics: "evaluationDayStart",
};

export function validateDailyResetConfig(config: DailyResetConfig): boolean {
    if (!Number.isInteger(config.hour) || config.hour < 0 || config.hour > 23 || !Number.isInteger(config.minute) || config.minute < 0 || config.minute > 59) return false;
    if (config.semantics !== "evaluationDayStart") return false;
    if (config.timeZone.kind === "fixedOffset") return Number.isInteger(config.timeZone.offsetMinutes) && Math.abs(config.timeZone.offsetMinutes) <= 14 * 60 && Boolean(config.timeZone.name);
    try {
        new Intl.DateTimeFormat("en-US", { timeZone: config.timeZone.name }).format(0);
        return true;
    } catch {
        return false;
    }
}

function previousCalendarDay(year: number, month: number, day: number): string {
    return new Date(Date.UTC(year, month - 1, day - 1)).toISOString().slice(0, 10);
}

function evaluationDayKey(epoch: number, config: DailyResetConfig): string {
    let year: number;
    let month: number;
    let day: number;
    let hour: number;
    let minute: number;
    if (config.timeZone.kind === "fixedOffset") {
        const local = new Date(epoch + config.timeZone.offsetMinutes * 60_000);
        year = local.getUTCFullYear(); month = local.getUTCMonth() + 1; day = local.getUTCDate(); hour = local.getUTCHours(); minute = local.getUTCMinutes();
    } else {
        const parts = new Intl.DateTimeFormat("en-US", {
            timeZone: config.timeZone.name, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
        }).formatToParts(epoch);
        const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find(item => item.type === type)?.value);
        year = part("year"); month = part("month"); day = part("day"); hour = part("hour"); minute = part("minute");
    }
    const beforeReset = hour * 60 + minute < config.hour * 60 + config.minute;
    return beforeReset ? previousCalendarDay(year, month, day) : `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function groupTradesByEvaluationDay(trades: readonly NormalizedSimulationTrade[], reset: DailyResetConfig = UTC_DAILY_RESET): NormalizedSimulationTrade[][] {
    if (!validateDailyResetConfig(reset)) return [];
    const groups = new Map<string, NormalizedSimulationTrade[]>();
    for (const trade of trades) {
        const epoch = trade.closedAt ? Date.parse(trade.closedAt) : Number.NaN;
        if (!Number.isFinite(epoch)) return [];
        const key = evaluationDayKey(epoch, reset);
        const group = groups.get(key) ?? [];
        group.push(trade);
        groups.set(key, group);
    }
    return [...groups.values()];
}

export function dailyResetLabel(reset: DailyResetConfig): string {
    const time = `${String(reset.hour).padStart(2, "0")}:${String(reset.minute).padStart(2, "0")}`;
    return `${time} ${reset.timeZone.name}`;
}
