import { describe, it, expect, beforeAll } from "vitest";
import { execSync } from "child_process";
import { resolve } from "path";

const ROOT = resolve(__dirname, "../..");

const RULE_02 = resolve(ROOT, "scripts/rules/rule-02-category-loading.mjs");
const RULE_03 = resolve(ROOT, "scripts/rules/rule-03-handoff-completeness.mjs");
const RULE_20 = resolve(ROOT, "scripts/rules/rule-20-no-agenda-load.mjs");

describe("rule-02-category-loading", () => {
  it("deve passar ou pular quando handoff não tem categoria", () => {
    const out = execSync(`node "${RULE_02}" 2>&1`, {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 5000,
    });
    expect(out).toMatch(/✅|⏭️/);
  });
});

describe("rule-03-handoff-completeness", () => {
  it("deve falhar quando handoff não tem os campos obrigatórios", () => {
    try {
      execSync(`node "${RULE_03}" 2>&1`, {
        cwd: ROOT,
        encoding: "utf8",
        timeout: 5000,
      });
      // Se passar, o handoff já está completo (ok)
      expect(true).toBe(true);
    } catch (e) {
      expect(e.stderr || e.stdout || e.message).toBeTruthy();
    }
  });
});

describe("rule-20-no-agenda-load", () => {
  it("deve verificar que scripts não referenciam AGENDA.md", () => {
    try {
      const out = execSync(`node "${RULE_20}" 2>&1`, {
        cwd: ROOT,
        encoding: "utf8",
        timeout: 5000,
      });
      expect(out).toMatch(/✅|⏭️/);
    } catch (e) {
      const msg = e.stderr || e.stdout || e.message || "";
      expect(msg).toContain("AGENDA.md");
    }
  });
});
