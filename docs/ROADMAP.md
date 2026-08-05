# 🗺️ Roadmap — MilesControl

> Backlog priorizado fora do escopo da sessão corrente. Atualize ao concluir itens.
> Para cada item: descrição, por que, esforço estimado e critério de feito.

---

## ✅ Concluído

| # | Item | PR | Observação |
|---|------|-----|------------|
| 0 | P0 — Fix do `Normalize PR Report` com `[skip ci]` | [#251](https://github.com/andre0787/mileage-flow-manager/pull/251) | Workflow commita sem `[skip ci]`; guard de regressão em `tests/unit/workflows-guard.test.ts`; produção `1a3457d` |
| 1 | P1 — GHSA-qwww-vcr4-c8h2 (react-router) + npm audit | [#253](https://github.com/andre0787/mileage-flow-manager/pull/253) | `react-router@8.3.0` + React 19.2.8; política de dependência em `project-audit.mjs`; `npm audit --omit=dev` → **0 vulnerabilidades**; produção `0637337` |
| 2 | P1 — Run fantasma `action_required` do push do normalize | [#269](https://github.com/andre0787/mileage-flow-manager/pull/269) + [#270](https://github.com/andre0787/mileage-flow-manager/pull/270) | **Causa raiz**: approval gate do GitHub para runs disparados por GitHub Actions; `workflow_run` NÃO dispara para `action_required`. **Fix**: normalize aprova o próprio ghost via API (`actions: write`), aguarda e notifica `repository_dispatch pr-ready`; auto-merge escuta `pr-ready` + retry 6×15s no merge (race de registro de checks). **Validação #270**: merge + deploy 100% automáticos, zero intervenção |
| 3 | P1 — Top violações do KPI de processo (auto-heal) | [#273](https://github.com/andre0787/mileage-flow-manager/pull/273) | **Fase 1** do veredito do council 2026-08-05: travas mecânicas — `docs/handoff.md` em GENERATED_ARTIFACTS (rule-10 ×65), `healSession` no pre-pr corrige branch (rule-26 ×31) e docs por categoria (rule-02 ×4) automaticamente; telemetria `healed` + `healedByRule` no KPI. Gates de julgamento intactos (rule-27/35/33). **Fase 2** (em andamento — PR #275): Trava C — `healMapDocs` registra docs novos no MAP.md (seção "🤖 Índice Auto-Gerado" com marcação `(auto)`, rule-17 ×12); Trava D — rule-27/33/35 registram `gate:blocked` (telemetria separada `gateBlockedByRule` no KPI, sem penalizar como violação) + mensagens acionáveis com comando exato do council |

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