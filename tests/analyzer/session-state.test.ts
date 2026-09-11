import { describe, expect, it } from "vitest";
import {
    LEGACY_ANALYZER_SESSION_KEY,
    analyzerSessionKey,
    readAnalyzerState,
    writeAnalyzerState,
    type SessionStorageLike,
} from "../../lib/analyzer/sessionState";

function memoryStorage(): SessionStorageLike & { has(key: string): boolean } {
    const values = new Map<string, string>();
    return {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
        removeItem: (key) => values.delete(key),
        has: (key) => values.has(key),
    };
}

describe("user-scoped analyzer session state", () => {
    it("does not let user B restore user A state", () => {
        const storage = memoryStorage();
        writeAnalyzerState(storage, "user-a", '{"step":"report"}');
        expect(readAnalyzerState(storage, "user-b")).toBeNull();
    });

    it("restores state for the same user", () => {
        const storage = memoryStorage();
        writeAnalyzerState(storage, "user-a", '{"step":"result"}');
        expect(readAnalyzerState(storage, "user-a")).toBe('{"step":"result"}');
    });

    it("keeps anonymous and authenticated state separate", () => {
        const storage = memoryStorage();
        writeAnalyzerState(storage, null, '{"step":"confirm"}');
        expect(analyzerSessionKey(null)).toBe("nodoquant_analyzer_state:anonymous");
        expect(readAnalyzerState(storage, "user-a")).toBeNull();
    });

    it("ignores and removes the legacy unscoped key", () => {
        const storage = memoryStorage();
        storage.setItem(LEGACY_ANALYZER_SESSION_KEY, '{"step":"report"}');
        expect(readAnalyzerState(storage, "user-a")).toBeNull();
        expect(storage.has(LEGACY_ANALYZER_SESSION_KEY)).toBe(false);
    });

    it("leaves a different, new account at clean Step 1", () => {
        const storage = memoryStorage();
        writeAnalyzerState(storage, "user-a", '{"step":"report","fileState":{"name":"a.csv"}}');
        const userBState = readAnalyzerState(storage, "user-b");
        expect(userBState).toBeNull();
        expect(userBState ? JSON.parse(userBState).step : "source").toBe("source");
    });

    it("keeps logout and login transitions isolated between accounts", () => {
        const storage = memoryStorage();
        writeAnalyzerState(storage, "user-a", '{"step":"report"}');
        writeAnalyzerState(storage, null, '{"step":"confirm"}');

        expect(readAnalyzerState(storage, null)).toBe('{"step":"confirm"}');
        expect(readAnalyzerState(storage, "user-b")).toBeNull();
        expect(readAnalyzerState(storage, "user-a")).toBe('{"step":"report"}');
    });
});
