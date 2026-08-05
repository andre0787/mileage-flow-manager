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
**Status:** done
**Iniciada em:** 2026-08-05T04:23:00.712Z
**Branch:** `fix/harness-subagents-p2`
**Último commit:** 088df44 — Merge pull request #276 from andre0787/docs/session-end-fase2
**Docs carregados:** DEBUG.md, CONVENTIONS.md
## ✅ Última Sessão
Estado atualizado automaticamente.
## 📌 Próxima Sessão
Continue a tarefa ativa ou selecione o próximo task-card.
## 🧠 Notas da Sessão Atual
- **✅ SESSÃO CONCLUÍDA (PR #277 merged 04:35 + deploy success):** P2 do ROADMAP resolvido — causa raiz do `subagent_prelaunch`: pacote `pi-subagents` ausente do ambiente (responder RPC inexistente) + agentes fora do catálogo rejeitados pela v0.39.0 (`allowedAgents`); reprodução live confirmou o harness morto. Fix: `pi install npm:pi-subagents` (ativa no próximo startup do pi) + guard `npm run harness:check` no repo (7 testes; 463/463; lint 0). Doc: `docs/LLM-ROUTER.md` seção Harness.
- **Pendência de validação:** rodar probe `subagent_gate` (agente builtin `worker`/`reviewer`, modelo roteado) na PRÓXIMA sessão do pi para confirmar o responder ativo — se falhar, verificar `pi list` e `~/.pi/agent/settings.json`.
- **Aprendizado:** timeline pi-subagents (0.37.x OK 29/07; 0.39.0/0.40.0 em 01/08 = morte do harness); nomes de agente precisam ser do catálogo builtin; tool `subagent_gate` do schema desta sessão não aceita `cwd` no root (só no task).