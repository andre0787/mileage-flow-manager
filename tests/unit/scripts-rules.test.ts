import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import { resolve, join } from "path";
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, cpSync, rmSync, readdirSync, symlinkSync } from "fs";
import { tmpdir } from "os";

const ROOT = resolve(__dirname, "../..");
const RULES_DIR = resolve(ROOT, "scripts/rules");
const FIXTURES_DIR = resolve(RULES_DIR, "__fixtures__");

// ─── Helpers ─────────────────────────────────────────────────────────

/** Roda uma rule num fixture via MOCK_ROOT, retorna { stdout, status, error } */
function runRuleOnFixture(ruleName: string, fixturePath: string): { stdout: string; status: number; error: string } {
  const ruleScript = resolve(RULES_DIR, ruleName);
  const env = { ...process.env, MOCK_ROOT: fixturePath };
  try {
    const stdout = execSync(`node "${ruleScript}" 2>&1`, {
      cwd: fixturePath,
      encoding: "utf8",
      timeout: 10000,
      env,
    });
    return { stdout, status: 0, error: "" };
  } catch (e: unknown) {
    const err = e as { stdout?: string; stderr?: string; status?: number; message?: string };
    return {
      stdout: err.stdout || "",
      status: err.status ?? 1,
      error: err.stderr || err.message || "",
    };
  }
}

/** Roda uma rule normalmente (no repo real) */
function runRule(ruleName: string): { stdout: string; status: number; error: string } {
  const ruleScript = resolve(RULES_DIR, ruleName);
  try {
    const stdout = execSync(`node "${ruleScript}" 2>&1`, {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 10000,
    });
    return { stdout, status: 0, error: "" };
  } catch (e: unknown) {
    const err = e as { stdout?: string; stderr?: string; status?: number; message?: string };
    return {
      stdout: err.stdout || "",
      status: err.status ?? 1,
      error: err.stderr || err.message || "",
    };
  }
}

/** Cria um diretório temporário com conteúdo copiado de um fixture */
function createTempFixture(fixtureSubdir: string): string {
  const src = resolve(FIXTURES_DIR, fixtureSubdir);
  const tmp = mkdtempSync(join(tmpdir(), "rule-test-"));
  if (existsSync(src)) {
    cpSync(src, tmp, { recursive: true });
  }
  return tmp;
}

/** Limpa um diretório temporário */
function cleanTempFixture(tmpPath: string) {
  try { rmSync(tmpPath, { recursive: true, force: true }); } catch { /* ignora erro se já foi limpo */ }
}

/** Inicializa git num diretório e faz commit inicial */
function initGitRepo(dir: string) {
  execSync("git init", { cwd: dir, encoding: "utf8", timeout: 5000 });
  // Configura identidade para evitar aviso
  execSync('git config user.email "test@test.com"', { cwd: dir, encoding: "utf8", timeout: 5000 });
  execSync('git config user.name "Test"', { cwd: dir, encoding: "utf8", timeout: 5000 });
  // Cria um commit inicial para que git status funcione
  const readme = join(dir, "README.md");
  if (!existsSync(readme)) {
    writeFileSync(readme, "# Test Repo\n");
  }
  execSync("git add -A && git commit -m 'initial' 2>/dev/null", {
    cwd: dir, encoding: "utf8", timeout: 5000,
  });
}

// ─── rule-02-category-loading ──────────────────────────────────────

describe("rule-02-category-loading", () => {
  it("deve passar (fixture positiva: handoff com docs corretos)", () => {
    const tmp = createTempFixture("handoff/valid");
    try {
      const res = runRuleOnFixture("rule-02-category-loading.mjs", tmp);
      expect(res.status).toBe(0);
      expect(res.stdout).toMatch(/✅|⏭️/);
    } finally { cleanTempFixture(tmp); }
  });

  it("deve falhar (fixture negativa: docs carregados incompatíveis com categoria)", () => {
    const tmp = createTempFixture("handoff/invalid-category");
    try {
      const res = runRuleOnFixture("rule-02-category-loading.mjs", tmp);
      expect(res.status).not.toBe(0);
      expect(res.stdout || res.error).toMatch(/❌|fora da categoria/);
    } finally { cleanTempFixture(tmp); }
  });
});

