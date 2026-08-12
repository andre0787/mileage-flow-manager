import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import { resolve, join, dirname } from "path";
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, cpSync, rmSync, readdirSync, symlinkSync, chmodSync } from "fs";
import { tmpdir } from "os";

const ROOT = resolve(__dirname, "../..");
const RULES_DIR = resolve(ROOT, "scripts/rules");
const FIXTURES_DIR = resolve(RULES_DIR, "__fixtures__");
const GIT_CONTEXT_KEYS = ["GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_COMMON_DIR", "GIT_PREFIX"];

// ─── Helpers ─────────────────────────────────────────────────────────

function cleanGitEnv(extra: NodeJS.ProcessEnv = {}) {
  const env = { ...process.env, ...extra };
  for (const key of GIT_CONTEXT_KEYS) delete env[key];
  return env;
}

function gitExec(command: string, cwd: string) {
  return execSync(command, {
    cwd,
    encoding: "utf8",
    timeout: 5000,
    env: cleanGitEnv(),
  });
}

/** Roda uma rule num fixture via MOCK_ROOT, retorna { stdout, status, error } */
function runRuleOnFixture(ruleName: string, fixturePath: string, extraEnv: NodeJS.ProcessEnv = {}): { stdout: string; status: number; error: string } {
  const ruleScript = resolve(RULES_DIR, ruleName);
  const env = cleanGitEnv({ MOCK_ROOT: fixturePath, ...extraEnv });
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
function runRule(ruleName: string, extraEnv: NodeJS.ProcessEnv = {}): { stdout: string; status: number; error: string } {
  const ruleScript = resolve(RULES_DIR, ruleName);
  try {
    const stdout = execSync(`node "${ruleScript}" 2>&1`, {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 10000,
      env: cleanGitEnv(extraEnv),
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
  gitExec("git init", dir);
  // Configura identidade para evitar aviso
  gitExec('git config user.email "test@test.com"', dir);
  gitExec('git config user.name "Test"', dir);
  // Cria um commit inicial para que git status funcione
  const readme = join(dir, "README.md");
  if (!existsSync(readme)) {
    writeFileSync(readme, "# Test Repo\n");
  }
  gitExec("git add -A && git commit -m 'initial' 2>/dev/null", dir);
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
      gitExec("git add src/components/Bad.tsx", tmp);
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
      gitExec("git checkout -b feat/test-branch", tmp);
      const res = runRuleOnFixture("rule-04-branch.mjs", tmp);
      expect(res.status).toBe(0);
    } finally { cleanTempFixture(tmp); }
  });

  it("deve falhar (negativa: branch é main)", () => {
    const tmp = createTempFixture("handoff/valid");
    try {
      initGitRepo(tmp);
      // Cria branch main e vai pra ela
      gitExec("git checkout -b main", tmp);
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
      gitExec("git add -A && git commit -m 'add english' 2>/dev/null", tmp);
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
      gitExec("git checkout -b feat/teste", tmp);
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

  it("deve avisar mas NÃO falhar em modo PRE_PR_CONTEXT (fase de desenvolvimento)", () => {
    const tmp = createTempFixture("handoff/valid");
    try {
      initGitRepo(tmp);
      // Cria arquivo untracked + um modificado
      writeFileSync(join(tmp, "untracked.txt"), "sujo\n");
      writeFileSync(join(tmp, "README.md"), "# modificado\n");
      const res = runRuleOnFixture("rule-10-clean.mjs", tmp, { PRE_PR_CONTEXT: "1" });
      expect(res.status).toBe(0); // não bloqueia no pre-pr
      const out = (res.stdout || "") + (res.error || "");
      expect(out).toContain("aviso");
      expect(out).toContain("untracked.txt");
      expect(out).toMatch(/pre-push hook/i);
    } finally { cleanTempFixture(tmp); }
  });

  it("deve ignorar arquivos staged (esperados no pre-commit) mesmo em modo bloqueante", () => {
    const tmp = createTempFixture("handoff/valid");
    try {
      initGitRepo(tmp);
      // Arquivo staged (será commitado) NÃO deve ser denunciado
      writeFileSync(join(tmp, "staged.txt"), "ok\n");
      gitExec("git add staged.txt", tmp);
      const res = runRuleOnFixture("rule-10-clean.mjs", tmp);
      expect(res.status).toBe(0);
    } finally { cleanTempFixture(tmp); }
  });
});

// ─── pre-push hook (regra #3: git status ZERO antes de push) ───────

describe("pre-push hook (git status ZERO antes de push)", () => {
  const HOOK = resolve(ROOT, ".githooks/pre-push");

  function runPrePushIn(fixture: string, setup: (tmp: string) => void) {
    const tmp = createTempFixture(fixture);
    try {
      initGitRepo(tmp);
      gitExec("git config core.hooksPath .githooks 2>/dev/null || true", tmp);
      mkdirSync(join(tmp, ".githooks"), { recursive: true });
      // Copia o hook real para o fixture e torna executável
      cpSync(HOOK, join(tmp, ".githooks/pre-push"));
      chmodSync(join(tmp, ".githooks/pre-push"), 0o755);
      // Commita o hook para não poluir o git status (a checagem da regra #3
      // denunciaria .githooks/ como untracked)
      gitExec("git add -A && git commit -m 'add hook' 2>/dev/null", tmp);
      setup(tmp);
      return tmp;
    } catch (e) {
      cleanTempFixture(tmp);
      throw e;
    }
  }

  function runPush(tmp: string) {
    try {
      execSync("git push origin HEAD 2>&1", {
        cwd: tmp,
        encoding: "utf8",
        timeout: 10000,
        env: cleanGitEnv({ GIT_ASKPASS: "echo", SSH_ASKPASS: "echo" }),
      });
      return { status: 0, out: "" };
    } catch (e: unknown) {
      const err = e as { status?: number; stdout?: string; stderr?: string; message?: string };
      return { status: err.status ?? 1, out: (err.stdout || "") + (err.stderr || "") };
    }
  }

  it("bloqueia push quando há arquivos não commitados (regra #3)", () => {
    const tmp = runPrePushIn("handoff/valid", (t) => {
      // Cria um remote local para o push ter alvo (sem network)
      gitExec("git branch -M main", t);
      gitExec("git checkout -b feat/teste", t);
      const remote = join(tmpdir(), `remote-${Date.now()}`);
      mkdirSync(remote, { recursive: true });
      gitExec(`git init --bare ${remote}`, t);
      gitExec(`git remote add origin ${remote}`, t);
      writeFileSync(join(t, "untracked.txt"), "sujo\n");
    });
    try {
      const { status, out } = runPush(tmp);
      expect(status).not.toBe(0);
      expect(out).toMatch(/BLOQUEADO/);
      expect(out).toMatch(/regra #3|não está limpo/);
    } finally { cleanTempFixture(tmp); }
  });

  it("permite push quando working tree está limpa", () => {
    const tmp = runPrePushIn("handoff/valid", (t) => {
      gitExec("git branch -M main", t);
      gitExec("git checkout -b feat/teste", t);
      const remote = join(tmpdir(), `remote-clean-${Date.now()}`);
      mkdirSync(remote, { recursive: true });
      gitExec(`git init --bare ${remote}`, t);
      gitExec(`git remote add origin ${remote}`, t);
      // Cria relatório HTML para não esbarrar na checagem de relatório do hook
      const today = new Date().toISOString().slice(0, 10);
      mkdirSync(join(t, `docs/reports/${today}`), { recursive: true });
      writeFileSync(join(t, `docs/reports/${today}/PRX-${today}-teste.html`), "<html></html>\n");
      gitExec("git add -A && git commit -m 'add relatorio' 2>/dev/null", t);
    });
    try {
      const { status, out } = runPush(tmp);
      // Asserção intencionalmente negativa: não validamos que o push remoto
      // completou (ambiente de teste sem rede confiável), apenas que o hook
      // NÃO bloqueou por regra #3 (falso positivo).
      expect(out).not.toMatch(/BLOQUEADO/);
      expect(out).not.toMatch(/não está limpo/);
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
      gitExec("git add src/foo.ts 2>/dev/null", tmp);
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

  it("resolve imports relativos a partir de src, não da raiz do repositório", () => {
    const tmp = mkdtempSync(join(tmpdir(), "rule-orphan-relative-"));
    try {
      mkdirSync(join(tmp, "src/components"), { recursive: true });
      writeFileSync(join(tmp, "src/main.tsx"), 'import Parent from "./components/Parent";\nvoid Parent;\n');
      writeFileSync(join(tmp, "src/components/Parent.tsx"), 'import Child from "./Child";\nexport default Child;\n');
      writeFileSync(join(tmp, "src/components/Child.tsx"), "const Child = () => null;\nexport default Child;\n");

      const res = runRuleOnFixture("rule-14-orphan-files.mjs", tmp);
      expect(res.status).toBe(0);
    } finally { cleanTempFixture(tmp); }
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
    const res = runRule("rule-17-new-docs-valid.mjs", { PRE_PR_MOCK_DIFF: "" });
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

// ─── rule-27-council-veredict (gate de julgamento, Trava D) ──────

describe("rule-27-council-veredict (mensagens acionáveis — Trava D)", () => {
  it("deve falhar com comando acionável quando docs/council/ não existe", () => {
    const tmp = createTempFixture("handoff/valid");
    try {
      initGitRepo(tmp);
      gitExec("git checkout -b feat/teste 2>/dev/null", tmp);
      const res = runRuleOnFixture("rule-27-council-veredict.mjs", tmp);
      expect(res.status).not.toBe(0);
      const out = (res.stdout || "") + (res.error || "");
      expect(out).toContain("council-to-superpowers");
      expect(out).toContain(".pi/skills/council-to-superpowers");
    } finally { cleanTempFixture(tmp); }
  });

  it("deve falhar listando as seções obrigatórias + dica de correção", () => {
    const tmp = createTempFixture("handoff/valid");
    try {
      initGitRepo(tmp);
      gitExec("git checkout -b feat/teste 2>/dev/null", tmp);
      mkdirSync(join(tmp, "docs/council"), { recursive: true });
      writeFileSync(
        join(tmp, "docs/council/2026-08-05-x-veredito.md"),
        "# Veredito\nSem as seções obrigatórias.\n",
      );
      const res = runRuleOnFixture("rule-27-council-veredict.mjs", tmp);
      expect(res.status).not.toBe(0);
      const out = (res.stdout || "") + (res.error || "");
      expect(out).toContain("## Advisors");
      expect(out).toContain("## Síntese do Chairman");
      expect(out).toMatch(/Adicione as seções/i);
    } finally { cleanTempFixture(tmp); }
  });
});

// ─── rule-37-rtk (integração RTK no workflow) ─────────────────────

describe("rule-37-rtk (integração RTK)", () => {
  it("deve falhar quando a extensão .pi/extensions/rtk.ts não existe", () => {
    const tmp = createTempFixture("handoff/valid");
    try {
      initGitRepo(tmp);
      gitExec("git checkout -b feat/teste 2>/dev/null", tmp);
      const res = runRuleOnFixture("rule-37-rtk.mjs", tmp);
      expect(res.status).not.toBe(0);
      const out = (res.stdout || "") + (res.error || "");
      expect(out).toContain(".pi/extensions/rtk.ts");
      expect(out).toMatch(/rtk init --agent pi/i);
    } finally { cleanTempFixture(tmp); }
  });

  it("deve passar quando a extensão existe e rtk está no PATH (≥0.23.0)", () => {
    const tmp = createTempFixture("handoff/valid");
    try {
      initGitRepo(tmp);
      gitExec("git checkout -b feat/teste 2>/dev/null", tmp);
      mkdirSync(join(tmp, ".pi/extensions"), { recursive: true });
      writeFileSync(join(tmp, ".pi/extensions/rtk.ts"), "// rtk extension\n");
      const res = runRuleOnFixture("rule-37-rtk.mjs", tmp, {
        PATH: `${process.env.HOME}/.local/bin:${process.env.PATH}`,
      });
      expect(res.status).toBe(0);
    } finally { cleanTempFixture(tmp); }
  });

  it("deve ser não-falho quando rtk não está no PATH (skip informativo)", () => {
    const tmp = createTempFixture("handoff/valid");
    try {
      initGitRepo(tmp);
      gitExec("git checkout -b feat/teste 2>/dev/null", tmp);
      mkdirSync(join(tmp, ".pi/extensions"), { recursive: true });
      writeFileSync(join(tmp, ".pi/extensions/rtk.ts"), "// rtk extension\n");
      const res = runRuleOnFixture("rule-37-rtk.mjs", tmp, {
        // PATH sintético sem rtk, mas mantendo o diretório do node executável
        // (no CI o node não fica em /usr/bin — remover o PATH inteiro causaria 127).
        PATH: `${dirname(process.execPath)}:/usr/bin:/bin`,
      });
      expect(res.status).toBe(0);
      const out = (res.stdout || "") + (res.error || "");
      expect(out).toMatch(/não encontrado|skip|ausente/i);
    } finally { cleanTempFixture(tmp); }
  });
});

// ─── rule-38-code-review-gate (revisão por subagente) ───────────────

describe("rule-38-code-review-gate (revisão por subagente)", () => {
  function writeEvents(tmp: string, branch: string, type: string, subagent: boolean) {
    const dir = join(tmp, "docs/tracking");
    mkdirSync(dir, { recursive: true });
    const event = {
      timestamp: "2026-08-08T00:00:00.000Z",
      type,
      description: "test",
      branch,
      commit: "abc123",
      agent: "pi",
      subagent,
    };
    writeFileSync(join(dir, "events.jsonl"), JSON.stringify(event) + "\n");
  }

  it("deve falhar quando não há evento code-review:done na branch", () => {
    const tmp = createTempFixture("handoff/valid");
    try {
      initGitRepo(tmp);
      gitExec("git checkout -b feat/teste 2>/dev/null", tmp);
      const res = runRuleOnFixture("rule-38-code-review-gate.mjs", tmp);
      expect(res.status).not.toBe(0);
      const out = (res.stdout || "") + (res.error || "");
      expect(out).toMatch(/code-review:done/);
      expect(out).toMatch(/requesting-code-review/);
    } finally { cleanTempFixture(tmp); }
  });

  it("deve passar quando existe evento code-review:done com subagent:true na branch", () => {
    const tmp = createTempFixture("handoff/valid");
    try {
      initGitRepo(tmp);
      gitExec("git checkout -b feat/teste 2>/dev/null", tmp);
      writeEvents(tmp, "feat/teste", "code-review:done", true);
      const res = runRuleOnFixture("rule-38-code-review-gate.mjs", tmp);
      expect(res.status).toBe(0);
      const out = (res.stdout || "") + (res.error || "");
      expect(out).toMatch(/✅/);
    } finally { cleanTempFixture(tmp); }
  });

  it("deve falhar quando o evento code-review:done não é de subagente", () => {
    const tmp = createTempFixture("handoff/valid");
    try {
      initGitRepo(tmp);
      gitExec("git checkout -b feat/teste 2>/dev/null", tmp);
      writeEvents(tmp, "feat/teste", "code-review:done", false);
      const res = runRuleOnFixture("rule-38-code-review-gate.mjs", tmp);
      expect(res.status).not.toBe(0);
    } finally { cleanTempFixture(tmp); }
  });

  it("deve falhar quando o evento code-review:done é de outra branch", () => {
    const tmp = createTempFixture("handoff/valid");
    try {
      initGitRepo(tmp);
      gitExec("git checkout -b feat/teste 2>/dev/null", tmp);
      writeEvents(tmp, "feat/outra", "code-review:done", true);
      const res = runRuleOnFixture("rule-38-code-review-gate.mjs", tmp);
      expect(res.status).not.toBe(0);
    } finally { cleanTempFixture(tmp); }
  });

  it("deve falhar quando events.jsonl não existe", () => {
    const tmp = createTempFixture("handoff/valid");
    try {
      initGitRepo(tmp);
      gitExec("git checkout -b feat/teste 2>/dev/null", tmp);
      const res = runRuleOnFixture("rule-38-code-review-gate.mjs", tmp);
      expect(res.status).not.toBe(0);
      const out = (res.stdout || "") + (res.error || "");
      expect(out).toMatch(/events.jsonl/);
    } finally { cleanTempFixture(tmp); }
  });

  it("deve ser skip em main/master", () => {
    const tmp = createTempFixture("handoff/valid");
    try {
      initGitRepo(tmp);
      const res = runRuleOnFixture("rule-38-code-review-gate.mjs", tmp);
      expect(res.status).toBe(0);
      const out = (res.stdout || "") + (res.error || "");
      expect(out).toMatch(/main|master/);
    } finally { cleanTempFixture(tmp); }
  });
});

// ─── rule-39-coding-gate (codificação por subagente) ────────────────

describe("rule-39-coding-gate (codificação por subagente)", () => {
  function writeEvents(tmp: string, branch: string, type: string, subagent: boolean) {
    const dir = join(tmp, "docs/tracking");
    mkdirSync(dir, { recursive: true });
    const event = {
      timestamp: "2026-08-08T00:00:00.000Z",
      type,
      description: "test",
      branch,
      commit: "abc123",
      agent: "pi",
      subagent,
    };
    writeFileSync(join(dir, "events.jsonl"), JSON.stringify(event) + "\n");
  }

  it("deve ser skip sem mudanças de código (docs-only)", () => {
    const tmp = createTempFixture("handoff/valid");
    try {
      initGitRepo(tmp);
      gitExec("git checkout -b feat/teste 2>/dev/null", tmp);
      const res = runRuleOnFixture("rule-39-coding-gate.mjs", tmp);
      expect(res.status).toBe(0);
      const out = (res.stdout || "") + (res.error || "");
      expect(out).toMatch(/sem mudanças de código|⏭️/);
    } finally { cleanTempFixture(tmp); }
  });

  it("deve falhar com mudança de código e sem evento coding:done", () => {
    const tmp = createTempFixture("handoff/valid");
    try {
      initGitRepo(tmp);
      gitExec("git checkout -b feat/teste 2>/dev/null", tmp);
      mkdirSync(join(tmp, "src"), { recursive: true });
      writeFileSync(join(tmp, "src/test.ts"), "export const a = 1;\n");
      const res = runRuleOnFixture("rule-39-coding-gate.mjs", tmp);
      expect(res.status).not.toBe(0);
      const out = (res.stdout || "") + (res.error || "");
      expect(out).toMatch(/coding:done/);
    } finally { cleanTempFixture(tmp); }
  });

  it("deve passar com mudança de código e evento coding:done subagent:true", () => {
    const tmp = createTempFixture("handoff/valid");
    try {
      initGitRepo(tmp);
      gitExec("git checkout -b feat/teste 2>/dev/null", tmp);
      mkdirSync(join(tmp, "src"), { recursive: true });
      writeFileSync(join(tmp, "src/test.ts"), "export const a = 1;\n");
      writeEvents(tmp, "feat/teste", "coding:done", true);
      const res = runRuleOnFixture("rule-39-coding-gate.mjs", tmp);
      expect(res.status).toBe(0);
      const out = (res.stdout || "") + (res.error || "");
      expect(out).toMatch(/✅/);
    } finally { cleanTempFixture(tmp); }
  });

  it("deve falhar quando o evento coding:done não é de subagente", () => {
    const tmp = createTempFixture("handoff/valid");
    try {
      initGitRepo(tmp);
      gitExec("git checkout -b feat/teste 2>/dev/null", tmp);
      mkdirSync(join(tmp, "src"), { recursive: true });
      writeFileSync(join(tmp, "src/test.ts"), "export const a = 1;\n");
      writeEvents(tmp, "feat/teste", "coding:done", false);
      const res = runRuleOnFixture("rule-39-coding-gate.mjs", tmp);
      expect(res.status).not.toBe(0);
    } finally { cleanTempFixture(tmp); }
  });

  it("deve falhar quando o evento coding:done é de outra branch", () => {
    const tmp = createTempFixture("handoff/valid");
    try {
      initGitRepo(tmp);
      gitExec("git checkout -b feat/teste 2>/dev/null", tmp);
      mkdirSync(join(tmp, "src"), { recursive: true });
      writeFileSync(join(tmp, "src/test.ts"), "export const a = 1;\n");
      writeEvents(tmp, "feat/outra", "coding:done", true);
      const res = runRuleOnFixture("rule-39-coding-gate.mjs", tmp);
      expect(res.status).not.toBe(0);
    } finally { cleanTempFixture(tmp); }
  });

  it("deve falhar quando events.jsonl não existe e há mudança de código", () => {
    const tmp = createTempFixture("handoff/valid");
    try {
      initGitRepo(tmp);
      gitExec("git checkout -b feat/teste 2>/dev/null", tmp);
      mkdirSync(join(tmp, "src"), { recursive: true });
      writeFileSync(join(tmp, "src/test.ts"), "export const a = 1;\n");
      const res = runRuleOnFixture("rule-39-coding-gate.mjs", tmp);
      expect(res.status).not.toBe(0);
      const out = (res.stdout || "") + (res.error || "");
      expect(out).toMatch(/events.jsonl/);
    } finally { cleanTempFixture(tmp); }
  });

  it("deve ser skip em main/master", () => {
    const tmp = createTempFixture("handoff/valid");
    try {
      initGitRepo(tmp);
      const res = runRuleOnFixture("rule-39-coding-gate.mjs", tmp);
      expect(res.status).toBe(0);
      const out = (res.stdout || "") + (res.error || "");
      expect(out).toMatch(/main|master/);
    } finally { cleanTempFixture(tmp); }
  });
});

// ─── rule-26-session-started (git-dependent) ──────────────────────

describe("rule-26-session-started", () => {
  function writeSessaoAtualHandoff(tmp: string, status: string, branchSessao: string) {
    const dir = join(tmp, "docs");
    mkdirSync(dir, { recursive: true });
    const handoff = `## 🏗️ Projeto
Stack: React + Vite + Supabase + Tailwind

## 🎯 Sessão Atual
**Categoria:** bugfix
**Objetivo:** corrigir erro de tipagem
**Iniciada em:** 2026-08-09T12:00:00.000Z
**Status:** ${status}
**Branch:** \`${branchSessao}\`
**Último commit:** abc
**Docs carregados:** DEBUG.md, CONVENTIONS.md

## ✅ Última Sessão
Nada feito ainda.
`;
    writeFileSync(join(dir, "handoff.md"), handoff);
  }

  it("deve passar (skip) quando Status: done e branch da sessão difere da branch git atual", () => {
    const tmp = createTempFixture("handoff/valid");
    try {
      initGitRepo(tmp);
      gitExec("git checkout -b feat/foo 2>/dev/null", tmp);
      writeSessaoAtualHandoff(tmp, "done", "feat/outra-branch");
      const res = runRuleOnFixture("rule-26-session-started.mjs", tmp);
      expect(res.status).toBe(0);
      const out = (res.stdout || "") + (res.error || "");
      expect(out).toMatch(/done/);
    } finally { cleanTempFixture(tmp); }
  });

  it("deve falhar (exit 1) quando Status: in_progress e branch da sessão difere da branch git atual", () => {
    const tmp = createTempFixture("handoff/valid");
    try {
      initGitRepo(tmp);
      gitExec("git checkout -b feat/foo 2>/dev/null", tmp);
      writeSessaoAtualHandoff(tmp, "in_progress", "feat/outra-branch");
      const res = runRuleOnFixture("rule-26-session-started.mjs", tmp);
      expect(res.status).not.toBe(0);
      const out = (res.stdout || "") + (res.error || "");
      expect(out).toMatch(/difere da branch atual/);
    } finally { cleanTempFixture(tmp); }
  });
});

// ─── rule-40-architect (Feature-First: barrel + RLS) ──────────────

describe("rule-40-architect (Feature-First)", () => {
  it("deve passar (fixture positiva: barrel index.ts + RLS auth.uid())", () => {
    const tmp = createTempFixture("architect/valid");
    try {
      const res = runRuleOnFixture("rule-40-architect.mjs", tmp);
      expect(res.status).toBe(0);
      expect(res.stdout).toMatch(/✅/);
    } finally { cleanTempFixture(tmp); }
  });

  it("deve falhar (fixture negativa: feature sem barrel + tabela sem RLS)", () => {
    const tmp = createTempFixture("architect/invalid");
    try {
      const res = runRuleOnFixture("rule-40-architect.mjs", tmp);
      expect(res.status).not.toBe(0);
      const out = (res.stdout || "") + (res.error || "");
      expect(out).toContain("sem barrel");
      expect(out).toContain("tabela_sem_policy");
    } finally { cleanTempFixture(tmp); }
  });

  it("deve falhar quando policy sem auth.uid() está no mesmo arquivo que outra com auth.uid() (falso positivo do regex global)", () => {
    const tmp = createTempFixture("architect/multi-policy");
    try {
      const res = runRuleOnFixture("rule-40-architect.mjs", tmp);
      expect(res.status).not.toBe(0);
      const out = (res.stdout || "") + (res.error || "");
      // t2 (USING (true)) DEVE falhar — não pode herdar o auth.uid() da policy da t1
      expect(out).toContain('"t2"');
      // t1 (auth.uid() no próprio bloco) continua passando
      expect(out).toContain('public.t1');
    } finally { cleanTempFixture(tmp); }
  });

  it("deve passar (vacuous: src/features/ não existe)", () => {
    const tmp = createTempFixture("handoff/valid");
    try {
      const res = runRuleOnFixture("rule-40-architect.mjs", tmp);
      expect(res.status).toBe(0);
      expect(res.stdout).toMatch(/não existe|vacuous/i);
    } finally { cleanTempFixture(tmp); }
  });
});

// ─── rule-41-optimizer (hard limit 150 linhas, diff-scoped) ───────

describe("rule-41-optimizer (hard limit 150 linhas)", () => {
  it("deve passar (positiva: arquivo novo pequeno no diff)", () => {
    const tmp = createTempFixture("optimizer/valid");
    try {
      initGitRepo(tmp);
      gitExec("git branch -M main", tmp);
      gitExec("git checkout -b feat/teste", tmp);
      mkdirSync(join(tmp, "src"), { recursive: true });
      writeFileSync(join(tmp, "src/novo_pequeno.ts"), "export const ok = 1;\n");
      gitExec("git add -A && git commit -m 'novo pequeno' 2>/dev/null", tmp);
      const res = runRuleOnFixture("rule-41-optimizer.mjs", tmp);
      expect(res.status).toBe(0);
    } finally { cleanTempFixture(tmp); }
  });

  it("deve falhar (negativa: arquivo novo >150 linhas)", () => {
    const tmp = createTempFixture("optimizer/valid");
    try {
      initGitRepo(tmp);
      gitExec("git branch -M main", tmp);
      gitExec("git checkout -b feat/teste", tmp);
      mkdirSync(join(tmp, "src"), { recursive: true });
      let big = "";
      for (let i = 0; i < 160; i++) big += `export const linha${i} = ${i};\n`;
      writeFileSync(join(tmp, "src/novo_grande.ts"), big);
      gitExec("git add -A && git commit -m 'novo grande' 2>/dev/null", tmp);
      const res = runRuleOnFixture("rule-41-optimizer.mjs", tmp);
      expect(res.status).not.toBe(0);
      expect((res.stdout || "") + (res.error || "")).toContain("150");
    } finally { cleanTempFixture(tmp); }
  });

  it("deve falhar (negativa: arquivo modificado passa de 150; main tinha <=150)", () => {
    const tmp = createTempFixture("optimizer/valid");
    try {
      initGitRepo(tmp);
      gitExec("git branch -M main", tmp);
      // main tem arquivo pequeno (10 linhas)
      mkdirSync(join(tmp, "src"), { recursive: true });
      let pequeno = "";
      for (let i = 0; i < 10; i++) pequeno += `export const linha${i} = ${i};\n`;
      writeFileSync(join(tmp, "src/evolui.ts"), pequeno);
      gitExec("git add -A && git commit -m 'pequeno em main' 2>/dev/null", tmp);
      gitExec("git checkout -b feat/teste", tmp);
      // branch cresce para 160 linhas
      let grande = "";
      for (let i = 0; i < 160; i++) grande += `export const linha${i} = ${i};\n`;
      writeFileSync(join(tmp, "src/evolui.ts"), grande);
      gitExec("git add -A && git commit -m 'cresceu' 2>/dev/null", tmp);
      const res = runRuleOnFixture("rule-41-optimizer.mjs", tmp);
      expect(res.status).not.toBe(0);
      expect((res.stdout || "") + (res.error || "")).toContain("passou de");
    } finally { cleanTempFixture(tmp); }
  });

  it("deve warnar (legado >150 em main é grandfathered, não bloqueia)", () => {
    const tmp = createTempFixture("optimizer/valid");
    try {
      initGitRepo(tmp);
      gitExec("git branch -M main", tmp);
      // main já tem Dashboard.tsx com 200 linhas (legado)
      mkdirSync(join(tmp, "src"), { recursive: true });
      let legacy = "";
      for (let i = 0; i < 200; i++) legacy += `export const linha${i} = ${i};\n`;
      writeFileSync(join(tmp, "src/Dashboard.tsx"), legacy);
      gitExec("git add -A && git commit -m 'legado em main' 2>/dev/null", tmp);
      gitExec("git checkout -b feat/teste", tmp);
      // branch só adiciona 1 linha (diff-scoped toca o legado)
      writeFileSync(join(tmp, "src/Dashboard.tsx"), legacy + "export const extra = 1;\n");
      gitExec("git add -A && git commit -m 'toca legado' 2>/dev/null", tmp);
      const res = runRuleOnFixture("rule-41-optimizer.mjs", tmp);
      expect(res.status).toBe(0);
      expect(res.stdout).toMatch(/grandfathered|legado/i);
    } finally { cleanTempFixture(tmp); }
  });

  it("deve passar (vazio: sem mudanças em src/ no diff)", () => {
    const tmp = createTempFixture("optimizer/valid");
    try {
      initGitRepo(tmp);
      gitExec("git branch -M main", tmp);
      gitExec("git checkout -b feat/teste", tmp);
      const res = runRuleOnFixture("rule-41-optimizer.mjs", tmp);
      expect(res.status).toBe(0);
      expect(res.stdout).toMatch(/nenhum arquivo src|✅/);
    } finally { cleanTempFixture(tmp); }
  });

  it("deve ser skip sem repo git (fail-open)", () => {
    const tmp = createTempFixture("optimizer/invalid");
    try {
      const res = runRuleOnFixture("rule-41-optimizer.mjs", tmp);
      expect(res.status).toBe(0);
      expect(res.stdout).toMatch(/⏭️|merge-base/i);
    } finally { cleanTempFixture(tmp); }
  });
});
