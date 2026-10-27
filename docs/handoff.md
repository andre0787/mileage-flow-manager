# HANDOFF — MilesControl
> ⏰ Última atualização: 2026-10-27
> Anterior: 2026-10-27
---
## 🏗️ Projeto
**Stack:** React + Vite + Supabase + Tailwind | pt-BR
**Estrutura:** /src (components/, lib/, pages/) | /docs | /scripts | /tests
**Workflow:** session:start → categoria → implementação → pre-pr → PR
### 🐞 Bugs Abertos
Consulte as GitHub Issues para a lista atual.
## 🧭 Estado Atual
- **Branch:** `feat/relatorio-extrato-cliente`
- **Último commit:** `8fe27eb7` — Artefatos finais de pre-pr registrados
- **Remote:** no remote
### 📋 PRs Abertos
- #794 — Fix CI workflows, nightly test check script, and PR report normalization
- #792 — Fix Auto Merge guards, telemetry sanity, and validate UX filters
- #791 — 🧹 refactor: decompose AppSidebar into modular subcomponents
- #790 — 🧹 Extract subcomponents from SaleTableRow
- #789 — ⚡ optimize dashboard selectors lookup from O(N^2) to O(N+M)
- #788 — 🧹 refactor GlobalSearch component to use custom hook and subcomponent
- #787 — 🧹 [code health improvement] Refactor long ProgramSection component into modular helper components
- #786 — 🔒 Fix hardcoded Supabase anon key in test files and scripts
- #785 — 🧹 Refactor SaleMobileCard into modular sub-components
- #784 — 🧹 refactor: extract subcomponents and hooks from Clientes page
- #783 — ⚡ perf: optimize salesOfAccountType lookup in dashboardSelectors
- #782 — 🧹 [code health improvement] Refactor SaleSimulator to reduce line count and improve readability
- #781 — 🧹 Extract SaleTable subcomponents and sort helper
- #780 — 🧹 Refactor EntryForm into modular sub-components
- #779 — 🧹 refactor: decompose FlowMap component into focused subcomponents
- #778 — 🧹 [Code Health] Refactor Vendas.tsx into modular helpers and components
- #777 — 🧹 Refactor SaleForm component into smaller subcomponents
- #776 — ⚡ Optimize account ID to type lookup in dashboard selectors
- #775 — ⚡ optimize program lookup in computeProgramData to O(1)
- #774 — 🔒 Fix hardcoded Supabase Anon Key in test config
- #773 — 🧪 test: add unit tests for AI Engineering Graph ROI metrics
- #772 — 🧪 test: add comprehensive unit tests for AccountAlertsDialog
- #771 — 🧪 test: add unit tests for PipelineTab component
- #770 — 🧹 refactor: extract subcomponents from SaleReceiveDialog
- #769 — ⚡ perf: optimize account lookup in computeRecentEntries and computeRecentTransfers
- #768 — 🧹 [code health] Refactor EntryTable into modular sub-components
- #767 — 🧹 refactor(owners): extract OwnerSection helper components
- #766 — 🧹 Refactor long AccountDialog component into smaller modular subcomponents
- #765 — 🧪 test(ai): add unit tests for AI engineering agents performance
- #764 — 🧹 refactor(workflow): extract sub-components and hook from WorkflowMindMap
### 📊 Métricas (estimativa local)
| Métrica | Valor |
|---------|-------|
| Total testes | 1512 |
| Docs issues | 0 |
| Branch | feat/relatorio-extrato-cliente |

---
_Atualizado automaticamente por `scripts/update-handoff.mjs`_
## 🎯 Sessão Atual
**Categoria:** feature
**Objetivo:** Incluir toggle considerar/não considerar venda no ROI na inserção de vendas
**Status:** done
**Iniciada em:** 2026-10-20T12:41:07.704Z
**Branch:** `feat/relatorio-extrato-cliente`
**Último commit:** fff39f7c — Merge pull request #741 from andre0787/chore/session-end-2026-10-18
**Docs carregados:** WORKFLOW.md, conventions/common.md, conventions/feature.md
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































