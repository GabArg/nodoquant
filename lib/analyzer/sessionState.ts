export const LEGACY_ANALYZER_SESSION_KEY = "nodoquant_analyzer_state";
const ANALYZER_SESSION_PREFIX = `${LEGACY_ANALYZER_SESSION_KEY}:`;

export interface SessionStorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}

export function analyzerSessionKey(userId: string | null): string {
    return `${ANALYZER_SESSION_PREFIX}${userId || "anonymous"}`;
}

export function clearLegacyAnalyzerState(storage: SessionStorageLike): void {
    storage.removeItem(LEGACY_ANALYZER_SESSION_KEY);
}

export function readAnalyzerState(storage: SessionStorageLike, userId: string | null): string | null {
    clearLegacyAnalyzerState(storage);
    return storage.getItem(analyzerSessionKey(userId));
}

export function writeAnalyzerState(storage: SessionStorageLike, userId: string | null, value: string): void {
    clearLegacyAnalyzerState(storage);
    storage.setItem(analyzerSessionKey(userId), value);
}

export function removeAnalyzerState(storage: SessionStorageLike, userId: string | null): void {
    clearLegacyAnalyzerState(storage);
    storage.removeItem(analyzerSessionKey(userId));
}
