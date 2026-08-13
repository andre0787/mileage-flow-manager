import { describe, expect, it } from "vitest";
import { execFileSync } from "child_process";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";

const CLI = resolve(__dirname, "../../scripts/project-audit.mjs");

function makeRepo(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), "project-audit-"));
  const env = { ...process.env };
  for (const key of [
    "GIT_DIR",
    "GIT_WORK_TREE",
    "GIT_INDEX_FILE",
    "GIT_COMMON_DIR",
    "GIT_PREFIX",
  ]) {
    delete env[key];
  }
  execFileSync("git", ["init", "-q"], { cwd: dir, env });
  execFileSync("git", ["config", "user.email", "t@t.com"], { cwd: dir, env });
  execFileSync("git", ["config", "user.name", "T"], { cwd: dir, env });
  for (const [rel, content] of Object.entries(files)) {
    const abs = join(dir, rel);
    mkdirSync(resolve(abs, ".."), { recursive: true });
    writeFileSync(abs, content);
  }
  execFileSync("git", ["add", "-A"], { cwd: dir, env });
  execFileSync("git", ["commit", "-qm", "init"], { cwd: dir, env });
  return { dir, env };
}

function runAudit(root: string, args: string[] = []) {
  try {
    const env = { ...process.env, MOCK_ROOT: root };
    for (const key of [
      "GIT_DIR",
      "GIT_WORK_TREE",
      "GIT_INDEX_FILE",
      "GIT_COMMON_DIR",
      "GIT_PREFIX",
    ]) {
      delete env[key];
    }
    const stdout = execFileSync(process.execPath, [CLI, ...args], {
      cwd: root,
      encoding: "utf8",
      env,
      timeout: 15000,
    });
    return { status: 0, stdout };
  } catch (error) {
    const e = error as { status?: number; stdout?: string };
    return { status: e.status ?? 1, stdout: e.stdout ?? "" };
  }
}

describe("project-audit CLI", () => {
  it("modo padrão não cria arquivos e --json retorna o contrato", () => {
    const { dir } = makeRepo({
      "src/pages/KPI.tsx": "export const a = 1;\n",
      "docs/handoff.md": "# h\n",
    });

    const before = new Set(
      execFileSync("git", ["ls-files"], { cwd: dir, encoding: "utf8" }).trim().split("\n"),
    );
    const result = runAudit(dir, ["--json"]);
    const after = new Set(
      execFileSync("git", ["ls-files"], { cwd: dir, encoding: "utf8" }).trim().split("\n"),
    );

    expect(result.status).toBe(0);
    expect([...after].sort()).toEqual([...before].sort());
    const parsed = JSON.parse(result.stdout);
    expect(parsed).toHaveProperty("generatedAt");
    expect(parsed).toHaveProperty("checks");
    expect(parsed).toHaveProperty("findings");
  });

  it("--strict sai 1 para artefato gerado crítico", () => {
    const { dir } = makeRepo({
      "playwright-report/index.html": "<html></html>\n",
      "src/pages/KPI.tsx": "export const a = 1;\n",
      "docs/handoff.md": "# h\n",
    });

    const result = runAudit(dir, ["--strict"]);
    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(/playwright-report\/index\.html/);
  });

  it("--strict não reporta relatório gerado não rastreado e preserva o arquivo", () => {
    const { dir } = makeRepo({
      "src/pages/KPI.tsx": "export const a = 1;\n",
      "docs/handoff.md": "# h\n",
    });
    // Relatório gerado localmente, mas não versionado (pós .gitignore).
    mkdirSync(join(dir, "playwright-report"), { recursive: true });
    writeFileSync(join(dir, "playwright-report/index.html"), "<html>local</html>\n");

    const result = runAudit(dir, ["--json"]);
    const parsed = JSON.parse(result.stdout);
    // O finding de artefato gerado só existe quando o caminho é rastreado.
    expect(
      parsed.findings.some((f: { path: string }) => f.path.startsWith("playwright-report/")),
    ).toBe(false);
    // “Read-only”: o arquivo local jamais é apagado pela auditoria.
    expect(existsSync(join(dir, "playwright-report/index.html"))).toBe(true);
  });

  it("--json só contém caminhos/categorias e nunca conteúdo de arquivo", () => {
    const { dir } = makeRepo({
      "playwright-report/index.html": "SECRET-CONTENT-123\n",
    });

    const result = runAudit(dir, ["--json"]);
    expect(result.status).toBe(0);
    expect(result.stdout).not.toContain("SECRET-CONTENT-123");
    const parsed = JSON.parse(result.stdout);
    expect(
      parsed.findings.some((f: { path: string }) => f.path === "playwright-report/index.html"),
    ).toBe(true);
  });

  it("arquivo ignorado local não aparece como finding rastreado", () => {
    const { dir } = makeRepo({
      "src/pages/KPI.tsx": "export const a = 1;\n",
    });
    mkdirSync(join(dir, "tests/fluxo-relatorio"), { recursive: true });
    writeFileSync(join(dir, "tests/fluxo-relatorio/nota.md"), "# local\n");

    const result = runAudit(dir, ["--json"]);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.findings.some((f: { path: string }) => f.path.includes("fluxo-relatorio"))).toBe(
      false,
    );
    expect(existsSync(join(dir, "tests/fluxo-relatorio/nota.md"))).toBe(true);
  });

  it("inclui checks nomeados para cada domínio de auditoria", () => {
    const { dir } = makeRepo({
      "src/pages/KPI.tsx": "export const a = 1;\n",
    });

    const result = runAudit(dir, ["--json"]);
    const parsed = JSON.parse(result.stdout);
    const names = parsed.checks.map((c: { rule: string }) => c.rule);
    for (const expected of [
      "rule-14-orphan-files",
      "rule-15-duplicate-code",
      "rule-16-orphan-scripts",
      "rule-18-no-duplicate-root-docs",
      "rule-23-skill-orphans",
      "rule-31-lib-test-coverage",
      "rule-32-component-test-coverage",
      "rule-42-coverage-gate",
      "verify-docs",
    ]) {
      expect(names).toContain(expected);
    }
  });
});