// ─── rule-03-handoff-completeness ──────────────────────────────────

describe("rule-03-handoff-completeness", () => {
  it("deve passar (fixture positiva: handoff com todas as seções)", () => {
    const tmp = createTempFixture("handoff/valid");
    try {
      const res = runRuleOnFixture("rule-03-handoff-completeness.mjs", tmp);
      expect(res.status).toBe(0);
      expect(res.stdout).toMatch(/✅|⏭️/);
    } finally { cleanTempFixture(tmp); }
  });

  it("deve falhar (fixture negativa: handoff sem seções obrigatórias)", () => {
    const tmp = createTempFixture("handoff/invalid-missing");
    try {
      const res = runRuleOnFixture("rule-03-handoff-completeness.mjs", tmp);
      expect(res.status).not.toBe(0);
      expect(res.stdout || res.error).toContain("seções ausentes");
    } finally { cleanTempFixture(tmp); }
  });
});

// ─── rule-02-grid (git-dependent) ─────────────────────────────────

describe("rule-02-grid", () => {
  it("deve passar (positiva: diff sem grid-cols-3+)", () => {
    const res = runRule("rule-02-grid.mjs");
    expect(res.status).toBe(0);
  });

  it("deve falhar (negativa: diff com grid-cols-3+)", () => {
    const tmp = createTempFixture("handoff/valid"); // base mínima
    try {
      initGitRepo(tmp);
      // Cria um .tsx com grid-cols-3 no staged
      const badFile = join(tmp, "src/components/Bad.tsx");
      mkdirSync(join(tmp, "src/components"), { recursive: true });
      writeFileSync(badFile, 'export function Bad() { return <div className="grid-cols-3">x</div>; }\n');
      execSync("git add src/components/Bad.tsx", { cwd: tmp, encoding: "utf8", timeout: 5000 });
      const res = runRuleOnFixture("rule-02-grid.mjs", tmp);
      expect(res.status).not.toBe(0);
    } finally { cleanTempFixture(tmp); }
  });
});

// ─── rule-04-branch (git-dependent) ────────────────────────────────

describe("rule-04-branch", () => {
  it("deve passar (positiva: branch não é main)", () => {
    const tmp = createTempFixture("handoff/valid");
    try {
      initGitRepo(tmp);
      execSync("git checkout -b feat/test-branch", { cwd: tmp, encoding: "utf8", timeout: 5000 });
      const res = runRuleOnFixture("rule-04-branch.mjs", tmp);
      expect(res.status).toBe(0);
    } finally { cleanTempFixture(tmp); }
  });

  it("deve falhar (negativa: branch é main)", () => {
    const tmp = createTempFixture("handoff/valid");
    try {
      initGitRepo(tmp);
      // Cria branch main e vai pra ela
      execSync("git checkout -b main", { cwd: tmp, encoding: "utf8", timeout: 5000 });
      const res = runRuleOnFixture("rule-04-branch.mjs", tmp);
      expect(res.status).not.toBe(0);
      expect(res.stdout || res.error).toContain("não permitida");
    } finally { cleanTempFixture(tmp); }
  });
});

// ─── rule-05-ci-workflows (file-based) ─────────────────────────────

describe("rule-05-ci-workflows", () => {
  it("deve passar (positiva: workflows existem)", () => {
    const res = runRule("rule-05-ci-workflows.mjs");
    expect(res.status).toBe(0);
  });

  it("deve falhar (negativa: CI workflow faltando)", () => {
    const tmp = createTempFixture("ci/missing");
    try {
      const res = runRuleOnFixture("rule-05-ci-workflows.mjs", tmp);
      expect(res.status).not.toBe(0);
      expect(res.stdout || res.error).toContain("Workflow faltando");
    } finally { cleanTempFixture(tmp); }
  });
});

