/**
 * persist.ts — Envelope → registro ai_telemetry (P7 Telemetry v5, SDD §19-21).
 *
 * Conversão PURA (sem Supabase — P1: o core não importa serviço externo):
 * um TelemetryEnvelope vira o shape da tabela `ai_telemetry`, com
 * agentAdapter/agentRole/model em colunas SEPARADAS (§21 — permite comparar
 * "Pi+Qwen" vs "Codex+X" sem concatenar identificadores).
 *
 * A inserção REST fica no script (scripts/telemetry-persist.mjs), fail-open.
 */

import type { TelemetryEnvelope } from "./envelope";
import { hasValidModelIdentity } from "./completeness";
import { estimateCost } from "@/lib/aiTelemetry";

export interface TelemetryRecord {
  session_id: string;
  area?: string | null;
  tokens_used: number;
  prompt_tokens_saved_by_pruning: number;
  total_execution_time_ms: number;
  cost_estimate: number;
  success_rate: number;
  event_type?: string | null;
  task_id?: string | null;
  execution_id?: string | null;
  agent_adapter?: string | null;
  agent_role?: string | null;
  model?: string | null;
  tool_calls?: number | null;
  error_code?: string | null;
}

export interface EnvelopeToRecordOptions {
  sessionId: string;
  costPer1kTokens?: number;
}

/**
 * Converte um envelope em registro da ai_telemetry. Fail-open: campos
 * ausentes viram null; tokens = input+output; area = agentRole ?? agentAdapter.
 */
export function envelopeToRecord(
  env: TelemetryEnvelope,
  opts: EnvelopeToRecordOptions,
): TelemetryRecord {
  const tokensUsed = (env.inputTokens ?? 0) + (env.outputTokens ?? 0);
  return {
    session_id: opts.sessionId || env.sessionId || "unknown",
    area: env.agentRole ?? env.agentAdapter ?? null,
    tokens_used: tokensUsed,
    prompt_tokens_saved_by_pruning: env.tokensSaved ?? 0,
    total_execution_time_ms: env.durationMs ?? 0,
    cost_estimate: estimateCost(tokensUsed, opts.costPer1kTokens),
    success_rate: env.success === false ? 0 : 1,
    event_type: env.eventType,
    task_id: env.taskId ?? null,
    execution_id: env.executionId ?? null,
    agent_adapter: env.agentAdapter ?? null,
    agent_role: env.agentRole ?? null,
    model: env.model ?? null,
    tool_calls: env.toolCalls ?? null,
    error_code: env.errorCode ?? null,
  };
}

/** Filtra envelopes que merecem persistência (execução/agente, SDD §19). */
export function isPersistableEnvelope(env: TelemetryEnvelope): boolean {
  return (
    hasValidModelIdentity(env) &&
    (env.eventType.startsWith("execution.") ||
      env.eventType.startsWith("agent.") ||
      env.eventType.startsWith("graph.query."))
  );
}
