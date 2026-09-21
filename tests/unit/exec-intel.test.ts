import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..", "..");

describe("scripts/exec-intel.mjs security & functionality", () => {
  it("does not use shell: true in spawnSync calls", () => {
    const code = readFileSync(resolve(ROOT, "scripts/exec-intel.mjs"), "utf8");
    expect(code).not.toContain("shell: true");
  });

  it("executes review mode safely and returns JSON output", () => {
    const res = spawnSync("node", ["scripts/exec-intel.mjs", "review"], {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 15_000,
    });
    expect(res.status).toBe(0);
    expect(res.error).toBeUndefined();

    const json = JSON.parse(res.stdout);
    expect(json).toHaveProperty("status");
    expect(json).toHaveProperty("summary");
    expect(json).toHaveProperty("findings");
    expect(json).toHaveProperty("risks");
    expect(json).toHaveProperty("recommendations");
  });

  it("handles metacharacters in target argument without shell injection", () => {
    const maliciousTarget = "$(echo evil_payload); | & echo evil_payload";
    const res = spawnSync("node", ["scripts/exec-intel.mjs", "review", maliciousTarget], {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 15_000,
    });
    expect(res.status).toBe(0);
    expect(res.error).toBeUndefined();

    const json = JSON.parse(res.stdout);
    expect(json).toHaveProperty("status");
    // Verifies malicious payload is treated as literal text string, not executed shell command
    expect(json.summary).toContain(maliciousTarget);
  });
});
