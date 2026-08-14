# HANDOFF — MilesControl
> ⏰ Última atualização: 2026-08-14
> Anterior: 2026-08-11
---
## 🏗️ Projeto
**Stack:** React + Vite + Supabase + Tailwind | pt-BR
**Estrutura:** /src (components/, lib/, pages/) | /docs | /scripts | /tests
**Workflow:** session:start → categoria → implementação → pre-pr → PR
### 🐞 Bugs Abertos
Consulte as GitHub Issues para a lista atual.
## 🧭 Estado Atual
- **Branch:** `docs/fuso-308-concluido`
- **Último commit:** `c001ad9` — docs(fuso): fecha issue #308 no handoff — auditoria de datas + telemetria
- **Remote:** no remote

### ✅ Concluído
- **Issue #308 (bug de fuso)** — **resolvida.** Exibição com `formatDateBR` (13 usos,
  timezone-safe via `parseDateOnly`) + cálculos com `parseDateOnly` (metrics, dashboardTimeline,
  Relatorios, SaleForm, EntryForm, useClientCycleAvailability) + TWINS em ControleCPF confirmado.
  Auditoria final 2026-08-13: nenhum `new Date("YYYY-MM-DD")` com risco restante — recorrências
  (recurrence.ts, useDatabase/shared.ts, origemTypes.ts) usam aritmética UTC consistente e
  sorts (EntryTable/SaleTable/dashboardTimeline) e diffs (Entradas clubeMeses) são shift-invariant.

### 📋 PRs Abertos
Nenhum PR aberto.
### 📊 Métricas (estimativa local)
| Métrica | Valor |
|---------|-------|
| Total testes | 827 |
| Docs issues | 0 |
| Branch | docs/fuso-308-concluido |

---
_Atualizado automaticamente por `scripts/update-handoff.mjs`_
## 🎯 Sessão Atual
**Categoria:** refactor
**Objetivo:** Etapa 3 refactor: extrai blocos JSX restantes do Dashboard (491L) e EntryForm (909L) em componentes proprios
**Status:** done
**Iniciada em:** 2026-08-13T12:29:11.759Z
**Branch:** `docs/fuso-308-concluido`
**Último commit:** e22a5b3 — refactor(etapa2): hero sections do Dashboard em componentes próprios (976→491) + AccountCard/AccountsSummary + lib entryOperations (#377)
**Docs carregados:** conventions/common.md, conventions/refactor.md, ARCHITECTURE.md
## ✅ Última Sessão
Estado atualizado automaticamente.
## 📌 Próxima Sessão
Continue a tarefa ativa ou selecione o próximo task-card.
## 🧠 Notas da Sessão Atual

### 🐛 Bug do Web UI: "Optional feature audit could not establish a safe resource configuration"
- **Sintoma:** mensagem estática no topo do Web UI local (127.0.0.1:31415) após remover a extensão remote-webui: "Web UI started safely without optional companions / Optional feature audit could not establish a safe resource configuration. Recheck from localhost."
- **Causa raiz (NÃO era a remoção do remote-webui):** bug no pacote `@firstpick/pi-package-webui` **0.8.7** — a função `packageNodeModulesPath` é chamada em `bin/pi-webui.mjs` (linha 1996, `optionalPackageCandidateRoots`) mas **não existe no 0.8.7** (existia no 0.8.6, linha 11465). A auditoria de optional features itera todas as 20 features do catálogo; a primeira chamada lança `ReferenceError: packageNodeModulesPath is not defined` → fase `degraded` → banner estático. Reinstalar o remote-webui NÃO resolveria.
- **Fix aplicado (local, fora do git):** restaurada a função no pacote instalado `.pi/npm/node_modules/@firstpick/pi-package-webui/bin/pi-webui.mjs`:
  ```js
  function packageNodeModulesPath(nodeModulesRoot, packageName) {
    return path.join(nodeModulesRoot, ...String(packageName || "").split("/").filter(Boolean));
  }
  ```
  **⚠️ Aviso:** o patch é local (arquivo git-ignored em node_modules). Será perdido ao atualizar o pacote webui (0.8.8+). Reportar upstream ao `@firstpick` quando conveniente.
- **Estado pós-fix:** auditoria `phase: ready`, `installKind: upgrade`, summary `{ready:8, migratable:1, missing:11, conflicts:0, disabled:0, unknown:0}`; `remoteWebui` → `legacy-migratable` com `dismissedMigration` gravado (não reinstalar). Store: `~/.pi/agent/webui/optional-feature-migration.json`.
- **Web UI ativo:** launcher PID 960277 (porta 31415, `--host 127.0.0.1 --cwd <repo>`).







