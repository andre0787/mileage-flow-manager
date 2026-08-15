# 🧠 Graph Intelligence (P5-01) — MilesControl v5.0

> Primeira implementação do **SDD v5.0** (`docs/`): core agnóstico de agente
> (Graph Engine + Context Packets + contratos) com telemetria padronizada.
> Veredito do council: `docs/council/2026-08-15-graph-intelligence-foundation-veredito.md`.

## Princípios (SDD v5.0)

- **P1 Agent Agnostic** — o core (`src/ai/core`, `src/ai/graph`, `src/ai/telemetry`)
  NUNCA importa SDK de agente. Adapters concretos (pi/codex/claude-code) virão
  em fases posteriores implementando `AgentAdapter`.
- **P2/P3 Capability-driven** — o router decide por capacidades requeridas da
  task, não por "agente X é melhor".
- **P4 Evidence-driven** — nada de Neo4j/paralelismo/novo agente sem métrica
  justificar (`graph:neo4j-readiness` existe exatamente para isso).
- **P5 Telemetry-first** — todo evento relevante tem envelope padronizado.

## Estrutura

```
src/ai/
  core/
    graph-types.ts      GraphNode · GraphEdge · GraphQueryResult + parsers CRG
    context-packet.ts   ContextPacket + builder determinístico + hash/tokens
    agent-contract.ts   AgentAdapter · AgentCapabilities (fronteira do core)
    model-contract.ts   ModelCapabilities · modelSatisfies · rankModels
    task-contract.ts    TaskContract · conflictsWith (paralelismo seguro)
    execution-plan.ts   ExecutionPlan · Budget · groupSteps · serializePlan
  graph/
    engine.ts           graph.status/build/update/query/impact/context/neo4jReadiness
  telemetry/
    envelope.ts         TelemetryEnvelope · createTelemetryEnvelope
```

## CLI

| Comando                         | O que faz                                      |
| ------------------------------- | ---------------------------------------------- |
| `npm run graph:status`          | Estado do grafo (CRG `status --json`)          |
| `npm run graph:build`           | Constrói o grafo (delega ao CRG)               |
| `npm run graph:update`          | Atualiza o grafo                               |
| `npm run graph:impact <alvo>`   | Nós alcançáveis a partir de um arquivo/símbolo |
| `npm run graph:context <alvo>`  | Context Packet do alvo (pipeline do impacto)   |
| `npm run graph:query [seletor]` | Nós/arestas (CRG `architecture --json`)        |
| `npm run graph:neo4j-readiness` | Score 0..1 + banda (SDD seção 25)              |

**Fail-open:** se o CRG não está instalado ou falha, o CLI e o engine retornam
`available:false` / resultado vazio — **nunca crasham**.

## Context Packet (SDD seção 7)

```json
{
  "packet_id": "uuid",
  "graph_version": "v1",
  "commit": "abc123",
  "created_at": "ISO-8601",
  "token_estimate": 120,
  "pruned_items": 0,
  "hash": "a1b2c3d4e5f6",
  "affectedFiles": ["src/lib/a.ts"],
  "symbols": ["foo"],
  "dependencies": ["b.ts"],
  "dependents": ["a.ts"],
  "tests": ["a.test.ts"],
  "domainEntities": ["OWNER"],
  "relatedTasks": [],
  "decisions": [],
  "risks": [],
  "constraints": []
}
```

## Contratos

- **AgentAdapter**: `id`, `capabilities()`, `execute(request)`, `cancel?(id)` —
  o core conversa apenas com esta interface (P1).
- **AgentCapabilities**: `toolCalling`, `parallelAgents`, `streaming`,
  `sessionPersistence`, `structuredOutput`, `subagents`, `worktrees`, `roles`.
- **ModelCapabilities**: `contextWindow`, `toolCalling`, `structuredOutput`,
  `reasoning`, `coding`, `speed`, `costTier` — separado do agente (P2).
- **TaskContract**: `taskId`, `intent`, `requiredCapabilities`, `risk`,
  `parallelizable`, `writeScope`, `expectedArtifacts`.
- **ExecutionPlan**: steps com `parallelGroup`/`dependsOn` + `Budget`
  (maxAgents 8, maxParallel 4, maxCost R$ 2.00...).

## Degradação (SDD seção 14)

| Capacidade ausente | Degrada para                                       |
| ------------------ | -------------------------------------------------- |
| subagents          | execução sequencial single-agent (`serializePlan`) |
| paralelismo        | DAG serial                                         |
| structured output  | parser + validação                                 |
| tool calling       | CLI bridge                                         |
| CRG CLI            | `available:false`, resultado vazio, score 0        |

## Telemetria (SDD seções 19-21)

Envelope único para todos os adapters: `eventId`, `eventType`, `timestamp`,
`sessionId`, `taskId`, `executionId`, `agentAdapter`, `agentRole`, `model`,
`durationMs`, `inputTokens`, `outputTokens`, `tokensSaved`, `toolCalls`,
`success`, `errorCode` — com `agentAdapter/agentRole/model` **separados**
(permite comparar "Pi+Qwen" vs "Codex+X" sem concatenar identificadores).

## Neo4j Readiness (SDD seção 25)

Score 0..1 composto (densidade de arestas + % multi-hop), bandas:

```
0.00–0.39  local/Postgres
0.40–0.59  observe
0.60–0.74  prepare PoC
0.75–0.89  recommend PoC/migration
0.90–1.00  high priority
```

Sem dados → score 0 (P4: sem evidência, fica no Supabase/Postgres).

## Testes

`tests/unit/ai/` — 30 testes (parsers fail-open, packet builder/hash, contratos,
readiness/band). Regra-31: toda lib em `src/lib` (e `src/ai`) tem teste unitário.

## Roadmap (SDD seção 28)

P0-P4 (Foundation→Domain/Workflow Graphs) em fases futuras; **P5 Agent
Contracts** (este PR, tipos) → **P6 Multi-Agent Orchestration**
(planner/dispatcher/scheduler) → P7 Telemetry v5 → P8 Optimization →
P9/P10 Neo4j (somente se `graph:neo4j-readiness` acionar).
