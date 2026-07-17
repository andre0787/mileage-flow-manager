import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "../..");
const MUTATION_FILES = [
  "src/hooks/useDatabase/accounts.ts",
  "src/hooks/useDatabase/clients.ts",
  "src/hooks/useDatabase/entries.ts",
  "src/hooks/useDatabase/origemTypes.ts",
  "src/hooks/useDatabase/owners.ts",
  "src/hooks/useDatabase/programs.ts",
  "src/hooks/useDatabase/sales.ts",
  "src/hooks/useDatabase/shared.ts",
];

describe("atualização do cache após mutations", () => {
  it("aguarda o refetch antes de concluir cada callback de sucesso", () => {
    for (const relativePath of MUTATION_FILES) {
      const source = readFileSync(resolve(ROOT, relativePath), "utf8");
      const callbacks = [...source.matchAll(/onSuccess:\s*(async\s*)?\([^)]*\)\s*=>/g)];

      expect(callbacks.length, relativePath).toBeGreaterThan(0);
      expect(callbacks.every((match) => Boolean(match[1])), relativePath).toBe(true);
      expect(source, relativePath).toMatch(/await (?:Promise\.all\(\[)?[\s\S]*?invalidateQueries/);
    }
  });
});
