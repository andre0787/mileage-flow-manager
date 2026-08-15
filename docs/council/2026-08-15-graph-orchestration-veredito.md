# Veredito — Adapter Pi + Multi-Agent Orchestrator + integração graph:context (P5-P6)

**Tema:** Continuar o SDD v5.0 após o P5-01 (PR #413): (1) primeiro adapter concreto (pi) implementando `AgentAdapter` + registry; (2) Multi-Agent Orchestration (planner/dispatcher/scheduler/budget/dependency-resolver) usando os contratos prontos; (3) integrar `graph:context`/`graph:impact` no fluxo de trabalho para medir redução de tokens (meta SDD >=30%).
**Data:** 2026-08-15
**Sessão:** feature — P5-P6 Graph Orchestration
**Base:** `src/ai/` do PR #413 (contratos core + engine fail-open + CLI graph:*).

## Advisors

### Advisor: The Contrarian

**Análise:** Riscos: (1) adapter "pi" concreto pode virar acoplamento disfarçado — o core deve continuar falando só com `AgentAdapter`; o registry resolve por `id` e o core nunca importa `adapters/pi` diretamente. (2) Orchestrator "real" que executa agentes de verdade é complexo e não testável sem agentes — escopo P6 deve ser a **orquestração lógica** (plano → agendamento → dispatcher com execute() injetável), com um executor mock nos testes. (3) integrar graph:context no pre-pr pode inflar o tempo do pre-pr — deve ser fail-open e rápido (CRG ausente → skip, sem bloquear).
**Veredito:** Faça — registry sem acoplamento, orchestrator com execute() injetável, integração fail-open.

### Advisor: First Principles Thinker

**Análise:** O SDD §12 define o fluxo: task analysis → graph context → capability matching → scouts → architect → implementer → tester → reviewer → validator. O P6 entrega: `planner.ts` (task → ExecutionPlan com capability matching via `satisfiesCapabilities`/`modelSatisfies`), `scheduler.ts` (respeita parallelGroup + writeScope via `conflictsWith`, degrada com `serializePlan`), `dispatcher.ts` (executa steps via adapters com telemetry envelope). A degradação (§14) é o coração: sem subagentes → sequencial; sem structured output → parser; sem tool calling → CLI bridge.
**Veredito:** Faça — fiel ao SDD §12/§14, com funções puras testáveis.

### Advisor: The Expansionist

**Análise:** Vale incluir no P6: (1) registry com `registerAdapter`/`resolveAdapter` (permite plugins futuros codex/claude-code); (2) `budget.ts` com verificações (maxTokens/maxCost/maxDurationMs/maxParallel) — o dispatcher consulta antes de cada step; (3) execução "dry-run" (plano sem executar) para o CLI `graph:plan`; (4) telemetry dos eventos §19 (execution.started/completed/failed, agent.dispatched/completed) emitidos pelo dispatcher. Não incluir: persistência em banco, retry com backoff real, UI.
**Veredito:** Faça — P6 lógico + dry-run + telemetry, sem UI/DB.

### Advisor: The Outsider

**Análise:** Para o usuário (dev), o ganho concreto é o `graph:plan` (ver o plano de execução antes de rodar) e o pre-pr reportando `graph:context` (quantos tokens o packet economizou). A integração no pre-pr deve medir: tamanho do packet vs. estimativa de contexto "ingênuo" (todos os arquivos afetados lidos inteiros) → % de redução. Com o CRG ausente, skip silencioso.
**Veredito:** Faça — métrica de redução no relatório do pre-pr, fail-open.

### Advisor: The Executor

**Análise:** Viabilidade: 1 PR com 3 frentes: (A) `src/ai/adapters/registry.ts` + `src/ai/adapters/pi.ts` + `src/ai/adapters/generic.ts`; (B) módulos em `src/ai/orchestration/` (planner, scheduler, dispatcher, budget, dependency-resolver) + barrel em `src/ai/index.ts`; (C) `scripts/graph-intel.mjs` ganha `plan` (dry-run) e o pre-pr roda `graph:context` com métrica de redução (fail-open). Testes: unit por módulo (rule-31). Rule-41: <150 linhas por arquivo — os arquivos de orchestration podem precisar de split.
**Veredito:** Faça — 1 PR, TDD, pre-pr ao final.

### Peer Review (anônimo)

- **Reforço:** Consenso em orchestrator lógico com execute() injetável; registry sem import de adapter no core; integração fail-open no pre-pr.
- **Ajuste:** Executor: `planner.ts` pode ficar >150 linhas com capability matching + geração de plano — dividir em `planner.ts` (plano) e `capability-match.ts` se necessário. Contrarian: telemetry envelope emitido no dispatcher, mas o log vai para `docs/tracking/events.jsonl` via event-log (padrão do projeto), não novo canal.

## Síntese do Chairman

**Consenso:** Implementar P5-P6:

1. **`src/ai/adapters/registry.ts`** — `registerAdapter`/`resolveAdapter`/`listAdapters`; core importa só o registry.
2. **`src/ai/adapters/pi.ts`** — adapter de referência (capabilities completas: toolCalling, subagents, streaming, structuredOutput, parallelAgents) com `execute()` que delega ao CLI graph/event-log de forma segura.
3. **`src/ai/adapters/generic.ts`** — adapter degradado (tudo false, §14) — caso de teste do fallback.
4. **`src/ai/orchestration/planner.ts`** — task → ExecutionPlan via capability matching (agent + model) com dry-run.
5. **`src/ai/orchestration/scheduler.ts`** — ordena steps por parallelGroup, degrada com `serializePlan` quando sem paralelismo.
6. **`src/ai/orchestration/dependency-resolver.ts`** — resolve `dependsOn` (topological order + detecção de ciclo).
7. **`src/ai/orchestration/budget.ts`** — verifica maxTokens/maxCost/maxDurationMs/maxParallel antes de cada dispatch.
8. **`src/ai/orchestration/dispatcher.ts`** — executa steps via adapter (execute() injetável), emite telemetry envelope (§19) via event-log, fail-open.
9. **CLI `graph:plan <task>`** — dry-run do plano (sem executar).
10. **pre-pr**: roda `graph:context` e reporta métrica de redução de tokens (fail-open, skip sem CRG).
11. **Testes** unit por módulo + docs atualizados.

**Veredito Final:** Faça — 1 PR, TDD, pre-pr ao final.

**Próximos Passos:** encaminhar para Superpowers — branch `feat/graph-orchestration`, TDD, CLI + pre-pr, docs, pre-pr + PR.

**Extended Thinking Usado:** sim — Contrarian (fail-open e anti-acoplamento) e Executor (viabilidade e split rule-41).
