# P11-00 — Baseline Audit

> Auditado em 2026-08-15 (CRG 2.3.7, branch `main` + PRs #435/#437 mergeados).
> Método: AUDIT → COMPARE → PLAN. Nenhuma implementação da P11 começou antes deste documento.

## Resumo executivo

A fundação v5 (Graph, Workflow, Agent, Model, Context, Telemetry, Budget, Validation) **existe e está testada** (1014 testes unit, `pre-pr` 0 errors). A P11 deve transformá-la em sistema operacionalmente comprovado: os maiores gaps são **execução real (P11-01/02)**, **telemetria E2E completa (P11-03)**, **métricas de graph (P11-04)**, **orquestração adaptativa (P11-05)**, **benchmark (P11-06)**, **readiness com histórico (P11-07)** e **UIs de comando (P11-08/09)**.

## 1. Inventário por área

### 1.1 `src/ai/core` — ✅ implementado
| Peça | Arquivo | Estado |
|---|---|---|
| AgentAdapter / AgentCapabilities | `core/agent-contract.ts` | ✅ — contrato + `satisfiesCapabilities`; **falta `health()` e `version()` (P11-01)** |
| TaskContract | `core/task-contract.ts` | ✅ — risk, parallelizable, writeScope, `normalizeTask` fail-open |
| ModelCapabilities | `core/model-contract.ts` | ✅ — `modelSatisfies` + `rankModels` |
| ContextPacket | `core/context-packet.ts` | ✅ — packet hash, token estimate, pruning count; **falta graph/domain/history/test context + freshness (P11-04)** |
| ExecutionPlan + Budget | `core/execution-plan.ts` | ✅ — steps com parallelGroup/dependsOn, budget com todos os limites §13 |
| GraphTypes | `core/graph-types.ts` | ✅ — GraphNode/GraphEdge/GraphQueryResult |

### 1.2 `src/ai/orchestration` — ✅ implementado
| Peça | Arquivo | Estado |
|---|---|---|
| Planner | `orchestration/planner.ts` | ✅ — capability-driven, `pickAdapter`, `rankModels`, DEFAULT_ROLES, degradação por papel |
| Scheduler | `orchestration/scheduler.ts` | ✅ — batches por parallelGroup/dependsOn, serialização sem paralelismo, ciclo |
| Dispatcher | `orchestration/dispatcher.ts` | ✅ — budget-aware, telemetria por step, fail-open, `maxFailures`; **falta timeout/cancelamento/retry por step (P11-02)** |
| Budget | `orchestration/budget.ts` | ✅ — `checkBudget`/`consumeBudget` com todos os 7 limites |

### 1.3 `src/ai/adapters` — ⚠️ parcial
| Adapter | Arquivo | Estado |
|---|---|---|
| Pi | `adapters/pi.ts` | ⚠️ — capacidades reais, mas `execute` é **simbólico** (roda `code-review-graph status`, ignora a task); sem health/version (P11-01) |
| Generic | `adapters/generic.ts` | ⚠️ — contrato ok, execução stub simbólico |
| Registry | `adapters/registry.ts` | ✅ — register/resolve/list/clear |

### 1.4 `src/ai/execution` — ✅ implementado
Scouts (graph/domain/test/history), Architect, Implementer, Reviewer, Domain Knowledge (8 regras/7 impactos), Final Validator, Graph Freshness, Sanitize, SubagentResult — todos presentes e testados.

### 1.5 Telemetria — ⚠️ parcial
| Peça | Arquivo | Estado |
|---|---|---|
| Envelope | `telemetry/envelope.ts` | ✅ — 23 tipos de evento §19; **faltam campos runId/planId/stepId/parentStepId/cost (P11-03)** |
| Persist | `telemetry/persist.ts` | ✅ — envelope→ai_telemetry puro, `isPersistableEnvelope` |
| Persist REST | `scripts/telemetry-persist.mjs` | ✅ — env-gated, fail-open |
| Supabase | `migrations/2026*.ai_telemetry*` | ✅ — 3 migrations, colunas agent_adapter/agent_role/envelope |

### 1.6 Graph Intelligence — ⚠️ parcial
| Peça | Arquivo | Estado |
|---|---|---|
| Engine | `graph/engine.ts` | ✅ — status/build/update/query/impact/search/context/neo4jReadiness, CRG v2.3.7, fail-open |
| Readiness | `graph/engine.ts` (Neo4jReadiness) | ⚠️ — score 0..1 + banda, **sem histórico/trend/workload real (P11-07)** |
| Métricas de query | — | ❌ **ausente** — sem p50/p95/p99, cache, multi-hop (P11-04) |
| Graph Value | — | ❌ **ausente** — sem comparativo graph vs non-graph (P11-04) |

### 1.7 Scripts CLI
| Script | Estado |
|---|---|
| `scripts/graph-intel.mjs` | ✅ — status/build/update/impact/context/plan/query/neo4j-readiness |
| `scripts/exec-intel.mjs` | ✅ — scout/domain/test/review/run/validate |
| `scripts/exec-run-real.ts` (tsx) | ✅ — pipeline §3 real via dispatcher TS (runner P8) |
| `scripts/telemetry-persist.mjs` / `telemetry-audit.mjs` | ✅ |
| `scripts/llm-route.mjs` | ✅ — resolve/validate/complete com `config/llm-router.json` |

### 1.8 KPI UI / Workflow UI
| Peça | Estado |
|---|---|
| `src/components/KPIDashboard.tsx` + `kpi/*` | ⚠️ — KPI de processo sólido (pre-pr, gates, eficiência); **falta AI Engineering Command Center (P11-08)** |
| `src/pages/Workflow.tsx` + `workflow/*` | ⚠️ — timeline/mindmap/telemetria; **falta DAG real do pipeline com inspeção por node (P11-09)** |

### 1.9 Testes
| Suíte | Estado |
|---|---|
| `tests/unit/ai/*` (9 arquivos, 1014 total) | ✅ — contracts, context-packet, orchestration, execution, graph-engine, telemetry-envelope/persist, pipeline integrado |
| Adapter contract tests | ❌ **ausente** — P11-01 exige `adapter-contract.test.ts` |
| Budget edge tests (below/at/above/concurrent/failure/recovery) | ⚠️ parcial — P11-02 exige todos |
| Benchmark | ❌ ausente (P11-06) |

## 2. Comparativo com a P11 (delta)

| Área da P11 | Estado atual | Delta |
|---|---|---|
| **P11-01 Real Agent Foundation** | execute simbólico; sem health/version | Adapter com execução real (CLI/agente), timeout, health, version, model identity, telemetria; `adapter-contract.test.ts` |
| **P11-02 Execution Reliability** | budget 7 limites ok; sem retry/cancelamento/taxonomia | Retry classificado, cancelamento propagado, failure taxonomy (14 tipos), testes below/at/above/concurrent/failure/recovery |
| **P11-03 Telemetry E2E** | envelope ok, 23 eventos; sem runId/planId/stepId/parentStepId/cost | Campos do envelope completos, completeness checker (≥99,5%), model identity obrigatório |
| **P11-04 Graph & Context** | engine ok; sem métricas/freshness no packet/graph value | Graph metrics (p50/p95/p99, cache), Context Packet com graph/domain/history/test context + freshness, comparativo graph vs non-graph |
| **P11-05 Adaptive Orchestration** | planner fixo DEFAULT_ROLES | Task classifier (tiny/small/medium/large), workflow dinâmico, anti-over-orchestration, explainability (why_*) |
| **P11-06 Benchmark** | ausente | Dataset T1-T8, estratégias A/B/C, relatório comparativo |
| **P11-07 Neo4j readiness** | score + banda apenas | Workload metrics reais, histórico persistido, trend, thresholds configuráveis, recomendação |
| **P11-08 KPI Dashboard** | KPI de processo | AI Engineering Command Center: Tasks/Success/Cost/Tokens/Rework/Latency/Graph ROI/Agent/Model/Bottlenecks/Neo4j |
| **P11-09 Workflow UI** | timeline estática | DAG do pipeline real + inspeção por node + Why? |
| **P11-10 Certificação** | — | `npm run ai:p11:score` (15 eixos ≥ 9,5) |

## 3. Restrições observadas (P11 §3)

- Sem créditos externos: Pi + modelos locais + Generic Adapter + mocks determinísticos.
- CRG 2.3.7 presente (`code-review-graph` 2.3.7, grafo com 2330 nós / 26469 arestas / 426 arquivos).
- `tsx` disponível (runner TS real já existe — `exec:run:real`).
- Migrations de telemetria existem e não devem ser alteradas sem necessidade comprovada.

## 4. Plano de fases (ordem oficial)

1. **P11-01** — Adapter real: contrato health/version, execução via CLI com timeout/telemetria, adapter-contract.test.ts
2. **P11-02** — Retry classificado, cancelamento, failure taxonomy, testes de budget/limite
3. **P11-03** — Envelope completo (runId/planId/stepId/parentStepId/cost), completeness checker
4. **P11-04** — Graph metrics collector, Context Packet estendido + freshness, graph value comparator
5. **P11-05** — Task classifier + adaptive planner + anti-over-orchestration + explainability
6. **P11-06** — Benchmark framework (dataset T1-T8, estratégias A/B/C, relatório)
7. **P11-07** — Readiness com workload real + histórico + trend + recomendação
8. **P11-08** — AI Engineering Command Center no KPI
9. **P11-09** — Workflow Observability (DAG do pipeline + Why?)
10. **P11-10** — `npm run ai:p11:score` + certificação final ≥ 9,5

---

**Status P11-00: ✅ PASS** — baseline completa; P11-01 autorizada.