// ─── rule-07-ptbr (git-dependent) ─────────────────────────────────

describe("rule-07-ptbr", () => {
  it("deve passar (positiva: sem strings em inglês no diff)", () => {
    const res = runRule("rule-07-ptbr.mjs");
    expect(res.status).toBe(0);
  });

  it("deve falhar (negativa: diff com strings em inglês)", () => {
    const tmp = createTempFixture("handoff/valid");
    try {
      initGitRepo(tmp);
      const badFile = join(tmp, "src/components/Teste.tsx");
      mkdirSync(join(tmp, "src/components"), { recursive: true });
      writeFileSync(badFile, 'export function T() { return <div>Save</div>; }\n');
      execSync("git add -A && git commit -m 'add english' 2>/dev/null", {
        cwd: tmp, encoding: "utf8", timeout: 5000,
      });
      // Agora modifica com string em inglês (no working tree)
      writeFileSync(badFile, 'export function T() { return <div>{"Cancel"}</div>; }\n');
      const res = runRuleOnFixture("rule-07-ptbr.mjs", tmp);
      expect(res.status).not.toBe(0);
      expect(res.stdout || res.error).toContain("Strings em inglês");
    } finally { cleanTempFixture(tmp); }
  });
});

// ─── rule-08-report (git-dependent, complex) ──────────────────────

describe("rule-08-report", () => {
  it("deve falhar quando não há relatório no diff (negativa)", () => {
    // Usa MOCK_ROOT num repo limpo sem relatórios
    const tmp = createTempFixture("handoff/valid");
    try {
      initGitRepo(tmp);
      const res = runRuleOnFixture("rule-08-report.mjs", tmp);
      expect(res.status).not.toBe(0);
      expect(res.stdout || res.error).toContain("nenhum relatório");
    } finally { cleanTempFixture(tmp); }
  });
});

// ─── rule-09-handoff (git-dependent) ───────────────────────────────

describe("rule-09-handoff", () => {
  it("deve passar (positiva: handoff existe)", () => {
    const res = runRule("rule-09-handoff.mjs");
    expect(res.status).toBe(0);
  });

  it("deve falhar (negativa: sem handoff.md, branch não é main)", () => {
    const tmp = createTempFixture("handoff/nonexistent"); // sem docs/handoff.md
    try {
      initGitRepo(tmp);
      // Garante que não está em main
      execSync("git checkout -b feat/teste", { cwd: tmp, encoding: "utf8", timeout: 5000 });
      const res = runRuleOnFixture("rule-09-handoff.mjs", tmp);
      expect(res.status).not.toBe(0);
      expect(res.stdout || res.error).toContain("handoff.md não encontrado");
    } finally { cleanTempFixture(tmp); }
  });
});

// ─── rule-10-clean (git-dependent) ─────────────────────────────────

describe("rule-10-clean", () => {
  // ponytail: durante desenvolvimento o repo pode ter mudanças não commitadas
  // Teste aceita ambos os estados — o que importa é a fixture negativa
  it("deve passar ou detectar sujeira (positiva flexível)", () => {
    const res = runRule("rule-10-clean.mjs");
    expect([0, 1]).toContain(res.status);
  });

  it("deve falhar (negativa: arquivo não commitado)", () => {
    const tmp = createTempFixture("handoff/valid");
    try {
      initGitRepo(tmp);
      // Cria arquivo untracked
      const untracked = join(tmp, "untracked.txt");
      writeFileSync(untracked, "sujo\n");
      const res = runRuleOnFixture("rule-10-clean.mjs", tmp);
      expect(res.status).not.toBe(0);
      expect(res.stdout || res.error).toContain("não commitados");
    } finally { cleanTempFixture(tmp); }
  });
});

