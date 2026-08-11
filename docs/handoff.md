# HANDOFF — MilesControl
> ⏰ Última atualização: 2026-08-11
> Anterior: 2026-08-10
---
## 🏗️ Projeto
**Stack:** React + Vite + Supabase + Tailwind | pt-BR
**Estrutura:** /src (components/, lib/, pages/) | /docs | /scripts | /tests
**Workflow:** session:start → categoria → implementação → pre-pr → PR
### 🐞 Bugs Abertos
Consulte as GitHub Issues para a lista atual.
## 🧭 Estado Atual
- **Branch:** `main`
- **Último commit:** `a7d6767 — Merge pull request #342 (chore/P3-31-close-docs)`
- **Remote:** `origin` → https://github.com/andre0787/mileage-flow-manager.git

### ✅ Tarefa P3-31 concluída (produção)
- **PR #341** — `refactor(vendas): migra domínio para RTK Query` **merged** em main (`8a53e70`)
- **PR #342** — `chore(P3-31): finaliza card done e eventos` **merged** em main (`a7d6767`)
- Domínio **vendas** migrado de TanStack React Query para **RTK Query** no padrão canônico
  (`baseApi.injectEndpoints`): `src/features/vendas/` com 5 endpoints
  (get/add/update/delete/cancelVenda), tags `sales`/`accounts`, barrel
  `src/hooks/useDatabase/index.ts` reexportando `useSales*` (contrato público preservado),
  (removido) src/hooks/useDatabase/sales.ts (spec exige).
- Validações: 71 arquivos/620 testes ✅ | lint 0 erros ✅ | typecheck ✅ |
  rule:40 ✅ | pre-pr 0 errors ✅ | code review por subagente APPROVE
  (eventos `coding:done`/`code-review:done` com `subagent:true`).
- Cards: P3-29/P3-30/P3-31 marcados `done`.

### 🔄 Próximo passo sugerido
- Migrar próximos domínios legados de `src/hooks/useDatabase/` para RTK Query
  (alerts, owners, programs, origemTypes) — mesmo padrão do P3-31.

### 📋 PRs Abertos
Nenhum PR aberto.
### 📊 Métricas (estimativa local)
| Métrica | Valor |
|---------|-------|
| Total testes | 575 |
| Docs issues | 0 |
| Branch | refactor/blueprint-v4-p1-clientes |

---
_Atualizado automaticamente por `scripts/update-handoff.mjs`_
## 🎯 Sessão Atual
**Categoria:** refactor
**Objetivo:** migração do domínio vendas para RTK Query
**Status:** in_progress
**Iniciada em:** 2026-08-10T21:06:41.671Z
**Branch:** `chore/P3-31-handoff-final`
**Último commit:** a18b8e3 — chore(pre-pr): registra validação P3-30
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



