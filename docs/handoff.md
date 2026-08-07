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
- **Último commit:** `c0700b0 — Merge pull request #278 from andre0787/docs/session-end-harness-p2`
- **Remote:** no remote
### 📋 PRs Abertos
Nenhum PR aberto.
### 📊 Métricas (estimativa local)
| Métrica | Valor |
|---------|-------|
| Total testes | 451 |
| Docs issues | 0 |
| Branch | docs/session-end-harness-p2 |

---
_Atualizado automaticamente por `scripts/update-handoff.mjs`_
## 🎯 Sessão Atual
**Categoria:** chore
**Objetivo:** Adotar features novas do pi 0.84 (AI_AGENT nos scripts, AGENTS.override.md, Baseten+samplingParams no router, settings TUI)
**Status:** in_progress
**Iniciada em:** 2026-08-07T02:25:05.997Z
**Branch:** `chore/pi-084-adoption`
**Último commit:** c0700b0 — Merge pull request #278 from andre0787/docs/session-end-harness-p2
**Docs carregados:** AGENTS.md
## ✅ Última Sessão
Estado atualizado automaticamente.
## 📌 Próxima Sessão
Continue a tarefa ativa ou selecione o próximo task-card.
## 🧠 Notas da Sessão Atual
- **✅ SESSÃO CONCLUÍDA (PR #277 merged 04:35 + deploy success):** P2 do ROADMAP resolvido — causa raiz do `subagent_prelaunch`: pacote `pi-subagents` ausente do ambiente (responder RPC inexistente) + agentes fora do catálogo rejeitados pela v0.39.0 (`allowedAgents`); reprodução live confirmou o harness morto. Fix: `pi install npm:pi-subagents` (ativa no próximo startup do pi) + guard `npm run harness:check` no repo (7 testes; 463/463; lint 0). Doc: `docs/LLM-ROUTER.md` seção Harness.
- **✅ Pendência de validação RESOLVIDA (2026-08-06):** probe `subagent_gate` com agente builtin `worker` (modelo roteado via `llm:route` → `opencode/deepseek-v4-flash-free`) executado com sucesso na 1ª tentativa — resposta: `RESPONDER_ATIVO — worker respondendo via RPC pi-subagents`. Responder pi-subagents confirmado ativo; nenhuma verificação de `pi list`/settings.json necessária.
- **Aprendizado:** timeline pi-subagents (0.37.x OK 29/07; 0.39.0/0.40.0 em 01/08 = morte do harness); nomes de agente precisam ser do catálogo builtin; tool `subagent_gate` do schema desta sessão não aceita `cwd` no root (só no task).
