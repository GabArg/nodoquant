import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function filesUnder(root: string): string[] {
    return readdirSync(root).flatMap((name) => {
        const path = join(root, name);
        if (path.includes(`${join("app", "[locale]", "admin")}`)) return [];
        return statSync(path).isDirectory() ? filesUnder(path) : [path];
    });
}

describe("public beta copy", () => {
    it("contains no active payment or paid-plan calls to action", () => {
        const files = [
            ...filesUnder(join(process.cwd(), "app", "[locale]")),
            ...filesUnder(join(process.cwd(), "components")),
            join(process.cwd(), "messages", "es.json"),
            join(process.cwd(), "messages", "en.json"),
        ].filter((path) => /\.(tsx|json)$/.test(path));
        const publicCopy = files.map((path) => readFileSync(path, "utf8")).join("\n");

        for (const banned of [
            /pago único/i,
            /one-time payment/i,
            /consejo pro/i,
            /pro tip/i,
            /función pro/i,
            /pro feature/i,
            /actualizar a pro/i,
            /upgrade to pro/i,
            /desbloquear análisis/i,
            /unlock full analysis/i,
            />\s*pro\s*</i,
        ]) {
            expect(publicCopy).not.toMatch(banned);
        }
    });
});
