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
- **Último commit:** `d3931bc — Merge pull request #274 from andre0787/docs/session-end-process-violations`
- **Remote:** no remote
### 📋 PRs Abertos
Nenhum PR aberto.
### 📊 Métricas (estimativa local)
| Métrica | Valor |
|---------|-------|
| Total testes | 428 |
| Docs issues | 0 |
| Branch | docs/session-end-process-violations |

---
_Atualizado automaticamente por `scripts/update-handoff.mjs`_
## 🎯 Sessão Atual
**Categoria:** feature
**Objetivo:** Fase 2 das travas do KPI: Trava C (MAP.md auto-registrado) + Trava D (mensagens acionaveis + gate:blocked)
**Status:** in_progress
**Iniciada em:** 2026-08-05T03:38:59.094Z
**Branch:** `feat/process-violations-fase2`
**Último commit:** d3931bc — Merge pull request #274 from andre0787/docs/session-end-process-violations
**Docs carregados:** WORKFLOW.md, CONVENTIONS.md
## ✅ Última Sessão
Estado atualizado automaticamente.
## 📌 Próxima Sessão
Continue a tarefa ativa ou selecione o próximo task-card.
## 🧠 Notas da Sessão Atual
- **FASE 2 EM ANDAMENTO (PR #276):** Trava C — `scripts/lib/map-heal.mjs` (`healMapDocs`) registra docs novos no MAP.md (seção "🤖 Índice Auto-Gerado" com marcação `(auto)`), idempotente, ignora reports/archive/council/thoughts, integrado ao pre-pr com evento `healed`; MAP.md entrou em GENERATED_ARTIFACTS (Trava A sobre o heal). Trava D — gates de julgamento (rule-27/33/35) registram `gate:blocked` no pre-pr (telemetria distinta de rule:fail, gate continua bloqueando com errors++); parser aceita o tipo novo (`rule` obrigatória, `gate` validado: intent/twins/auth/council); `gateBlockedByRule` no KPI (não contamina topViolations); rule-27 com mensagens acionáveis (comando council-to-superpowers + seções canônicas).
- **Validação real da Trava C:** pre-pr com doc de teste curou o MAP.md no repo real + evento healed gravado (03:34:54) — validado e limpo (doc/entrada/evento removidos; working tree sem resíduo).
- **Atenção:** `git checkout -- .` reverte também edições não commitadas — na limpeza desta sessão derrubou código/testes e o handoff; reaplicado e re-registrado via session:start.
- **Dados do KPI (agosto/2026):** 118 rule:fail em 51 pre-pr FAILs (66,2% pass rate) — rule-10 ×65, rule-26 ×31, rule-17 ×12, rule-27 ×6, rule-02 ×4