import { describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { execSync } from "child_process";
import { healSession } from "../../scripts/lib/session-heal.mjs";

/**
 * session-heal — auto-correção de violações mecânicas de sessão no handoff.
 *
 * Travas do council (2026-08-05): rule-26 (branch da sessão ≠ branch atual)
 * e rule-02 (docs carregados ≠ categoria) são 100% mecânicas — o script tem
 * toda a informação para corrigir; o humano não deve pagar fricção por isso.
 */

function makeRepo() {
  const dir = mkdtempSync(join(tmpdir(), "session-heal-"));
  const env = { ...process.env };
  for (const key of ["GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_COMMON_DIR", "GIT_PREFIX"]) {
    delete env[key];
  }
  execSync("git init -q", { cwd: dir, env });
  execSync('git config user.email "t@t.com" && git config user.name "T"', { cwd: dir, env });
  writeFileSync(join(dir, "README.md"), "# r\n");
  execSync("git add -A && git commit -qm init", { cwd: dir, env });
  execSync("git checkout -qb feat/minha-branch", { cwd: dir, env });
  return { dir, env };
}

function writeHandoff(dir, session) {
  execSync("mkdir -p docs", { cwd: dir });
  writeFileSync(join(dir, "docs/handoff.md"), `# Handoff\n\n${session}\n\n---\n# Fim\n`);
}

const SESS_BRANCH_ERRADA = `## 🎯 Sessão Atual
**Categoria:** chore
**Objetivo:** teste
**Status:** in_progress
**Iniciada em:** 2026-08-05T00:00:00.000Z
**Branch:** \`feat/outra-branch\`
**Último commit:** abc
**Docs carregados:** AGENTS.md`;

const SESS_DOCS_ERRADOS = `## 🎯 Sessão Atual
**Categoria:** chore
**Objetivo:** teste
**Status:** in_progress
**Iniciada em:** 2026-08-05T00:00:00.000Z
**Branch:** \`feat/minha-branch\`
**Último commit:** abc
**Docs carregados:** WORKFLOW.md, CONVENTIONS.md`;

const SESS_OK = `## 🎯 Sessão Atual
**Categoria:** chore
**Objetivo:** teste
**Status:** in_progress
**Iniciada em:** 2026-08-05T00:00:00.000Z
**Branch:** \`feat/minha-branch\`
**Último commit:** abc
**Docs carregados:** AGENTS.md`;

describe("healSession — Trava B (rule-26) e Trava E (rule-02)", () => {
  it("branch da sessão diverge da atual → corrige e retorna ['rule-26']", () => {
    const { dir } = makeRepo();
    writeHandoff(dir, SESS_BRANCH_ERRADA);
    const healed = healSession(dir);
    expect(healed).toEqual(["rule-26"]);
    const md = readFileSync(join(dir, "docs/handoff.md"), "utf8");
    expect(md).toContain("**Branch:** `feat/minha-branch`");
  });

  it("docs carregados não correspondem à categoria → corrige e retorna ['rule-02']", () => {
    const { dir } = makeRepo();
    writeHandoff(dir, SESS_DOCS_ERRADOS);
    const healed = healSession(dir);
    expect(healed).toEqual(["rule-02"]);
    const md = readFileSync(join(dir, "docs/handoff.md"), "utf8");
    expect(md).toContain("**Docs carregados:** AGENTS.md");
  });

  it("sessão consistente → nenhum heal (retorna [])", () => {
    const { dir } = makeRepo();
    writeHandoff(dir, SESS_OK);
    const healed = healSession(dir);
    expect(healed).toEqual([]);
    const md = readFileSync(join(dir, "docs/handoff.md"), "utf8");
    expect(md).toContain(SESS_OK);
  });

  it("handoff inexistente → [] sem erro", () => {
    const { dir } = makeRepo();
    expect(healSession(dir)).toEqual([]);
  });

  it("handoff sem seção Sessão Atual → [] sem erro", () => {
    const { dir } = makeRepo();
    execSync("mkdir -p docs", { cwd: dir });
    writeFileSync(join(dir, "docs/handoff.md"), "# Handoff\n\n---\n");
    expect(healSession(dir)).toEqual([]);
  });

  it("em main/master não corrige (sessão não se aplica)", () => {
    const { dir, env } = makeRepo();
    execSync("git checkout -q master", { cwd: dir, env });
    writeHandoff(dir, SESS_BRANCH_ERRADA);
    expect(healSession(dir)).toEqual([]);
  });

  it("branch do git indisponível (falha) → não corrige, sem crash", () => {
    const { dir } = makeRepo();
    writeHandoff(dir, SESS_BRANCH_ERRADA);
    execSync("rm -rf .git", { cwd: dir });
    // Sem .git, não dá para saber a branch — deve ser tolerante
    expect(healSession(dir)).toEqual([]);
  });

  it("ambas divergências → corrige as duas (rule-26 + rule-02)", () => {
    const { dir } = makeRepo();
    const s = SESS_DOCS_ERRADOS.replace("feat/minha-branch", "feat/outra");
    writeHandoff(dir, s);
    const healed = healSession(dir);
    expect(healed.sort()).toEqual(["rule-02", "rule-26"]);
    const md = readFileSync(join(dir, "docs/handoff.md"), "utf8");
    expect(md).toContain("**Branch:** `feat/minha-branch`");
    expect(md).toContain("**Docs carregados:** AGENTS.md");
  });

  it("idempotente: segunda chamada não re-heala", () => {
    const { dir } = makeRepo();
    writeHandoff(dir, SESS_BRANCH_ERRADA);
    expect(healSession(dir)).toEqual(["rule-26"]);
    expect(healSession(dir)).toEqual([]);
  });
});
