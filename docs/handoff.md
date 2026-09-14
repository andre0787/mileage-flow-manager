# HANDOFF — MilesControl
> ⏰ Última atualização: 2026-09-14
> Anterior: 2026-09-08
---
## 🏗️ Projeto

> ⏰ Snapshot atualizado em: 2026-09-14

### 🏗️ Projeto

**Stack:** React + Vite + Supabase + Tailwind | pt-BR
**Estrutura:** /src (components/, lib/, pages/) | /docs | /scripts | /tests
**Regras críticas:** branch obrigatória, pre-pr c/ relatório, git status ZERO, lazy loading por categoria
**Workflow:** session:start → categoria → carregar docs → council (se feature) → build → pre-pr → PR

### 🐞 Bugs Abertos

- nenhum | [ver todos → Issues](https://github.com/andreluiz0787/mileage-flow-manager/issues)

### 📋 Commits Recentes

```
20d19276 Merge pull request #633 from andre0787/integrate/pr-wave
cc0cba27 feat(clientes): data no adiantamento que vira crédito (PR #631)
bf7d6cb8 chore: zera ruído de docs/public contra a main
```

## 🧭 Estado Atual
- **Branch:** `main` limpa — **zero PRs abertas** (52 PRs do lote #578–#633 resolvidas)
- **Último commit:** `20d19276` — Merge pull request #633 (consolidação do lote)
- **Produção:** deploy ✅ @`20d19276` + `e2e-smoke-prod` ✅

### ✅ Lote #578–#633 consolidado e em produção (2026-09-14)
- 52 PRs abertas resolvidas: **32 merged** (inclui as previamente merged #608/#610/#632) + **24 closed** com comentário.
- **Causa da consolidação:** branch protection de `main` usa `strict: true` (`check-pr` + `e2e-smoke`), então cada merge invalida todas as demais PRs (`BEHIND`) → dezenas de ciclos seriais de CI. Somado a isso, quase todas as branches conflitavam apenas por ruído com `docs/tracking/*` e `public/kpi-data.json`, reescritos diariamente pelos bots.
- **Solução:** branch `integrate/pr-wave` com as 33 canônicas integrradas, validada como conjunto **antes** de tocar a `main` → PR #633 → merge → deploy.
- **Evidência:** 197 arquivos / **1488 testes**, `tsc` limpo, `build` ok, `check:pr` ok (inclui `budget:check`).
- **Conflitos resolvidos à mão:** `SaleForm.tsx` (#591 extraiu `handlePassengerClientChange` vs #593, que moveu `handleCreateClient` para `ClientCreationDrawer`) → descartado o `handleCreateClient` obsoleto; `tests/components/SaleForm.test.tsx` → **união** dos dois lados; `supabase.ts`/`tests/setup.ts`/`supabase.test.ts` (#622 + #625, que removiam fallbacks hardcoded) → mensagem unificada e env setado em `process.env` **e** `import.meta.env`.
- **Não incluído:** duplicatas puramente cosméticas/duplicadas entre si (#581/#583/#585/#586/#590/#592/#595/#596/#598/#599/#600/#603/#605/#606/#607/#609/#611/#613/#623/#628) e a cobertura extra de teste do #596 foram fechadas sem merge.
### ✅ Blueprint v4.0 P1 completo — todos os domínios migrados para RTK Query
- **P3-28 entradas** (`src/features/entradas/`), **P3-29 contas** (`src/features/contas/`),
  **P3-30 clientes** (`src/features/clientes/`), **P3-31 vendas** (`src/features/vendas/`, PR #341),
  **P3-32 alerts** (`src/features/alerts/`, PR #348), **P3-33 owners** (`src/features/owners/`, PR #349),
  **P3-34 programs** (`src/features/programs/`, PR #350), **P3-35 origemTypes**
  (`src/features/origemTypes/`, PR #351) — todos **merged** em main.
- Padrão canônico: `baseApi.injectEndpoints` + barrel `index.ts` + wrappers com shape
  público preservado (`data`/`isPending`/`isError`/`error`/`refetch`/`mutate`/`mutateAsync`
  + `onSuccess`/`onError`) + tags RTK (`entries`/`accounts`/`sales`/`clients`/`alerts`/`owners`/`programs`/`origem_types`).
- Módulos legados removidos de `src/hooks/useDatabase/` (restam apenas `index.ts`,
  `mappers.ts`, `shared.ts`). TanStack React Query ainda presente apenas em
  DataContext/App (DataProvider) e mutationHooksLifecycle de contas/clientes.
- Cards P3-27 a P3-35 todos `done`; ROADMAP atualizado.

### ✅ Concluído
- **Issue #308 (bug de fuso)** — **resolvida** (PR #379 merged). Exibição com `formatDateBR`
  (timezone-safe via `parseDateOnly`) + cálculos com `parseDateOnly` + TWINS em ControleCPF;
  auditoria 2026-08-13 sem risco restante.

### 📋 PRs Abertos
- Nenhuma — lote #578–#633 consolidado em #633 e deployado.
### 📊 Métricas (estimativa local)
| Métrica | Valor |
|---------|-------|
| Total testes | 1488 |
| Docs issues | 0 |
| Branch | main (zero PRs abertas) |

---
_Atualizado automaticamente por `scripts/update-handoff.mjs`_
## 🎯 Sessão Atual
**Categoria:** chore (consolidação de PRs + deploy)
**Objetivo:** implantar todas as PRs abertas em produção sem regressão
**Status:** done
**Iniciada em:** 2026-09-14
**Branch:** `main` (consolidação via #633)
**Último commit:** 20d19276 — Merge pull request #633
**Docs carregados:** AGENTS.md
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


