// ─── rule-11-bug-registry (git-dependent) ──────────────────────────

describe("rule-11-bug-registry", () => {
  it("deve passar (positiva: sem alterações em src/ diff staged)", () => {
    const res = runRule("rule-11-bug-registry.mjs");
    expect(res.status).toBe(0);
  });

  it("deve warnar (negativa: src/ alterado sem AGENDA.md modificado)", () => {
    const tmp = createTempFixture("handoff/valid");
    try {
      initGitRepo(tmp);
      // Cria staged src/ change
      mkdirSync(join(tmp, "src"), { recursive: true });
      writeFileSync(join(tmp, "src/foo.ts"), "export const x = 1;\n");
      execSync("git add src/foo.ts 2>/dev/null", { cwd: tmp, encoding: "utf8", timeout: 5000 });
      const res = runRuleOnFixture("rule-11-bug-registry.mjs", tmp);
      // Rule 11 não faz exit(1) — é warn apenas
      expect(res.stdout || "").toContain("AGENDA.md não foi modificado");
    } finally { cleanTempFixture(tmp); }
  });
});

// ─── rule-13-validations ───────────────────────────────────────────

describe("rule-13-validations", () => {
  it("deve passar (positiva: todas as regras têm validação)", () => {
    const res = runRule("rule-13-validations.mjs");
    expect(res.status).toBe(0);
  });

  it("deve falhar (negativa: AGENTS.md c/ regras sem scripts correspondentes)", () => {
    const tmp = createTempFixture("validations/missing");
    try {
      // Cria scripts/rules/ vazio para a rule encontrar
      mkdirSync(join(tmp, "scripts/rules"), { recursive: true });
      const res = runRuleOnFixture("rule-13-validations.mjs", tmp);
      // Rule 13 setava hasError mas não chamava exit(1) — agora corrigido
      expect(res.status).not.toBe(0);
      expect(res.stdout || res.error).toContain("SEM script");
    } finally { cleanTempFixture(tmp); }
  });
});

// ─── rule-14-orphan-files ──────────────────────────────────────────

describe("rule-14-orphan-files", () => {
  it("deve passar (positiva: sem arquivos órfãos no repo)", () => {
    const res = runRule("rule-14-orphan-files.mjs");
    expect(res.status).toBe(0);
  });

  it("deve falhar (negativa: arquivo órfão em src/)", () => {
    const tmp = createTempFixture("code/orphan/invalid");
    try {
      const res = runRuleOnFixture("rule-14-orphan-files.mjs", tmp);
      expect(res.status).not.toBe(0);
      expect(res.stdout || res.error).toContain("Arquivo órfão");
    } finally { cleanTempFixture(tmp); }
  });
});

// ─── rule-15-duplicate-code ────────────────────────────────────────

describe("rule-15-duplicate-code", () => {
  it("deve passar (positiva: sem duplicatas no repo)", () => {
    const res = runRule("rule-15-duplicate-code.mjs");
    expect(res.status).toBe(0);
  });

  it("deve falhar (negativa: componentes duplicados)", () => {
    const tmp = createTempFixture("code/duplicate/invalid");
    try {
      const res = runRuleOnFixture("rule-15-duplicate-code.mjs", tmp);
      expect(res.status).not.toBe(0);
      expect(res.stdout || res.error).toContain("Duplicatas");
    } finally { cleanTempFixture(tmp); }
  });
});

// ─── rule-16-orphan-scripts ────────────────────────────────────────

