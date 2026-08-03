# 🗺️ Roadmap — MilesControl

> Backlog priorizado fora do escopo da sessão corrente. Atualize ao concluir itens.
> Para cada item: descrição, por que, esforço estimado e critério de feito.

---

## ✅ Concluído

| # | Item | PR | Observação |
|---|------|-----|------------|
| 0 | P0 — Fix do `Normalize PR Report` com `[skip ci]` | [#251](https://github.com/andre0787/mileage-flow-manager/pull/251) | Workflow commita sem `[skip ci]`; guard de regressão em `tests/unit/workflows-guard.test.ts`; produção `1a3457d` |
| 1 | P1 — GHSA-qwww-vcr4-c8h2 (react-router) + npm audit | [#253](https://github.com/andre0787/mileage-flow-manager/pull/253) | `react-router@8.3.0` + React 19.2.8; política de dependência em `project-audit.mjs`; `npm audit --omit=dev` → **0 vulnerabilidades**; produção `0637337` |

> ⚠️ **Observação P0 (pós-merge):** mesmo sem `[skip ci]`, o push do normalize (GITHUB_TOKEN) pode criar run `action_required` fantasma sem jobs quando o concurrency cancela o anterior. Workaround: commit vazio para re-disparar CI (documentado no handoff).

---

## 🔒 Pendentes (prioridade decrescente)

### P2 — Subagentes falhando em pré-lançamento (`subagent_prelaunch`)

- **O quê:** >13 falhas de pré-lançamento registradas como KPI do router LLM
- **Por quê:** degradação do harness de delegação; hoje a execução é inline (workaround)
- **Estado:** quantidade visível no dashboard `/kpi` (fila de `llm.route.completed` com `failureKind: subagent_prelaunch`)
- **Esforço:** fora do repo (infra de subagentes)

### P3 — Branch remota órfã `feat/process-kpi-observability-impl`

- **O quê:** branch remota com commit `f9091c6` fora do merge #248 (conteúdo igual entrou via #249)
- **Por quê:** higiene do repo; confusão de estado
- **Esforço:** baixo
- **Estado:** ✅ **resolvido 2026-08-03** — branch já deletada (auto-merge do #249 com `--delete-branch`); conteúdo confirmado no main (diff plans vazio vs `f9091c6`); evidências tracking/kpi-data divergem apenas por eventos acumulados (esperado)

---

## 🧭 Como usar

- Sessões novas: consultar `docs/handoff.md` → **Itens do futuro** + este roadmap
- Priorize por P0 > P1 > P2; um item por PR (salvo dependências explícitas)
- Ao concluir, mude para "✅ Concluído" com número de PR