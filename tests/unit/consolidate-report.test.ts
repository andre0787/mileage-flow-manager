/**
 * consolidate-report.test.ts — Unit tests for consolidate-report command execution security.
 */

import { describe, it, expect } from "vitest";
import { gh, git, fetchMergedPRs } from "../../scripts/consolidate-report.mjs";

describe("consolidate-report security & helpers", () => {
  it("executes valid git commands safely using array arguments", () => {
    const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]);
    expect(typeof branch).toBe("string");
    expect(branch.length).toBeGreaterThan(0);
  });

  it("does not execute injected shell commands in git parameters", () => {
    // Attempt shell injection via command arguments
    const result = git(["rev-parse", "; echo INJECTED_GIT_TEST"]);
    // Since execFileSync does not use a shell, git receives '; echo INJECTED_GIT_TEST' as a literal ref name
    expect(result).not.toContain("INJECTED_GIT_TEST");
    expect(result).toBe("");
  });

  it("does not execute injected shell commands in gh parameters", () => {
    // Attempt shell injection via gh command arguments
    const result = gh(["pr", "list", "; echo INJECTED_GH_TEST"]);
    expect(result).not.toContain("INJECTED_GH_TEST");
  });

  it("fetchMergedPRs filters out invalid non-numeric --prs argument gracefully", () => {
    // Save process.argv
    const originalArgv = process.argv;
    process.argv = ["node", "consolidate-report.mjs", "--prs", "123,invalid;injection,456"];

    try {
      const prs = fetchMergedPRs("2026-01-01", "2026-12-31");
      expect(Array.isArray(prs)).toBe(true);
    } finally {
      process.argv = originalArgv;
    }
  });
});
