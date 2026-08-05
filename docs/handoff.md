# HANDOFF — MilesControl
> ⏰ Última atualização: 2026-08-05
> Anterior: 2026-08-05
---
## 🏗️ Projeto
**Stack:** React + Vite + Supabase + Tailwind | pt-BR
**Estrutura:** /src (components/, lib/, pages/) | /docs | /scripts | /tests
**Workflow:** session:start → categoria → implementação → pre-pr → PR
### 🐞 Bugs Abertos
Consulte as GitHub Issues para a lista atual.
## 🧭 Estado Atual
- **Branch:** `main`
- **Último commit:** `088df44 — Merge pull request #276 from andre0787/docs/session-end-fase2`
- **Remote:** no remote
### 📋 PRs Abertos
Nenhum PR aberto.
### 📊 Métricas (estimativa local)
| Métrica | Valor |
|---------|-------|
| Total testes | 444 |
| Docs issues | 0 |
| Branch | docs/session-end-fase2 |

---
_Atualizado automaticamente por `scripts/update-handoff.mjs`_
## 🎯 Sessão Atual
**Categoria:** bugfix
**Objetivo:** P2: diagnosticar e corrigir as falhas subagent_prelaunch do harness de subagentes (13+ falhas no KPI do router LLM, hoje com workaround inline)
**Status:** in_progress
**Iniciada em:** 2026-08-05T04:23:00.712Z
**Branch:** `fix/harness-subagents-p2`
**Último commit:** 088df44 — Merge pull request #276 from andre0787/docs/session-end-fase2
**Docs carregados:** DEBUG.md, CONVENTIONS.md
## ✅ Última Sessão
Estado atualizado automaticamente.
## 📌 Próxima Sessão
Continue a tarefa ativa ou selecione o próximo task-card.
## 🧠 Notas da Sessão Atual
- **Sessão bugfix P2 (em andamento):** diagnóstico do harness de subagentes — causa raiz do `subagent_prelaunch` (10 eventos em 01-03/08): **pacote `pi-subagents` ausente** do ambiente (settings do pi sem o pacote → responder RPC inexistente) + agentes fora do catálogo rejeitados desde a v0.39.0 (`allowedAgents`: `general-purpose`, `council-contrarian`, `review` inválidos; builtin: `worker`, `reviewer`, `oracle`, `scout`, `planner`, `researcher`, `advisor`, `delegate`, `context-builder`).
- **Reprodução live:** probe `subagent_gate` falhou em pre-launch nesta sessão (`general-purpose#1` e `worker#1`) — harness morto HOJE, não era episódio passado.
- **Fix aplicado:** `pi install npm:pi-subagents` (settings registrado; extensão ativa no próximo startup do pi — validar com probe na próxima sessão).
- **Guard no repo:** `scripts/lib/harness-check.mjs` + `npm run harness:check` (read-only; `--check` exit 1 com mensagem acionável) + doc em `docs/LLM-ROUTER.md`; 7 testes novos; suíte 463/463.
- **Aprendizado:** timeline das versões do pi-subagents (0.37.x OK em 29/07; 0.39.0/0.40.0 publicadas 01/08 = dia da morte do harness).