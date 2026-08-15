# Veredito — P7 Telemetry v5 (envelopes de execução/agente na ai_telemetry)

**Tema:** Persistir os envelopes de telemetria do dispatcher (SDD §19-21) na tabela `ai_telemetry` do Supabase, com agentAdapter/agentRole/model separados, para o KPI "Custo por Funcionalidade" cruzar custo por papel/área.
**Data:** 2026-08-15
**Sessão:** feature — P7 Telemetry v5
**Base:** `src/ai/` (PRs #413/#417), `src/lib/aiTelemetry.ts` (buildAiTelemetryRecord/costPerArea), migration `20260814000000_add_ai_telemetry.sql`, `scripts/telemetry-audit.mjs`.

## Advisors

### Advisor: The Contrarian

**Análise:** Riscos: (1) o core `src/ai/` NÃO pode importar Supabase (P1 — agnóstico) — a conversão envelope→registro deve ser pura (`src/ai/telemetry/persist.ts`) e a inserção REST fica no script; (2) o schema atual só tem area/tokens/time/cost — precisa de colunas novas (event_type, agent_adapter, agent_role, model) com DEFAULT NULL para não quebrar inserts existentes; (3) fail-open: sem credenciais, imprime e não bloqueia.
**Veredito:** Faça — conversão pura + migration additive + insert fail-open.

### Advisor: First Principles Thinker

**Análise:** O envelope já carrega tudo (§20): eventType, agentAdapter, agentRole, model, durationMs, inputTokens, outputTokens, tokensSaved, toolCalls, success. O mapeamento é direto: tokens_used = input+output, total_execution_time_ms = durationMs, success_rate = success?1:0, area = agentRole (ou agentAdapter+role), cost_estimate = estimateCost(tokens). O KPI existente `costPerArea` já agrega por area — persistindo com area = papel, o KPI ganha custo por papel sem novo código de agregação.
**Veredito:** Faça — mapeamento 1:1 do envelope para o registro, reusando costPerArea.

### Advisor: The Expansionist

**Análise:** Vale incluir: (1) script `telemetry:persist` que varre `docs/tracking/events.jsonl`, filtra envelopes (execution/agent) e insere no Supabase (fail-open); (2) no pre-pr, após as regras, persistir os envelopes da sessão (opcional, env-gated para não atrasar); (3) colunas novas também úteis para o Datadog interno (abas KPI/Workflow). Não incluir: UI nova, retry.
**Veredito:** Faça — script + persist opcional no pre-pr + migration additive.

### Advisor: The Outsider

**Análise:** Para o usuário (dev), o ganho é comparabilidade: "Pi+Qwen rodou o papel graph-scout a X reais" vs "Codex+X a Y". O envelope §21 já separa os três eixos — a tabela com as colunas novas permite esse corte sem concatenar identificadores.
**Veredito:** Faça — colunas separadas, sem string concatenada.

### Advisor: The Executor

**Análise:** Viabilidade: 1 PR. (A) migration additive `ALTER TABLE ai_telemetry ADD COLUMN event_type/agent_adapter/agent_role/model/task_id/execution_id/tool_calls/error_code` (todas nullable); (B) `src/ai/telemetry/persist.ts` — `envelopeToRecord(env, {sessionId})` puro + testes; (C) `scripts/telemetry-persist.mjs` — varre events.jsonl, filtra envelopes, insere via REST fail-open; (D) atalho npm `telemetry:persist`. Rule-31: lib com teste. Rule-41: <150 linhas.
**Veredito:** Faça — 1 PR, TDD, pre-pr ao final.

### Peer Review (anônimo)

- **Reforço:** Consenso em conversão pura (core não importa Supabase), migration additive, fail-open no script.
- **Ajuste:** Executor: `envelopeToRecord` precisa de um mapeamento estável de costPer1kTokens (default 0.003, mesmo da lib). Contrarian: não chamar persist no pre-pr por padrão (só com env `TELEMETRY_PERSIST=1`) para não adicionar latência de rede ao pre-pr.

## Síntese do Chairman

**Consenso:** Implementar P7:

1. **Migration** additive: `ALTER TABLE ai_telemetry ADD COLUMN event_type, task_id, execution_id, agent_adapter, agent_role, model, tool_calls, error_code` (todas nullable).
2. **`src/ai/telemetry/persist.ts`** — `envelopeToRecord(env, {sessionId, userId?, costPer1kTokens?})`: converte TelemetryEnvelope → registro ai_telemetry (tokens_used = input+output, area = agentRole ?? agentAdapter, success_rate = success?1:0, cost via estimateCost). Pura, sem Supabase.
3. **`scripts/telemetry-persist.mjs`** — lê `docs/tracking/events.jsonl`, filtra eventos com `agentAdapter` (envelopes §19), converte e insere via REST (fail-open, sem credenciais → imprime). `--dry-run` para listar.
4. **Atalho npm** `telemetry:persist`.
5. **Testes** unit de `envelopeToRecord` (mapeamento, custo, sucesso/falha) + docs.

**Veredito Final:** Faça — 1 PR, TDD, pre-pr ao final.

**Próximos Passos:** encaminhar para Superpowers — branch `feat/telemetry-v5`, migration + push, persist.ts + testes, script + atalho, docs, pre-pr + PR.

**Extended Thinking Usado:** sim — Contrarian (anti-acoplamento Supabase no core) e Executor (viabilidade 1 PR + latência do pre-pr).
