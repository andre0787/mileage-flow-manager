/**
 * map-heal.test.ts — Testes do auto-registro de docs novos no MAP.md (Trava C).
 *
 * Council 2026-08-05, Fase 2: docs novos fora do MAP.md (rule-17 ×12) são
 * registrados automaticamente em uma seção dedicada "Índice Auto-Gerado"
 * com marcação `(auto)`, mantendo o índice curado intacto.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import { resolve, join } from "path";
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { healMapDocs } from "../../scripts/lib/map-heal.mjs";

const GIT_CONTEXT_KEYS = ["GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_COMMON_DIR", "GIT_PREFIX"];

function cleanGitEnv(extra: NodeJS.ProcessEnv = {}) {
  const env = { ...process.env, ...extra };
  for (const key of GIT_CONTEXT_KEYS) delete env[key];
  return env;
}

function gitExec(command: string, cwd: string) {
  return execSync(command, { cwd, encoding: "utf8", timeout: 5000, env: cleanGitEnv() });
}

function initGitRepo(dir: string) {
  gitExec("git init", dir);
  gitExec('git config user.email "test@test.com"', dir);
  gitExec('git config user.name "Test"', dir);
  const readme = join(dir, "README.md");
  if (!existsSync(readme)) writeFileSync(readme, "# Test Repo\n");
  gitExec("git add -A && git commit -m 'initial' 2>/dev/null", dir);
}

let tmp: string;

beforeAll(() => {
  tmp = mkdtempSync(join(tmpdir(), "map-heal-test-"));
  mkdirSync(join(tmp, "docs"), { recursive: true });
  mkdirSync(join(tmp, "docs/council"), { recursive: true });
  mkdirSync(join(tmp, "docs/reports"), { recursive: true });
  mkdirSync(join(tmp, "docs/archive"), { recursive: true });
  writeFileSync(
    join(tmp, "docs/MAP.md"),
    `# 🗺️ Mapa do Projeto\n\n## Docs de Código\n\n| Arquivo | Quando ler |\n|---------|-----------|\n| \`WORKFLOW.md\` | Antes de feature |\n`,
  );
  initGitRepo(tmp);
});

afterAll(() => {
  try { rmSync(tmp, { recursive: true, force: true }); } catch { /* ok */ }
});

describe("healMapDocs (Trava C — MAP.md auto-registrado)", () => {
  it("adiciona doc novo de docs/ ausente do MAP.md na seção auto com marcação (auto)", () => {
    writeFileSync(join(tmp, "docs/NOVO-DOC.md"), "# Novo Doc\n");
    const healed = healMapDocs(tmp);
    expect(healed).toContain("rule-17-new-docs-valid");

    const map = execSync("cat docs/MAP.md", { cwd: tmp, encoding: "utf8" });
    expect(map).toContain("## 🤖 Índice Auto-Gerado");
    expect(map).toContain("NOVO-DOC.md");
    expect(map).toMatch(/NOVO-DOC\.md.*\(auto\)/);
    // Índice curado intacto — seção original não foi tocada
    expect(map).toContain("## Docs de Código");
  });

  it("ignora docs fora da regra (reports, council, archive)", () => {
    writeFileSync(join(tmp, "docs/council/2026-08-05-x-veredito.md"), "# V\n");
    writeFileSync(join(tmp, "docs/reports/relatorio.md"), "# R\n");
    writeFileSync(join(tmp, "docs/archive/velho.md"), "# A\n");
    const healed = healMapDocs(tmp);
    expect(healed).not.toContain("rule-17-new-docs-valid");
  });

  it("é idempotente — doc já registrado não gera heal duplicado", () => {
    // NOVO-DOC.md foi registrado no primeiro teste; roda de novo
    const healed = healMapDocs(tmp);
    expect(healed).not.toContain("rule-17-new-docs-valid");
    const map = execSync("cat docs/MAP.md", { cwd: tmp, encoding: "utf8" });
    const occurrences = map.split("NOVO-DOC.md").length - 1;
    expect(occurrences).toBe(1);
  });

  it("cria o MAP.md se ele não existir (resiliente)", () => {
    const empty = mkdtempSync(join(tmpdir(), "map-heal-empty-"));
    try {
      mkdirSync(join(empty, "docs"), { recursive: true });
      initGitRepo(empty);
      writeFileSync(join(empty, "docs/outro.md"), "# O\n"); // após o commit inicial → untracked
      const healed = healMapDocs(empty);
      expect(healed).toContain("rule-17-new-docs-valid");
      expect(existsSync(join(empty, "docs/MAP.md"))).toBe(true);
    } finally {
      try { rmSync(empty, { recursive: true, force: true }); } catch { /* ok */ }
    }
  });

  it("não faz nada quando não há docs novos no diff", () => {
    const healed = healMapDocs(tmp);
    expect(healed).toEqual([]);
  });
});