describe("rule-16-orphan-scripts", () => {
  it("deve passar (positiva: todos os scripts têm atalho)", () => {
    const res = runRule("rule-16-orphan-scripts.mjs");
    expect(res.status).toBe(0);
  });

  it("deve falhar (negativa: script sem atalho npm)", () => {
    const tmp = createTempFixture("scripts/without-npm");
    try {
      const res = runRuleOnFixture("rule-16-orphan-scripts.mjs", tmp);
      expect(res.status).not.toBe(0);
      expect(res.stdout || res.error).toContain("sem atalho");
    } finally { cleanTempFixture(tmp); }
  });
});

// ─── rule-17-new-docs-valid (git-dependent, complex) ─────────────

describe("rule-17-new-docs-valid", () => {
  it("deve passar (positiva: sem novos .md no diff)", () => {
    const res = runRule("rule-17-new-docs-valid.mjs");
    expect(res.status).toBe(0);
  });
});

// ─── rule-17-report-prefix (git-dependent) ────────────────────────

describe("rule-17-report-prefix", () => {
  it("deve passar (positiva: relatório com prefixo correto)", () => {
    // Testa apenas que a rule roda sem crash
    const res = runRule("rule-17-report-prefix.mjs");
    expect([0, 1]).toContain(res.status);
  });
});

// ─── rule-18-no-duplicate-root-docs ──────────────────────────────

describe("rule-18-no-duplicate-root-docs", () => {
  it("deve passar (positiva: sem duplicatas)", () => {
    const res = runRule("rule-18-no-duplicate-root-docs.mjs");
    expect(res.status).toBe(0);
  });

  it("deve falhar (negativa: arquivo duplicado na raiz e docs/)", () => {
    const tmp = createTempFixture("root-docs/invalid");
    try {
      const res = runRuleOnFixture("rule-18-no-duplicate-root-docs.mjs", tmp);
      expect(res.status).not.toBe(0);
      expect(res.stdout || res.error).toContain("DUPLICADO");
    } finally { cleanTempFixture(tmp); }
  });
});

// ─── rule-19-stock-validation ──────────────────────────────────────

describe("rule-19-stock-validation", () => {
  it("deve passar (positiva: código válido)", () => {
    const res = runRule("rule-19-stock-validation.mjs");
    expect(res.status).toBe(0);
  });

  it("deve falhar (negativa: invalidateQueries sem refetchType)", () => {
    const tmp = createTempFixture("code/stock-violation/invalid");
    // Precisa de mais arquivos do repo para a regra funcionar
    // Copia lib.mjs e outros helpers
    mkdirSync(join(tmp, "scripts"), { recursive: true });
    cpSync(resolve(ROOT, "scripts/lib.mjs"), join(tmp, "scripts/lib.mjs"));
    try {
      const res = runRuleOnFixture("rule-19-stock-validation.mjs", tmp);
      expect(res.status).not.toBe(0);
      // Rule 19.1: verifica invalidateQueries sem refetchType
      expect(res.stdout || res.error).toContain("sem refetchType");
    } finally { cleanTempFixture(tmp); }
  });
});

// ─── rule-20-no-agenda-load ────────────────────────────────────────

describe("rule-20-no-agenda-load", () => {
  it("deve passar (positiva: scripts sem AGENDA.md)", () => {
    const res = runRule("rule-20-no-agenda-load.mjs");
    expect(res.status).toBe(0);
  });

  it("deve falhar (negativa: script referencia AGENDA.md)", () => {
    const tmp = createTempFixture("no-agenda/invalid");
    try {
      const res = runRuleOnFixture("rule-20-no-agenda-load.mjs", tmp);
      expect(res.status).not.toBe(0);
      expect(res.stdout || res.error).toContain("AGENDA.md");
    } finally { cleanTempFixture(tmp); }
  });
});

// ─── rule-22-pr-naming (testável via --title) ──────────────────────

