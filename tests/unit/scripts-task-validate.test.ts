import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import { writeFileSync, unlinkSync, mkdirSync, rmdirSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const TASKS_DIR = resolve(ROOT, "docs/tasks");
const VALIDATOR = resolve(ROOT, "scripts/task-validate.mjs");

describe("task-validate", () => {
  it("deve passar com os cards atuais (todos válidos)", () => {
    const out = execSync(`node "${VALIDATOR}" 2>&1`, {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 10000,
    });
    expect(out).toMatch(/Todos os cards válidos/);
  });

  it("deve falhar com card sem campo obrigatório na tabela", () => {
    const badCard = resolve(TASKS_DIR, "_test-missing-field.md");
    try {
      writeFileSync(badCard, [
        "# Task Card — Teste",
        "",
        "| Campo | Valor |",
        "|-------|-------|",
        "| `id` | P?-TEST |",
        "| `categoria` | feat |",
        // missing: onda, baseBranch, estado, origem
        "",
        "## Objetivo",
        "Teste",
        "",
        "## Não objetivos",
        "- Nada",
        "",
        "## Contexto",
        "Teste",
        "",
        "## Arquivos permitidos",
        "- `test.md`",
        "",
        "## Critérios de aceite",
        "- [ ] critério",
        "",
        "## Riscos / Invariantes",
        "- nenhum",
        "",
        "## Testes obrigatórios",
        "- `npm test`",
        "",
        "## Evidência de pronto",
        "- teste",
      ].join("\n"), "utf8");

      try {
        execSync(`node "${VALIDATOR}" 2>&1`, {
          cwd: ROOT,
          encoding: "utf8",
          timeout: 5000,
        });
        // Should NOT reach here
        expect("validação deveria falhar").toBe("não falhou");
      } catch (e) {
        const out = e.stdout || e.message || "";
        expect(out).toMatch(/campo.*(onda|baseBranch|estado|origem).*ausente/);
      }
    } finally {
      try { unlinkSync(badCard); } catch { /* cleanup temp file */ }
    }
  });

  it("deve falhar com card sem seção obrigatória", () => {
    const badCard = resolve(TASKS_DIR, "_test-missing-section.md");
    try {
      writeFileSync(badCard, [
        "# Task Card — Teste",
        "",
        "| Campo | Valor |",
        "|-------|-------|",
        "| `id` | P?-TEST |",
        "| `categoria` | feat |",
        "| `onda` | P1-A |",
        "| `baseBranch` | main |",
        "| `estado` | pending |",
        "| `origem` | test |",
        "",
        "## Objetivo",
        "Teste",
        // missing: Não objetivos, Contexto, etc.
      ].join("\n"), "utf8");

      try {
        execSync(`node "${VALIDATOR}" 2>&1`, {
          cwd: ROOT,
          encoding: "utf8",
          timeout: 5000,
        });
        expect("validação deveria falhar").toBe("não falhou");
      } catch (e) {
        const out = e.stdout || e.message || "";
        expect(out).toMatch(/seção.*ausente/);
      }
    } finally {
      try { unlinkSync(badCard); } catch { /* cleanup temp file */ }
    }
  });
});
