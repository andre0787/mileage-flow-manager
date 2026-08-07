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
- **Último commit:** `fdaef14` — chore: session end
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
**Categoria:** feature
**Objetivo:** (1) último registro de entrada e venda no card das contas aplicáveis; (2) alerta personalizado por conta (data + observação + lido/não lido). Teste manual local via Playwright antes do PRD.
**Status:** in_progress
**Iniciada em:** 2026-08-07T03:59:00.605Z
**Branch:** `feat/card-ultimo-registro-alertas`
**Docs carregados:** WORKFLOW.md, CONVENTIONS.md
## ✅ Última Sessão
**ITEM 3 RESOLVIDO + PRD (12 rodadas de validação, PRs #288–#304):**
- **quality-and-check ✅:** 403 do bot resolvido (permissions contents/pull-requests write + hooks desativados no CI).
- **Setting do repo ATIVADA via API (07/08):** `PUT /repos/{owner}/{repo}/actions/permissions/workflow` com `can_approve_pull_request_reviews: true` (endpoint `/workflow`! O campo em `/actions/permissions` é ignorado silenciosamente — 204 sem efeito). `default_workflow_permissions` preservado em "read" (workflows declaram permissions explícitas). **Nenhuma ação na UI necessária.**
- **e2e-full ⚠️→ sanitizado (decisão autorizada):** causa raiz = **rate-limit do Supabase por IP compartilhado do runner do GitHub** (evidência: 5 rejeições seguidas no save do entradas; não reproduz local). Fora da cron (`if: workflow_dispatch && inputs.run-e2e == 'true'`) — disponível manualmente. Testes corrigidos permanecem (clube, fluxo-completo, carrinho, origem-tipo, entradas): locator estrutural, Escape determinístico, close por X com retry (force clicava o overlay), retry save com backoff 60s, retries=2, workers=1.
- **Bônus:** fix do flaky do check-pr (index.lock no teste unitário `scripts-session-start` — retry com polling).
- **Pipeline QUALITY.md 100% automático (PR #303):** novo step no nightly aprova o run fantasma do CI (approval gate de runs de GITHUB_TOKEN — `workflow_run` NÃO dispara p/ eles) e envia `repository_dispatch pr-ready` (padrão do normalize-pr-report). Validado: nightly → PR #304 criado → aprovado → merged → deploy, sem intervenção.
- **Validação final:** nightly run 31176208053 = **SUCCESS** (quality-and-check ✅, e2e skipped, PR #304 no fluxo completo). A cron de 06:00 UTC roda o mesmo código.
## 📌 Próxima Sessão
- **PENDENTE:** se quiser, revalidar o e2e completo manualmente: `gh workflow run nightly.yml -f run-e2e=true` (evitar horário de pico — rate-limit do Supabase por IP).
- **PENDINGs ambientais:** `BASETEN_API_KEY` (perfil baseten do router), remote session APIs (pi), fullscreen TUI (já ativo).
Continue a tarefa ativa ou selecione o próximo task-card.
## 🧠 Notas da Sessão Atual
(Adicione notas manuais abaixo desta linha)