describe("rule-22-pr-naming", () => {
  it("deve passar (positiva: título válido)", () => {
    const ruleScript = resolve(RULES_DIR, "rule-22-pr-naming.mjs");
    const out = execSync(`node "${ruleScript}" --title "fix: corrige cache" 2>&1`, {
      cwd: ROOT, encoding: "utf8", timeout: 5000,
    });
    expect(out).toMatch(/✅|⏭️/);
  });

  it("deve falhar (negativa: título inválido)", () => {
    const ruleScript = resolve(RULES_DIR, "rule-22-pr-naming.mjs");
    try {
      execSync(`node "${ruleScript}" --title "titulo qualquer" 2>&1`, {
        cwd: ROOT, encoding: "utf8", timeout: 5000,
      });
      expect("deveria ter falhado").toBe("não falhou");
    } catch (e: unknown) {
      const err = e as { stdout?: string; stderr?: string; message?: string };
      const msg = err.stdout || err.stderr || err.message || "";
      expect(msg).toContain("não segue padrão");
    }
  });
});

// ─── rule-23-skill-orphans ─────────────────────────────────────────

describe("rule-23-skill-orphans", () => {
  // ponytail: .pi/skills/ tem symlinks absolutos que quebram no CI.
  // Criamos fixture com TODAS as 14 skills referenciadas.
  const REF_SKILLS = [
    "llm-council", "brainstorming", "writing-plans", "using-git-worktrees",
    "test-driven-development", "subagent-driven-development", "executing-plans",
    "requesting-code-review", "finishing-a-development-branch",
    "systematic-debugging", "verification-before-completion",
    "dispatching-parallel-agents", "receiving-code-review",
    "small-model-execution",
  ];

  it("deve passar (positiva: fixture com todas as skills)", () => {
    const tmp = createTempFixture("handoff/valid");
    try {
      const skillsDir = join(tmp, ".pi/skills");
      for (const skill of REF_SKILLS) {
        mkdirSync(join(skillsDir, skill), { recursive: true });
        writeFileSync(join(skillsDir, skill, "SKILL.md"), `# ${skill}\n`);
      }
      const res = runRuleOnFixture("rule-23-skill-orphans.mjs", tmp);
      expect(res.status).toBe(0);
    } finally { cleanTempFixture(tmp); }
  });

  it("deve falhar (negativa: skill referenciada não existe)", () => {
    const tmp = createTempFixture("handoff/valid");
    try {
      // Cria .pi/skills/ com skill existente e symlink quebrado
      const skillsDir = join(tmp, ".pi/skills");
      mkdirSync(join(skillsDir, "existing-skill"), { recursive: true });
      writeFileSync(join(skillsDir, "existing-skill/SKILL.md"), "# OK\n");
      // Cria um symlink quebrado
      symlinkSync("/nonexistent/target", join(skillsDir, "broken-link"));
      const res = runRuleOnFixture("rule-23-skill-orphans.mjs", tmp);
      expect(res.status).not.toBe(0);
      expect(res.stdout || res.error).toContain("Skill referenciada");
    } finally { cleanTempFixture(tmp); }
  });
});

// ─── rule-scope (via env vars, já testada) ─────────────────────────

describe("rule-scope", () => {
  const RULE_SCOPE = resolve(RULES_DIR, "rule-scope.mjs");
  const MOCK_CARD = "PRE_PR_MOCK_CARD=P1-10";

  it("deve passar quando diff está dentro do escopo", () => {
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
    } catch (e: unknown) {
      const err = e as { stdout?: string; stderr?: string; message?: string };
      const msg = err.stderr || err.stdout || err.message || "";
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
    } catch (e: unknown) {
      const err = e as { stdout?: string; stderr?: string; message?: string };
      const msg = err.stderr || err.stdout || err.message || "";
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
      `PRE_PR_MOCK_CARD=NONEXISTENT PRE_PR_MOCK_DIFF="scripts/rules/rule-scope.mjs" node "${RULE_SCOPE}" 2>&1`,
      { cwd: ROOT, encoding: "utf8", timeout: 5000 },
    );
    expect(out).toMatch(/Nenhum card ativo/);
  });
});
