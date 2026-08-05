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
- **Branch:** `docs/session-end-process-violations`
- **Último commit:** `2d90f85` — docs: session:end — travas de auto-heal do KPI implementadas
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
**Objetivo:** Planejar e implementar travas para mitigar as top violações do KPI de processo
**Status:** done
**Iniciada em:** 2026-08-05T01:36:26.912Z
**Branch:** `feat/process-violations-travas`
**Último commit:** 1bc72cf — Merge pull request #272 from andre0787/docs/session-end-done
**Docs carregados:** WORKFLOW.md, CONVENTIONS.md
## ✅ Última Sessão
Estado atualizado automaticamente.
## 📌 Próxima Sessão
Continue a tarefa ativa ou selecione o próximo task-card.
## 🧠 Notas da Sessão Atual
- **✅ SESSÃO CONCLUÍDA (PR #273 merged, deploy success):** travas de auto-heal para top violações do KPI de processo — veredito do council em `docs/council/2026-08-05-process-violations-veredito.md`
- **Dados do KPI (agosto/2026):** 118 rule:fail em 51 pre-pr FAILs (66,2% pass rate) — rule-10 ×65, rule-26 ×31, rule-17 ×12, rule-27 ×6, rule-02 ×4
- **Travas Fase 1 (PR #273):** rule-10 → `docs/handoff.md` em GENERATED_ARTIFACTS + git add de relatórios com env git limpo; rule-26/rule-02 → `scripts/lib/session-heal.mjs` (healSession no pre-pr, auto-corrige branch e docs carregados); telemetria `healed` (evento novo validado no parser) + `healedByRule` no kpi-data.json
- **Validação real:** auto-heal funcionou dentro do hook de commit (handoff curado sem session:start manual; evento healed gravado)
- **Fase 2 aberta (ROADMAP item 3):** Trava C (MAP.md auto-registrado p/ rule-17 ×12) + Trava D (mensagens acionáveis + `gate:blocked` p/ rule-27 ×6)
- **Aprendizado:** commit com mensagem multi-linha + pipe (`| sed`) pode quebrar o -m do git (pathspec error) — usar mensagem em arquivo ou heredoc


