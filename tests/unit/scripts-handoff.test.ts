import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import { resolve } from "path";

const ROOT = resolve(__dirname, "../..");
const SNAPSHOT_SCRIPT = resolve(ROOT, "scripts/handoff-snapshot.mjs");

describe("handoff-snapshot", () => {
  it("deve gerar snapshot com stack e estrutura", () => {
    const out = execSync(`node "${SNAPSHOT_SCRIPT}"`, {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 5000,
    });
    expect(out).toContain("Stack:");
    expect(out).toContain("Estrutura:");
    expect(out).toContain("Regras críticas:");
    expect(out).toContain("Workflow:");
  });
});
