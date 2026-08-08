# HANDOFF — MilesControl
> ⏰ Última atualização: 2026-08-08
> Anterior: 2026-08-08
---
## 🏗️ Projeto
**Stack:** React + Vite + Supabase + Tailwind | pt-BR
**Estrutura:** /src (components/, lib/, pages/) | /docs | /scripts | /tests
**Workflow:** session:start → categoria → implementação → pre-pr → PR
### 🐞 Bugs Abertos
Consulte as GitHub Issues para a lista atual.
## 🧭 Estado Atual
- **Branch:** `main`
- **Último commit:** `44818d6` — docs: sessao rtk encerrada - integracao entregue em prod (PR 315)
- **Remote:** origin/main
### 📋 PRs Abertos
Nenhum PR aberto.
### 📊 Métricas (estimativa local)
| Métrica | Valor |
|---------|-------|
| Total testes | 464 |
| Docs issues | 0 |
| Branch | main |

---
_Atualizado automaticamente por `scripts/update-handoff.mjs`_
## 🎯 Sessão Atual
**Categoria:** feature
**Objetivo:** avaliar integracao do rtk (github.com/rtk-ai/rtk) no workflow + implementar se beneficioso
**Status:** done
**Iniciada em:** 2026-08-08T01:35:42.383Z
**Concluída em:** 2026-08-08T02:06:00.000Z
**Branch:** `main` (merge PR #315: feat/rtk-workflow)
**Último commit:** 0ecb4bc — Merge pull request #315 from andre0787/feat/rtk-workflow
**Docs carregados:** WORKFLOW.md, CONVENTIONS.md

**Entregas:**
- Council veredito FAÇA: `docs/council/2026-08-08-rtk-integration-veredito.md`
- Extensão Pi versionada: `.pi/extensions/rtk.ts` (`rtk init --agent pi`; fail-open; `RTK_DISABLED=1` para bypass)
- Regra #37 + script: `scripts/rules/rule-37-rtk.mjs` (extensão presente + rtk >= 0.23.0; skip não-falho sem binário)
- Atalho npm `rule:37`; CONVENTIONS.md + AGENTS.md; prompt manifest atualizado
- Testes unitários rule-37 (3 casos); PR #315 merged; deploy prod success
- Binário local: `~/.local/bin/rtk` 0.45.0
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




