# HANDOFF — MilesControl
> ⏰ Última atualização: 2026-08-09
> Anterior: 2026-08-08
---
## 🏗️ Projeto

> ⏰ Snapshot atualizado em: 2026-08-10

### 🏗️ Projeto

**Stack:** React + Vite + Supabase + Tailwind | pt-BR
**Estrutura:** /src (components/, lib/, pages/) | /docs | /scripts | /tests
**Regras críticas:** branch obrigatória, pre-pr c/ relatório, git status ZERO, lazy loading por categoria
**Workflow:** session:start → categoria → carregar docs → council (se feature) → build → pre-pr → PR

### 🐞 Bugs Abertos

- [#308](https://github.com/andre0787/mileage-flow-manager/issues/308) — Datas exibidas com 1 dia a menos no fuso -3 (América/São Paulo)

### 📋 Commits Recentes

```
bf366cc Merge pull request #330 from andre0787/feat/p2-21-metricas-programa
d9e93d1 fix(P2-21): substitui any por tipo TestEvent no teste (lint CI)
c293200 chore(P2-21): registra pr:create PR #330
```

## 🧭 Estado Atual
- **Branch:** `main`
- **Último commit:** `b4990b3 — Merge pull request #329 from andre0787/docs/handoff-pr328-merged`
- **Remote:** origin/main
### 📋 PRs Abertos
Nenhum PR aberto.
### 📊 Métricas (estimativa local)
| Métrica | Valor |
|---------|-------|
| Total testes | 500 |
| Docs issues | 0 |
| Branch | main |

---
_Atualizado automaticamente por `scripts/update-handoff.mjs`_
## 🎯 Sessão Atual
**Categoria:** feature
**Objetivo:** P2-21 metricas do programa de engenharia
**Status:** done
**Iniciada em:** 2026-08-09T23:15:10.279Z
**Concluída em:** 2026-08-10T00:07Z
**Branch:** `main` (PR #330 merged `bf366cc`)
**Último commit:** bf366cc — Merge pull request #330 from andre0787/feat/p2-21-metricas-programa
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
