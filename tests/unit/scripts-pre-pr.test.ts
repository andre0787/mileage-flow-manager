import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import { resolve } from "path";
import { readFileSync } from "fs";

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

describe("pre-pr auto-heal (travas do council 2026-08-05)", () => {
  it("integra healSession antes das regras e registra evento healed", () => {
    const content = readFileSync(SCRIPT, "utf8");
    expect(content).toMatch(/import \{ healSession \} from "\.\/lib\/session-heal\.mjs"/);
    expect(content).toMatch(/healSession\(ROOT\)/);
    expect(content).toMatch(/event-log\.mjs healed/);
    expect(content).toMatch(/Auto-heal de violações mecânicas/);
  });

  it("stageia artefatos após heal (não deixa handoff unstaged)", () => {
    const content = readFileSync(SCRIPT, "utf8");
    expect(content).toMatch(/if \(healed\.length > 0\) stageGeneratedArtifacts\(ROOT\)/);
  });

  it("heal roda ANTES do loop de regras (ordem do source)", () => {
    const content = readFileSync(SCRIPT, "utf8");
    const healIdx = content.indexOf("healSession(ROOT)");
    const rulesIdx = content.indexOf("── Regras ──");
    expect(healIdx).toBeGreaterThan(-1);
    expect(rulesIdx).toBeGreaterThan(-1);
    expect(healIdx).toBeLessThan(rulesIdx);
  });
});

describe("pre-pr Trava C (MAP.md auto-registrado, council 2026-08-05 Fase 2)", () => {
  it("integra healMapDocs e registra evento healed para rule-17", () => {
    const content = readFileSync(SCRIPT, "utf8");
    expect(content).toMatch(/import \{ healMapDocs \} from "\.\/lib\/map-heal\.mjs"/);
    expect(content).toMatch(/healMapDocs\(ROOT\)/);
    expect(content).toMatch(/rule-17-new-docs-valid/);
  });

  it("stageia artefatos se MAP.md foi curado (não deixa unstaged)", () => {
    const content = readFileSync(SCRIPT, "utf8");
    const healMapIdx = content.indexOf("healMapDocs(ROOT)");
    const stageIdx = content.indexOf("stageGeneratedArtifacts(ROOT)");
    expect(healMapIdx).toBeGreaterThan(-1);
    expect(stageIdx).toBeGreaterThan(healMapIdx);
  });

  it("MAP.md está nos artefatos gerados stageados (Trava A sobre o heal)", () => {
    const content = readFileSync(resolve(ROOT, "scripts/lib/generated-artifacts.mjs"), "utf8");
    expect(content).toMatch(/"docs\/MAP\.md"/);
  });
});

describe("pre-pr Trava D (gate:blocked, council 2026-08-05 Fase 2)", () => {
  it("gates de julgamento registram gate:blocked (não rule:fail) no catch de regras", () => {
    const content = readFileSync(SCRIPT, "utf8");
    expect(content).toMatch(/GATE_RULES|gate:blocked/);
    expect(content).toMatch(/rule-27-council-veredict/);
    expect(content).toMatch(/rule-33-intent-gate/);
    expect(content).toMatch(/rule-35-auth-gate/);
    expect(content).toMatch(/event-log\.mjs gate:blocked/);
  });

  it("gate continua bloqueando (errors++ — julgamento nunca auto-corrige)", () => {
    const content = readFileSync(SCRIPT, "utf8");
    // O catch que trata gate deve continuar incrementando errors
    const gateSection = content.slice(content.indexOf("GATE_RULES"), content.indexOf("── Build ──"));
    expect(gateSection).toContain("errors++");
  });

  it("rule-27 tem mensagem acionável com comando exato (council)", () => {
    const rule27 = readFileSync(resolve(ROOT, "scripts/rules/rule-27-council-veredict.mjs"), "utf8");
    expect(rule27).toMatch(/council-to-superpowers|council\.mjs|\.pi\/skills\/council-to-superpowers/);
    expect(rule27).toMatch(/## Advisors/);
    expect(rule27).toMatch(/## Síntese do Chairman/);
  });
});
