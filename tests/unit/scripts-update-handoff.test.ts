import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import { resolve } from "path";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const ROOT = resolve(__dirname, "../..");
const SCRIPT = resolve(ROOT, "scripts/update-handoff.mjs");

const FIXTURE = `# HANDOFF — MilesControl
> ⏰ Última atualização: 2026-08-14
---
## 🏗️ Projeto
**Stack:** React + Vite + Supabase + Tailwind | pt-BR
**Workflow:** session:start → categoria → implementação → pre-pr → PR
### 🐞 Bugs Abertos
Consulte as GitHub Issues para a lista atual.
## 🧭 Estado Atual
- **Branch:** \`main\`
- **Último commit:** \`abc123 — commit anterior\`
- **Remote:** origin → https://github.com/andre0787/mileage-flow-manager.git

### ✅ Concluído
- **Issue #308 (bug de fuso)** — **resolvida** (PR #379 merged).

### 🔄 Em andamento
- Fase C do Blueprint v9 — forms React 19.

### 📋 PRs Abertos
Nenhum PR aberto.

### 📊 Métricas (estimativa local)
| Métrica | Valor |
|---------|-------|
| Total testes | 891 |
---
_Atualizado automaticamente por \`scripts/update-handoff.mjs\`_
## 🎯 Sessão Atual
**Categoria:** feature
**Objetivo:** Fase C
**Status:** in_progress
**Branch:** \`feat/blueprint-v9-fase-c-react19\`
**Docs carregados:** WORKFLOW.md, conventions/common.md, conventions/feature.md
## ✅ Última Sessão
Estado atualizado automaticamente.
## 📌 Próxima Sessão
Continue a tarefa ativa.
## 🧠 Notas da Sessão Atual
(Adicione notas manuais abaixo desta linha)
`;

describe("update-handoff", () => {
  it("--write preserva subseções manuais do Estado Atual (Concluído, Em andamento)", () => {
    const dir = mkdtempSync(join(tmpdir(), "handoff-test-"));
    const fixturePath = join(dir, "handoff.md");
    writeFileSync(fixturePath, FIXTURE);

    try {
      execSync(`node "${SCRIPT}" --write`, {
        cwd: ROOT,
        encoding: "utf8",
        timeout: 15000,
        env: { ...process.env, HANDOFF_PATH: fixturePath },
      });

      const out = readFileSync(fixturePath, "utf8");
      // Subseções manuais preservadas
      expect(out).toContain("### ✅ Concluído");
      expect(out).toContain("Issue #308 (bug de fuso)");
      expect(out).toContain("### 🔄 Em andamento");
      expect(out).toContain("Fase C do Blueprint v9");
      // Sessão Atual preservada
      expect(out).toContain("**Objetivo:** Fase C");
      expect(out).toContain("**Status:** in_progress");
      // Notas manuais preservadas
      expect(out).toContain("## 🧠 Notas da Sessão Atual");
      // Seções automáticas regeneradas
      expect(out).toContain("### 📋 PRs Abertos");
      expect(out).toContain("### 📊 Métricas");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
