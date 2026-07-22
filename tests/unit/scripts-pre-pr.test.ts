import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import { resolve } from "path";

const ROOT = resolve(__dirname, "../..");
const SCRIPT = resolve(ROOT, "scripts/pre-pr-check.mjs");

describe("pre-pr-check com controle de diff e git info", () => {
  it("deve falhar com mensagem clara se diff estiver vazio", () => {
    try {
      execSync(`node "${SCRIPT}" --strict`, {
        cwd: ROOT,
        env: {
          ...process.env,
          PRE_PR_MOCK_DIFF: "",
          PRE_PR_ONLY_RULES: "true",
          PRE_PR_ONLY_RULE: "rule-08,rule-17",
        },
        encoding: "utf8",
        timeout: 5000,
      });
      expect(true).toBe(false);
    } catch (e) {
      const err = e as { status?: number; stdout?: string; stderr?: string };
      expect(err.status).toBe(1);
      const output = err.stdout || err.stderr || "";
      expect(output).toContain("Nenhuma alteração detectada em relação à base ou na working tree");
    }
  });

  it("deve falhar reclamando de relatorio ausente se houver diff de codigo mas sem html de relatorio", () => {
    try {
      execSync(`node "${SCRIPT}" --strict`, {
        cwd: ROOT,
        env: {
          ...process.env,
          PRE_PR_MOCK_DIFF: "src/components/ui/button.tsx",
          PRE_PR_ONLY_RULES: "true",
          PRE_PR_ONLY_RULE: "rule-08,rule-17",
          REPO_INFO_MOCK_BRANCH: "feat/teste-diff",
          REPO_INFO_MOCK_PR: "",
        },
        encoding: "utf8",
        timeout: 5000,
      });
      expect(true).toBe(false);
    } catch (e) {
      const err = e as { status?: number; stdout?: string; stderr?: string };
      expect(err.status).toBe(1);
      const output = err.stdout || err.stderr || "";
      expect(output).toContain("nenhum relatório encontrado no diff");
    }
  });

  it("deve passar livremente se houver diff de codigo + relatorio com nomenclatura valida (mesmo de data anterior)", () => {
    // Simulamos a data como 2026-07-25 (futuro)
    // E fornecemos um relatório válido que existe na página 2026-07-22: PR195-2026-07-22-animated-number-stale.html
    const out = execSync(`node "${SCRIPT}" --strict`, {
      cwd: ROOT,
      env: {
        ...process.env,
        PRE_PR_MOCK_DIFF: "src/components/ui/button.tsx,docs/reports/2026-07-22/PR195-2026-07-22-animated-number-stale.html",
        PRE_PR_ONLY_RULES: "true",
        PRE_PR_ONLY_RULE: "rule-08,rule-17",
        REPO_INFO_MOCK_BRANCH: "feat/some-feat",
        REPO_INFO_MOCK_PR: "195", // PR e prefixo corretos
        REPO_INFO_MOCK_TODAY: "2026-07-25", // Data simulada no futuro
      },
      encoding: "utf8",
      timeout: 5000,
    });
    expect(out).toContain("relatório completo e válido ✅");
  });

  it("deve falhar se o prefixo do relatorio for incorreto para o PR aberto", () => {
    try {
      execSync(`node "${SCRIPT}" --strict`, {
        cwd: ROOT,
        env: {
          ...process.env,
          PRE_PR_MOCK_DIFF: "src/components/ui/button.tsx,docs/reports/2026-07-22/PR195-2026-07-22-animated-number-stale.html",
          PRE_PR_ONLY_RULES: "true",
          PRE_PR_ONLY_RULE: "rule-08,rule-17",
          REPO_INFO_MOCK_BRANCH: "feat/some-feat",
          REPO_INFO_MOCK_PR: "999", // PR number diferente do index (PR195)
          REPO_INFO_MOCK_TODAY: "2026-07-25",
        },
        encoding: "utf8",
        timeout: 5000,
      });
      expect(true).toBe(false);
    } catch (e) {
      const err = e as { status?: number; stdout?: string; stderr?: string };
      expect(err.status).toBe(1);
      const output = err.stdout || err.stderr || "";
      expect(output).toContain("nomenclatura do relatório inválida no diff");
    }
  });
});
