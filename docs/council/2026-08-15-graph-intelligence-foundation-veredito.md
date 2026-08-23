# Veredito — P5-01 Graph Intelligence Foundation (SDD v5.0)

**Tema:** SDD v5.0 — primeira implementação: `src/ai/` agnóstico de agente com Graph Engine (status/impact/context), Context Packets, contratos de agente/modelo/task/execução e envelope de telemetria.
**Data:** 2026-08-15
**Sessão:** feature — P5-01 Graph Intelligence Foundation
**Base:** CRG CLI (code-review-graph v2.3.7) já integrado via `npm run crg:*`; telemetria (`docs/tracking/events.jsonl` + `ai_telemetry`).

## Escopo da primeira implementação (seção 29 do SDD)

Entregáveis: GraphNode, GraphEdge, GraphQueryResult, ContextPacket, AgentAdapter, AgentCapabilities, ModelCapabilities, TaskContract, ExecutionPlan, envelope de telemetria, graph status, graph impact, graph context, testes e documentação. **Fora:** adapters concretos (pi/codex/claude-code), planner/dispatcher/scheduler reais, Neo4j — ficam para P5+.

## Advisors

### Advisor: The Contrarian

**Análise:** Risco principal é o core "agnóstico" nascer acoplado ao CRG CLI (pipx) — se o binário não existir, tudo deve degradar (fail-open), não quebrar. Segundo risco: criar 15 arquivos de tipos "bonitos" sem uso real (abstração especulativa — viola ponytail mode). Mitigação: cada contrato nasce com funções puras testáveis (builders/parsers) e pelo menos 1 consumidor real (CLI `graph:status/impact/context` + telemetry envelope usado pelo router).
**Veredito:** Faça — com fail-open no CRG e contratos com função real por arquivo.

### Advisor: First Principles Thinker

**Análise:** A definição operacional de agent-agnostic do SDD é: core não importa adapter. Estrutura: `src/ai/core/` (tipos + funções puras), `src/ai/telemetry/` (envelope), `src/ai/graph/` (engine com fallback para CRG CLI). O contrato `AgentAdapter` (capabilities + execute + cancel) é a fronteira — o core só conversa com `AgentAdapter`, nunca com "pi". O ContextPacket deve derivar do GraphQueryResult de forma determinística.
**Veredito:** Faça — fronteiras claras (core/adapter), funções puras, TDD.

### Advisor: The Expansionist

**Análise:** O P5-01 habilita o que vem depois: router por capability, orchestrator multi-agente, Neo4j readiness. Vale já incluir no foundation: (1) `parseGraphNodes/parseGraphEdges` para consumir a saída real do CRG (`crg architecture --json`); (2) `graph.neo4jReadiness()` com score 0-1 (fail-open sem dados); (3) CLI unificado `npm run graph:*` espelhando o SDD (status/build/update/impact/context/query/neo4j-readiness). Não incluir: planner/dispatcher (P6).
**Veredito:** Faça — foundation com parsers reais + CLI unificado, sem P6.

### Advisor: The Outsider

**Análise:** Pergunta óbvia: isso muda algo para o usuário final do app? Não — é infra de processo. O que o usuário (dev) ganha: comandos `graph:impact`/`graph:context` para descoberta de impacto antes de editar (economia de tokens/contexto, meta do SDD >=30%). A integração com o workflow existente: o CLI novo substitui/complementa `crg:*` com envelope de telemetria e formato padronizado.
**Veredito:** Faça — infra de processo, sem tocar no app React.

### Advisor: The Executor

**Análise:** Viabilidade: 1 PR. Arquivos: `src/ai/index.ts` (barrel) + módulos em `src/ai/core/` e `src/ai/telemetry/envelope.ts`, `src/ai/graph/engine.ts` (status/impact/context/query/neo4jReadiness com spawnSync fail-open do CRG), CLI `scripts/graph-intel.mjs` + atalhos npm, testes unit em `tests/unit/ai/`. Regra-31: libs com teste. Rule-41: arquivos < 150 linhas.
**Veredito:** Faça — 1 PR, TDD, pre-pr ao final.

### Peer Review (anônimo)

- **Reforço:** Consenso em fail-open (CRG ausente → status "unavailable", score 0), funções puras testáveis, frontieras core/adapter sem import de SDK.
- **Ajuste:** Contrarian pediu: não criar adapters vazios (`src/ai/adapters/pi/`) agora — só o contrato. Executor pediu: `graph:build`/`graph:update` delegam ao CRG (`code-review-graph build/update`) em vez de duplicar.

## Síntese do Chairman

**Consenso:** Implementar P5-01 Graph Intelligence Foundation:

1. **`src/ai/index.ts` (barrel)** — GraphNode, GraphEdge, GraphQueryResult + parsers da saída CRG (fail-open).
2. **`src/ai/core/context-packet.ts`** — ContextPacket com metadados (packet_id, graph_version, commit, created_at, token_estimate, pruned_items, hash) + builder a partir de GraphQueryResult.
3. **`src/ai/core/agent-contract.ts`** — AgentAdapter (id, capabilities, execute, cancel?) + AgentCapabilities. Sem adapters concretos.
4. **`src/ai/core/model-contract.ts`** — ModelCapabilities (contextWindow, toolCalling, structuredOutput, reasoning, coding, speed, costTier).
5. **`src/ai/core/task-contract.ts`** — TaskContract (taskId, intent, requiredCapabilities, risk, parallelizable, writeScope, expectedArtifacts).
6. **`src/ai/core/execution-plan.ts`** — ExecutionPlan (planId, taskId, agent, model, steps com parallelGroup/dependsOn) + Budget.
7. **`src/ai/telemetry/envelope.ts`** — TelemetryEnvelope (eventId, eventType, sessionId, taskId, executionId, agentAdapter, agentRole, model, durationMs, tokens, toolCalls, success, errorCode).
8. **`src/ai/graph/engine.ts`** — graph.status/impact/context/query/neo4jReadiness com spawnSync do CRG e degradação fail-open.
9. **CLI `scripts/graph-intel.mjs`** + atalhos `npm run graph:status|build|update|impact|context|query|neo4j-readiness`.
10. **Testes** unit (rule-31) + documentação (docs/GRAPH-INTELLIGENCE.md).

**Veredito Final:** Faça — 1 PR, TDD, pre-pr ao final.

**Próximos Passos:** encaminhar para Superpowers — branch `feat/graph-intelligence-foundation`, TDD em `tests/unit/ai/`, CLI + package.json, docs, pre-pr + PR.

**Extended Thinking Usado:** sim — Contrarian (fail-open e anti-abstração-especulativa) e Executor (viabilidade 1 PR).
