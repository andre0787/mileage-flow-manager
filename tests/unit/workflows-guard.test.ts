import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const WF = resolve(ROOT, ".github/workflows/normalize-pr-report.yml");

describe("normalize-pr-report workflow (P0: PRs blocked por [skip ci])", () => {
  it("não usa [skip ci] no commit de normalize", () => {
    const content = readFileSync(WF, "utf8");
    // O commit do normalize é feito na branch do PR; com [skip ci] o
    // CI PR Check não roda no head renomeado → branch protection bloqueia.
    expect(content).not.toMatch(/git commit[^\n]*\[skip ci\]/);
  });

  it("dispara em pull_request opened (documentando o gatilho)", () => {
    const content = readFileSync(WF, "utf8");
    expect(content).toMatch(/pull_request:\s*\n\s*types:\s*\[opened\]/);
  });
});