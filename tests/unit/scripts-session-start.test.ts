import { describe, it, expect, afterAll, beforeAll } from "vitest";
import { execSync } from "child_process";
import { resolve, join } from "path";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";

const ROOT = resolve(__dirname, "../..");
const SCRIPT = resolve(ROOT, "scripts/session-start.mjs");
// issue #567: o teste nunca toca o handoff real — cada worker usa uma cópia
// temporária via MILESCONTROL_HANDOFF (workers vitest em paralelo mutavam
// docs/handoff.md e o index.lock, flakando no CI full-suite).
const REAL_HANDOFF = resolve(ROOT, "docs/handoff.md");
let TMP_DIR: string;
let HANDOFF: string;
let originalHandoff: string;
const GIT_CONTEXT_KEYS = [
  "GIT_DIR",
  "GIT_WORK_TREE",
  "GIT_INDEX_FILE",
  "GIT_COMMON_DIR",
  "GIT_PREFIX",
];
const originalGitContext = Object.fromEntries(
  GIT_CONTEXT_KEYS.filter((key) => process.env[key] !== undefined).map((key) => [
    key,
    process.env[key],
  ]),
);

function restoreHandoff() {
  writeFileSync(
    HANDOFF,
    originalHandoff.replace(/## 🎯 Sessão Atual[\s\S]*?(?=\n## |\n---|$)/, ""),
  );
}

/** Lê a seção 🎯 Sessão Atual do handoff (cópia temp), ou null se não existir */
function getSessaoAtual() {
  const md = readFileSync(HANDOFF, "utf8");
  const m = md.match(/## 🎯 Sessão Atual[\s\S]*?(?=\n## |\n---|$)/);
  if (!m) return null;
  return {
    categoria: (m[0].match(/\*\*Categoria:\*\* (.+)/) || [])[1] || null,
    objetivo: (m[0].match(/\*\*Objetivo:\*\* (.+)/) || [])[1] || null,
    status: (m[0].match(/\*\*Status:\*\* (.+)/) || [])[1] || null,
  };
}

beforeAll(() => {
  for (const key of GIT_CONTEXT_KEYS) delete process.env[key];
  originalHandoff = readFileSync(REAL_HANDOFF, "utf8");
  TMP_DIR = mkdtempSync(join(tmpdir(), "session-start-test-"));
  HANDOFF = join(TMP_DIR, "handoff.md");
  writeFileSync(HANDOFF, originalHandoff, "utf8");
  process.env.MILESCONTROL_HANDOFF = HANDOFF;
  restoreHandoff();
});
afterAll(() => {
  delete process.env.MILESCONTROL_HANDOFF;
  try {
    rmSync(TMP_DIR, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
  for (const key of GIT_CONTEXT_KEYS) {
    if (originalGitContext[key] === undefined) delete process.env[key];
    else process.env[key] = originalGitContext[key];
  }
});

describe("session-start", () => {
  // ─── --set-category: validação ───

  it("--set-category categoria inválida → exit 1", () => {
    expect(() =>
      execSync(`node "${SCRIPT}" --set-category invalida objetivo`, {
        cwd: ROOT,
        encoding: "utf8",
        timeout: 15000,
      }),
    ).toThrow();
  });

  it("--set-category sem argumentos → exit 1", () => {
    expect(() =>
      execSync(`node "${SCRIPT}" --set-category`, {
        cwd: ROOT,
        encoding: "utf8",
        timeout: 15000,
      }),
    ).toThrow();
  });

  it("--set-category categoria vazia → exit 1", () => {
    expect(() =>
      execSync(`node "${SCRIPT}" --set-category "" "objetivo"`, {
        cwd: ROOT,
        encoding: "utf8",
        timeout: 15000,
      }),
    ).toThrow();
  });

  // ─── --set-category: sucesso ───

  it("--set-category docs → exit 0 e salva no handoff", () => {
    restoreHandoff();
    const out = execSync(`node "${SCRIPT}" --set-category docs "teste docs"`, {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 15000,
    });
    expect(out).toContain("✅ Sessão iniciada: docs — teste docs");
    expect(getSessaoAtual()?.categoria).toBe("docs");
    expect(getSessaoAtual()?.objetivo).toBe("teste docs");
    expect(getSessaoAtual()?.status).toBe("in_progress");
  });

  it("--set-category bugfix → exit 0", () => {
    restoreHandoff();
    const out = execSync(`node "${SCRIPT}" --set-category bugfix "corrige bug"`, {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 15000,
    });
    expect(out).toContain("✅ Sessão iniciada: bugfix — corrige bug");
    expect(getSessaoAtual()?.categoria).toBe("bugfix");
  });

  it("--set-category refactor → exit 0", () => {
    restoreHandoff();
    const out = execSync(`node "${SCRIPT}" --set-category refactor "refatora modulo"`, {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 15000,
    });
    expect(out).toContain("✅ Sessão iniciada: refactor — refatora modulo");
    expect(getSessaoAtual()?.categoria).toBe("refactor");
  });

  // ─── --set-category: preserva sessão existente (não sobrescreve sem querer) ───

  it("--set-category sobrescreve sessão anterior (comportamento explícito)", () => {
    restoreHandoff();
    execSync(`node "${SCRIPT}" --set-category feature "primeira feature"`, {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 5000,
    });
    expect(getSessaoAtual()?.objetivo).toBe("primeira feature");

    // --set-category é explícito → sobrescreve
    execSync(`node "${SCRIPT}" --set-category chore "segunda chore"`, {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 5000,
    });
    expect(getSessaoAtual()?.objetivo).toBe("segunda chore");
  });

  // ─── Modo continuação ───

  it("sessão em andamento → não pergunta, só atualiza estado", () => {
    // Prepara uma sessão ativa
    restoreHandoff();
    execSync(`node "${SCRIPT}" --set-category docs "continuacao"`, {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 5000,
    });

    // Roda de novo (modo interativo sem input → detecta inProgress)
    const out = execSync(`node "${SCRIPT}"`, {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 5000,
    });
    expect(out).toContain("▶️  HANDOFF indica algo em andamento");

    // Sessão original preservada
    expect(getSessaoAtual()?.objetivo).toBe("continuacao");
  });

  it("sessão antiga sem Status in_progress → modo interativo (não inProgress)", () => {
    restoreHandoff();
    const md = readFileSync(HANDOFF, "utf8");
    writeFileSync(
      HANDOFF,
      `${md}\n## 🎯 Sessão Atual\n**Categoria:** chore\n**Objetivo:** P0 completo\n`,
    );
    expect(() =>
      execSync(`node "${SCRIPT}"`, {
        cwd: ROOT,
        encoding: "utf8",
        timeout: 3000,
      }),
    ).toThrow();
  });

  it("handoff limpo → modo interativo (não inProgress)", () => {
    restoreHandoff();
    // O script entra em modo interativo e espera input.
    // Como não fornecemos input, ele vai travar no readline → timeout.
    // O importante é confirmar que ele NÃO entra em modo continuação.
    expect(() =>
      execSync(`node "${SCRIPT}"`, {
        cwd: ROOT,
        encoding: "utf8",
        timeout: 3000,
      }),
    ).toThrow(); // Timeout = não está em continuação
  });

  it("sessão com descrição concisa (default) → não é inProgress", () => {
    restoreHandoff();
    // Cria sessão com objetivo genérico (default)
    execSync(`node "${SCRIPT}" --set-category chore "descrição concisa"`, {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 5000,
    });
    // Ao rodar de novo, não deve detectar como inProgress
    // (porque o objetivo default significa sessão não iniciada de verdade)
    expect(() =>
      execSync(`node "${SCRIPT}"`, {
        cwd: ROOT,
        encoding: "utf8",
        timeout: 3000,
      }),
    ).toThrow(); // Timeout = entrou em modo interativo, não continuação
  });

  // ─── Output structure ───

  it("output contém informações do projeto", () => {
    restoreHandoff();
    const out = execSync(`node "${SCRIPT}" --set-category docs "verifica output"`, {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 15000,
    });
    expect(out).toContain("branch:");
    expect(out).toContain("commit:");
    expect(out).toContain("PRs:");
    expect(out).toContain("## 🏗️ Projeto");
    expect(out).toContain("## 💭 Ideias pendentes");
  });

  // ─── Isolamento (issue #567) ───

  it("não muta o handoff real", () => {
    const before = readFileSync(REAL_HANDOFF, "utf8");
    restoreHandoff();
    execSync(`node "${SCRIPT}" --set-category chore "teste isolamento"`, {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 15000,
    });
    expect(readFileSync(REAL_HANDOFF, "utf8")).toBe(before);
  });
});
