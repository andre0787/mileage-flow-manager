# HANDOFF — MilesControl
> ⏰ Última atualização: 2026-08-11
> Anterior: 2026-08-10
---
## 🏗️ Projeto

> ⏰ Snapshot atualizado em: 2026-08-15

### 🏗️ Projeto

**Stack:** React + Vite + Supabase + Tailwind | pt-BR
**Estrutura:** /src (components/, lib/, pages/) | /docs | /scripts | /tests
**Regras críticas:** branch obrigatória, pre-pr c/ relatório, git status ZERO, lazy loading por categoria
**Workflow:** session:start → categoria → carregar docs → council (se feature) → build → pre-pr → PR

### 🐞 Bugs Abertos

- [#451](https://github.com/andre0787/mileage-flow-manager/issues/451) — 🚨 Smoke de produção falhou após deploy ab9377a94703d6c766b679f33c1038caf85722a3
- [#449](https://github.com/andre0787/mileage-flow-manager/issues/449) — 🚨 Smoke de produção falhou após deploy 2da3dab2501aac54bbe290afdfa7a7f6e1a0272a
- [#446](https://github.com/andre0787/mileage-flow-manager/issues/446) — 🚨 Smoke de produção falhou após deploy ef5b4b59e94a591b7661f255174ed565421b7a59
- [#444](https://github.com/andre0787/mileage-flow-manager/issues/444) — 🚨 Smoke de produção falhou após deploy b1b05b0df5a7a45c6a5a1107343f7d31f0ce39e9
- [#442](https://github.com/andre0787/mileage-flow-manager/issues/442) — 🚨 Smoke de produção falhou após deploy dcd80c8c62732c3912c8f4c0758378c725df88de
- [#440](https://github.com/andre0787/mileage-flow-manager/issues/440) — 🚨 Smoke de produção falhou após deploy b237e4c55dbbac286db11075357ead7193f59840
- [#438](https://github.com/andre0787/mileage-flow-manager/issues/438) — 🚨 Smoke de produção falhou após deploy 875a0e0baf94885ba9edf6ada2a6fe6eccc1a8e2
- [#436](https://github.com/andre0787/mileage-flow-manager/issues/436) — 🚨 Smoke de produção falhou após deploy ecb0eb14c5fae84bc46bf14d934ccc658d80ff08
- [#434](https://github.com/andre0787/mileage-flow-manager/issues/434) — 🚨 Smoke de produção falhou após deploy 299719d16b13b8aac24592d512e57bbb29eacbd5
- [#432](https://github.com/andre0787/mileage-flow-manager/issues/432) — 🚨 Smoke de produção falhou após deploy 9a131eda4bdd7b03050bae65329cf48b492ab6f8

### 📋 Commits Recentes

```
ab9377a Merge pull request #450 from andre0787/chore/cleanup-orphan-branches
b11ef59 chore: normalize report prefix to PR450
a8dc247 chore: limpeza do repositório — branches órfãs + fable-gates no MAP
```

## 🧭 Estado Atual
- **Branch:** `feat/p125-demo-e2e-real`
- **Último commit:** `78ac883 — Merge pull request #452 from andre0787/feat/p125-public-demo-agentic-e2e`
- **Remote:** `origin` → https://github.com/andre0787/mileage-flow-manager.git

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
Nenhum PR aberto.
### 📊 Métricas (estimativa local)
| Métrica | Valor |
|---------|-------|
| Total testes | 575 |
| Docs issues | 0 |
| Branch | refactor/blueprint-v4-p1-clientes |















































---
_Atualizado automaticamente por `scripts/update-handoff.mjs`_

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












