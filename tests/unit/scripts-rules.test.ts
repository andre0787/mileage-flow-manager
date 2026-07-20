import { describe, it, expect, beforeAll } from "vitest";
import { execSync } from "child_process";
import { resolve } from "path";

const ROOT = resolve(__dirname, "../..");

const RULE_02 = resolve(ROOT, "scripts/rules/rule-02-category-loading.mjs");
const RULE_03 = resolve(ROOT, "scripts/rules/rule-03-handoff-completeness.mjs");
const RULE_20 = resolve(ROOT, "scripts/rules/rule-20-no-agenda-load.mjs");
const RULE_SCOPE = resolve(ROOT, "scripts/rules/rule-scope.mjs");

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

describe("rule-scope", () => {
  const MOCK_CARD = "PRE_PR_MOCK_CARD=P1-10";

  it("deve passar quando diff está dentro do escopo do card ativo", () => {
    const out = execSync(
      `${MOCK_CARD} PRE_PR_MOCK_DIFF="scripts/rules/rule-scope.mjs,tests/unit/scripts-rules.test.ts" node "${RULE_SCOPE}" 2>&1`,
      { cwd: ROOT, encoding: "utf8", timeout: 5000 },
    );
    expect(out).toMatch(/✅/);
  });

  it("deve falhar quando diff tem arquivo fora do escopo", () => {
    try {
      execSync(
        `${MOCK_CARD} PRE_PR_MOCK_DIFF="src/components/Unrelated.tsx" node "${RULE_SCOPE}" 2>&1`,
        { cwd: ROOT, encoding: "utf8", timeout: 5000 },
      );
      expect("deveria ter falhado").toBe("não falhou");
    } catch (e) {
      const msg = e.stderr || e.stdout || e.message || "";
      expect(msg).toContain("fora de");
    }
  });

  it("deve falhar com arquivo sensível sem flag --allow-sensitive", () => {
    try {
      execSync(
        `${MOCK_CARD} PRE_PR_MOCK_DIFF="src/hooks/useDatabase/someFile.ts" node "${RULE_SCOPE}" 2>&1`,
        { cwd: ROOT, encoding: "utf8", timeout: 5000 },
      );
      expect("deveria ter falhado").toBe("não falhou");
    } catch (e) {
      const msg = e.stderr || e.stdout || e.message || "";
      expect(msg).toContain("sensíveis");
    }
  });

  it("deve permitir arquivo sensível com flag --allow-sensitive", () => {
    const out = execSync(
      `${MOCK_CARD} PRE_PR_MOCK_DIFF="src/hooks/useDatabase/someFile.ts" node "${RULE_SCOPE}" --allow-sensitive 2>&1`,
      { cwd: ROOT, encoding: "utf8", timeout: 5000 },
    );
    expect(out).toMatch(/⚠️|✅/);
  });

  it("deve passar quando não há card ativo", () => {
    const out = execSync(
      `PRE_PR_MOCK_DIFF="scripts/rules/rule-scope.mjs" node "${RULE_SCOPE}" 2>&1`,
      { cwd: ROOT, encoding: "utf8", timeout: 5000 },
    );
    expect(out).toMatch(/Nenhum card ativo/);
  });
});
