# HANDOFF — MilesControl
> ⏰ Última atualização: 2026-08-07
> Anterior: 2026-08-07
---
## 🏗️ Projeto
**Stack:** React + Vite + Supabase + Tailwind | pt-BR
**Estrutura:** /src (components/, lib/, pages/) | /docs | /scripts | /tests
**Workflow:** session:start → categoria → implementação → pre-pr → PR
### 🐞 Bugs Abertos
Consulte as GitHub Issues para a lista atual.
## 🧭 Estado Atual
- **Branch:** `main`
- **Último commit:** `15c1c09 — Merge pull request #286 from andre0787/docs/backlog-item2-crg`
- **Remote:** origin/main
### 📋 PRs Abertos
Nenhum PR aberto.
### 📊 Métricas (estimativa local)
| Métrica | Valor |
|---------|-------|
| Total testes | 451 |
| Docs issues | 0 |
| Branch | main |

---
_Atualizado automaticamente por `scripts/update-handoff.mjs`_
## 🎯 Sessão Atual
**Categoria:** chore
**Objetivo:** ITEM 2 do backlog: aplicar code-review-graph (npm run crg:*) no apoio às tarefas
**Status:** in_progress
**Iniciada em:** 2026-08-07T03:50:47.109Z
**Branch:** `main`
**Último commit:** 15c1c09 — Merge pull request #286 from andre0787/docs/backlog-item2-crg
**Docs carregados:** AGENTS.md
## ✅ Última Sessão
Estado atualizado automaticamente.
## 📌 Próxima Sessão
**Trabalhar itens do backlog em ordem:**
1. **🎯 ITEM 2 — CRG no apoio:** aplicar `npm run crg:*` nas tarefas — `crg:detect-changes` no pré-PR, `crg:impact` antes de editar, `crg:architecture`/`crg:dead-code` para mapeamentos (skill `.pi/skills/code-review-graph/SKILL.md`) — pipeline já validado em 07/08 (grafo main@15c1c09, risco 0.0, 17 comunidades)
2. **🎯 ITEM 3 (NOVO, confirmado pelo usuário) — Action nightly falhando:** `.github/workflows/nightly.yml` roda 06:00 UTC diariamente e **falha TODO dia desde 02/08** (5+ runs consecutivas). Verificar se é necessária; se sim, corrigir; se não, **sanitizar actions obsoletas**. Diagnóstico prévio:
   - `e2e-full` → falha no passo `E2E completo` (`npm run test:e2e` — e2e quebrado/flaky de madrugada; e2e-smoke passa no CI normal)
   - `quality-and-check` → falha no passo `Create PR with QUALITY.md update` (peter-evans/create-pull-request — suspeita: PR diário já existe / branch protection)
   - Obs: `docs-health.yml` semanal (seg 08:00) também falhou em 20/07 e 27/07, passou em 03/08 — incluir na sanitização
3. PENDINGs ambientais: `BASETEN_API_KEY` (perfil `baseten` do router), remote session APIs (pi), fullscreen TUI (já ativo)
4. Nova feature/bugfix/refactor: rodar `npm run session:start` → categoria → docs da categoria → council se feature

## 🧠 Notas da Sessão Atual
- **✅ SESSÃO CONCLUÍDA (PR #282 merged 03:08 + deploy success):** auditoria completa de docs — 6/6 itens. Inventário 163 `.md` (26/26 cards done, IDEIAS vazio, 0 issues); limpeza (6 docs → `docs/archive/`, `AGENDA.md` removido, links corrigidos em 4 docs); órfãos (rule-14/verify-docs/project:audit verdes, CRG dead-code = falsos positivos); skills (20, rule-23 verde, **code-review-graph instalada** — CLI pipx v2.3.7 + skill repo-local + manifesto rule-29: 11 arquivos); pendências (entry-create-account e KPI verificados implementados); mapeamento completo em `docs/audits/2026-08-07-docs-audit.md`.
- **Skill nova:** `.pi/skills/code-review-graph/SKILL.md` — pi não suporta MCP, usar CLI direto. Grafo do repo: 323 arquivos, 1794 nós, 17 comunidades.
- **Aprendizado:** verify-docs detecta menções `docs/<arquivo>.md` em texto (regex de caminho bare) — ao mover/remover docs, corrigir TODAS as ocorrências (TWINS) em docs e cards históricos.



