import { describe, it, expect, afterAll, beforeAll } from "vitest";
import { execSync } from "child_process";
import { resolve } from "path";
import { readFileSync, writeFileSync } from "fs";

const ROOT = resolve(__dirname, "../..");
const SCRIPT = resolve(ROOT, "scripts/session-start.mjs");
const HANDOFF = resolve(ROOT, "docs/handoff.md");
let originalHandoff: string;

function restoreHandoff() {
  execSync("git checkout -- docs/handoff.md", {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 3000,
  });
  const content = readFileSync(HANDOFF, "utf8");
  writeFileSync(
    HANDOFF,
    content.replace(/## 🎯 Sessão Atual[\s\S]*?(?=\n## |\n---|$)/, ""),
  );
}

/** Lê a seção 🎯 Sessão Atual do handoff, ou null se não existir */
function getSessaoAtual() {
  const md = readFileSync(HANDOFF, "utf8");
  const m = md.match(/## 🎯 Sessão Atual[\s\S]*?(?=\n## |\n---|$)/);
  if (!m) return null;
  return {
    categoria: (m[0].match(/\*\*Categoria:\*\* (.+)/) || [])[1] || null,
    objetivo: (m[0].match(/\*\*Objetivo:\*\* (.+)/) || [])[1] || null,
  };
}

beforeAll(() => {
  originalHandoff = readFileSync(HANDOFF, "utf8");
  restoreHandoff();
});
afterAll(() => writeFileSync(HANDOFF, originalHandoff));

describe("session-start", () => {
  // ─── --set-category: validação ───

  it("--set-category categoria inválida → exit 1", () => {
    expect(() =>
      execSync(`node "${SCRIPT}" --set-category invalida objetivo`, {
        cwd: ROOT,
        encoding: "utf8",
        timeout: 5000,
      })
    ).toThrow();
  });

  it("--set-category sem argumentos → exit 1", () => {
    expect(() =>
      execSync(`node "${SCRIPT}" --set-category`, {
        cwd: ROOT,
        encoding: "utf8",
        timeout: 5000,
      })
    ).toThrow();
  });

  it("--set-category categoria vazia → exit 1", () => {
    expect(() =>
      execSync(`node "${SCRIPT}" --set-category "" "objetivo"`, {
        cwd: ROOT,
        encoding: "utf8",
        timeout: 5000,
      })
    ).toThrow();
  });

  // ─── --set-category: sucesso ───

  it("--set-category docs → exit 0 e salva no handoff", () => {
    restoreHandoff();
    const out = execSync(
      `node "${SCRIPT}" --set-category docs "teste docs"`,
      { cwd: ROOT, encoding: "utf8", timeout: 5000 }
    );
    expect(out).toContain("✅ Sessão iniciada: docs — teste docs");
    expect(getSessaoAtual()?.categoria).toBe("docs");
    expect(getSessaoAtual()?.objetivo).toBe("teste docs");
  });

  it("--set-category bugfix → exit 0", () => {
    restoreHandoff();
    const out = execSync(
      `node "${SCRIPT}" --set-category bugfix "corrige bug"`,
      { cwd: ROOT, encoding: "utf8", timeout: 5000 }
    );
    expect(out).toContain("✅ Sessão iniciada: bugfix — corrige bug");
    expect(getSessaoAtual()?.categoria).toBe("bugfix");
  });

  it("--set-category refactor → exit 0", () => {
    restoreHandoff();
    const out = execSync(
      `node "${SCRIPT}" --set-category refactor "refatora modulo"`,
      { cwd: ROOT, encoding: "utf8", timeout: 5000 }
    );
    expect(out).toContain("✅ Sessão iniciada: refactor — refatora modulo");
    expect(getSessaoAtual()?.categoria).toBe("refactor");
  });

  // ─── --set-category: preserva sessão existente (não sobrescreve sem querer) ───

  it("--set-category sobrescreve sessão anterior (comportamento explícito)", () => {
    restoreHandoff();
    execSync(`node "${SCRIPT}" --set-category feature "primeira feature"`, {
      cwd: ROOT, encoding: "utf8", timeout: 5000,
    });
    expect(getSessaoAtual()?.objetivo).toBe("primeira feature");

    // --set-category é explícito → sobrescreve
    execSync(`node "${SCRIPT}" --set-category chore "segunda chore"`, {
      cwd: ROOT, encoding: "utf8", timeout: 5000,
    });
    expect(getSessaoAtual()?.objetivo).toBe("segunda chore");
  });

  // ─── Modo continuação ───

  it("sessão em andamento → não pergunta, só atualiza estado", () => {
    // Prepara uma sessão ativa
    restoreHandoff();
    execSync(`node "${SCRIPT}" --set-category docs "continuacao"`, {
      cwd: ROOT, encoding: "utf8", timeout: 5000,
    });

    // Roda de novo (modo interativo sem input → detecta inProgress)
    const out = execSync(`node "${SCRIPT}"`, {
      cwd: ROOT, encoding: "utf8", timeout: 5000,
    });
    expect(out).toContain("▶️  HANDOFF indica algo em andamento");

    // Sessão original preservada
    expect(getSessaoAtual()?.objetivo).toBe("continuacao");
  });

  it("handoff limpo → modo interativo (não inProgress)", () => {
    restoreHandoff();
    // O script entra em modo interativo e espera input.
    // Como não fornecemos input, ele vai travar no readline → timeout.
    // O importante é confirmar que ele NÃO entra em modo continuação.
    expect(() =>
      execSync(`node "${SCRIPT}"`, {
        cwd: ROOT, encoding: "utf8", timeout: 3000,
      })
    ).toThrow(); // Timeout = não está em continuação
  });

  it("sessão com descrição concisa (default) → não é inProgress", () => {
    restoreHandoff();
    // Cria sessão com objetivo genérico (default)
    execSync(`node "${SCRIPT}" --set-category chore "descrição concisa"`, {
      cwd: ROOT, encoding: "utf8", timeout: 5000,
    });
    // Ao rodar de novo, não deve detectar como inProgress
    // (porque o objetivo default significa sessão não iniciada de verdade)
    expect(() =>
      execSync(`node "${SCRIPT}"`, {
        cwd: ROOT, encoding: "utf8", timeout: 3000,
      })
    ).toThrow(); // Timeout = entrou em modo interativo, não continuação
  });

  // ─── Output structure ───

  it("output contém informações do projeto", () => {
    restoreHandoff();
    const out = execSync(
      `node "${SCRIPT}" --set-category docs "verifica output"`,
      { cwd: ROOT, encoding: "utf8", timeout: 5000 }
    );
    expect(out).toContain("branch:");
    expect(out).toContain("commit:");
    expect(out).toContain("PRs:");
    expect(out).toContain("## 🏗️ Projeto");
    expect(out).toContain("## 💭 Ideias pendentes");
  });
});
