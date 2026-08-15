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
| 3 | P1 — Top violações do KPI de processo (auto-heal) | [#273](https://github.com/andre0787/mileage-flow-manager/pull/273) | **Fase 1** do veredito do council 2026-08-05: travas mecânicas — `docs/handoff.md` em GENERATED_ARTIFACTS (rule-10 ×65), `healSession` no pre-pr corrige branch (rule-26 ×31) e docs por categoria (rule-02 ×4) automaticamente; telemetria `healed` + `healedByRule` no KPI. Gates de julgamento intactos (rule-27/35/33). **Fase 2** ✅ ([#275](https://github.com/andre0787/mileage-flow-manager/pull/275)): Trava C — `healMapDocs` registra docs novos no MAP.md (seção "🤖 Índice Auto-Gerado" com marcação `(auto)`, rule-17 ×12); Trava D — rule-27/33/35 registram `gate:blocked` (telemetria separada `gateBlockedByRule` no KPI, sem penalizar como violação) + mensagens acionáveis com comando exato do council |
| 4 | **Agent Execution Spec v5 completa (§1-27)** | [#435](https://github.com/andre0787/mileage-flow-manager/pull/435) + [#437](https://github.com/andre0787/mileage-flow-manager/pull/437) | Auditoria da `02-Agent-Execution-Spec-MilesControl-v5.md` contra o código — 27/27 seções implementadas: Domain Scout real (CRG v2.3.7: `impact --files`/`search --kind Class`, 9 entidades + 11 tabelas + 8 regras de negócio + 7 impactos de dados), implementer (§19), `maxTurns` validado no budget (§13), historyScout (§7), graph update no `exec:run` (§22), pipeline §3 integrado (planner→scheduler→dispatcher `onTelemetry`→persist→validator) e runner TS real `exec:run:real`; envelopes §19 persistidos em `docs/tracking/envelopes.jsonl` (arquivo próprio, dedupe por `eventId`). `pre-pr` 0 errors, 1014 testes unit |

---

## 🔒 Pendentes (prioridade decrescente)

### ~~P2 — Subagentes falhando em pré-lançamento~~ ✅ **resolvido 2026-08-05** ([#277](https://github.com/andre0787/mileage-flow-manager/pull/277))

- **Causa raiz:** pacote `pi-subagents` **ausente** do ambiente (settings do pi sem o pacote) → responder RPC inexistente → `subagent_gate` falha em pre-launch (`failureKind: subagent_prelaunch`); agravado pela v0.39.0 (01/08) que passou a rejeitar agentes fora do catálogo (`allowedAgents` — `general-purpose`, `council-contrarian`, `review` eram inválidos)
- **Fix aplicado:** `pi install npm:pi-subagents` (settings registrado; extensão ativa no próximo startup do pi) + uso de agentes builtin (`worker`, `reviewer`, `oracle`, `scout`, `planner`, `researcher`, `advisor`, `delegate`, `context-builder`)
- **Guard no repo:** `npm run harness:check` (read-only; `--check` falha com mensagem acionável) — valida o harness ANTES de delegar, evitando falhas reativas no KPI; doc em `docs/LLM-ROUTER.md`

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