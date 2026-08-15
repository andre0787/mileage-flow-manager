# P12-00 — Baseline Operational Audit

> Auditado em 2026-08-15 (branch `feat/p12-real-world-validation`, base `main` b1b05b0).
> Método: OBSERVE → EXECUTE → MEASURE. Nenhuma coleta da P12 começou antes deste documento.

## Resumo executivo

A arquitetura P11 (Graph, Agent/Model Abstraction, Context Packets, Planner, Scheduler, Dispatcher, Budgets, Reliability, Telemetry, Adaptive Orchestration, Benchmark, Neo4j Readiness, KPI, Workflow Observability) está **estruturalmente completa e certificada** (P11 OVERALL 10.00). A P12 coloca essa máquina para trabalhar com **dados reais**: o foco é construir a infraestrutura de medição (dataset real, runners por estratégia, análises de evidência) — **sem** alterar Planner/Scheduler/Graph/Context/Agent/Model routing antes de haver evidência.

## 1. Gates executados (spec P12-00)

| Gate | Resultado |
|---|---|
| `npm run check:fast` | ✅ PASS (nenhum problema encontrado) |
| `npm run pre-pr` | ✅ 0 errors (na branch; main viola regra #4 — esperado) |
| `npm run ai:p11:score` | ✅ OVERALL 10.00 / STATUS PASS (16 eixos) |
| `npm test` | ✅ 1109/1109 (132 files) |

## 2. Inventário operacional (pronto para medir)

| Área | Arquivos | Estado para P12 |
|---|---|---|
| Agent Adapter | `adapters/pi.ts`, `adapters/generic.ts`, `adapters/registry.ts` | ✅ health/version/model identity (P11-01) |
| Telemetry E2E | `telemetry/envelope.ts` + `completeness.ts` | ✅ envelope completo (runId/planId/stepId/parentStepId/cost) + completeness checker |
| Graph | `graph/engine.ts` + `metrics.ts` + `graph-value.ts` + `readiness.ts` | ✅ p50/p95/p99, cache, multi-hop, comparativo, readiness com histórico |
| Context | `core/context-packet.ts` | ✅ graph/domain/history/test context + freshness + confidence |
| Planner/Scheduler/Dispatcher | `orchestration/*` | ✅ budget-aware, retry, cancel, failure taxonomy |
| Adaptive | `orchestration/classifier.ts` + `adaptive-planner.ts` + `explainability.ts` | ✅ tiny/small/medium/large + why_* |
| Benchmark | `benchmark/*` (dataset T1-T8, profiles, scoring, compare) | ⚠️ **sintético** — P12-01 exige dataset de tasks REAIS |
| Validation | `execution/final-validator.ts`, `execution/domain-knowledge.ts` | ✅ |
| Runner real | `scripts/exec-run-real.ts` (tsx) | ✅ pipeline §3 real via dispatcher |

## 3. Delta que a P12 deve construir (infra de medição, não features)

| Fase | O que falta | Tipo |
|---|---|---|
| **P12-01** | Dataset real de tasks (20–50) com taskId/description/class/risk/expectedFiles/expectedModules/domainRisk/graphRisk/testRisk/apiRisk/schemaRisk/acceptanceCriteria | dado + módulo |
| **P12-02** | Runner single-agent que registra métricas reais (§11) por task | módulo + runner |
| **P12-03** | Runner multi-agent nas mesmas tasks relevantes | módulo |
| **P12-04** | Runner graph+multi; comparativo single vs multi vs graph+multi | módulo |
| **P12-05** | Reliability: latência por fase, ranking de gargalos, triggers (>5% failure, >10% rework, <99.5% telemetry, >2% budget, >3% timeout, >2% stale) | análise |
| **P12-06** | Matrizes agent×role, model×role, task class×role com sample_count/confidence | análise |
| **P12-07** | Graph ROI (quality/rework/token/latency) + Neo4j score/trend/p95/multi-hop + PoC recommendation | análise |
| **P12-08** | Workflow efficiency: role_value_score por role (invocation/skip/success/failure/rework_prevented/latency/tokens/cost) | análise |
| **P12-09** | `docs/P12-REAL-WORLD-EVIDENCE-REPORT.md` (todas as seções, incluindo Unexpected Findings) | relatório |
| **P12-10** | `docs/P13-EVIDENCE-DRIVEN-ROADMAP.md` (recomendações com id/problem/evidence/impact/confidence/priority/effort/risk) | roadmap |

## 4. Restrições da P12 (spec §5)

**Permitido:** correção de bugs/regressões/segurança/telemetry/execução; pequenos ajustes para coletar métricas; melhorias de observabilidade.

**Não permitido sem evidência:** reescrever Planner/Scheduler, novos agentes, novo framework, migrar Neo4j, substituir Graph Engine, alterar profundamente Context Packet, aprendizado automático, policies automáticas. → viram recomendações P13.

## 5. Controle de variáveis (spec §14-17)

- Comparações: mesma task, mesmo modelo, mesmo estado do repositório, mesmos critérios de aceite — variando apenas `strategy`.
- Cada run registra: commit SHA, branch, working tree status (before/after SHA se a task modifica o repo).
- Contaminação: preferir mesmo base commit / workspace isolado / reset completo.
- Repeatability: `repeat >= 3` para tasks importantes; registrar mean/median/variance.

---

**Status P12-00: ✅ PASS** — sistema pronto para coletar dados reais; P12-01 autorizada.
