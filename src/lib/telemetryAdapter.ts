/**
 * telemetryAdapter.ts — Maps ai_telemetry rows to TelemetryEnvelope format.
 * Shared by LivePipelineDag and LiveAiEngineeringCommandCenter.
 */

import { supabase } from "@/lib/supabase";
import type { TelemetryEnvelope } from "@/ai/telemetry/envelope";

/** Maps ai_telemetry row to TelemetryEnvelope format. */
export function mapToEnvelope(row: Record<string, unknown>): TelemetryEnvelope {
  const tokensUsed = Number(row.tokens_used ?? 0);
  const saved = Number(row.prompt_tokens_saved_by_pruning ?? 0);
  return {
    eventId: String(row.id ?? ""),
    eventType: (row.event_type ?? "agent.completed") as TelemetryEnvelope["eventType"],
    timestamp: String(row.created_at ?? new Date().toISOString()),
    sessionId: row.session_id ? String(row.session_id) : undefined,
    taskId: row.task_id ? String(row.task_id) : undefined,
    executionId: row.execution_id ? String(row.execution_id) : undefined,
    agentAdapter: row.agent_adapter ? String(row.agent_adapter) : undefined,
    agentRole: row.agent_role ? String(row.agent_role) : undefined,
    model: row.model ? String(row.model) : undefined,
    durationMs: row.total_execution_time_ms ? Number(row.total_execution_time_ms) : undefined,
    inputTokens: tokensUsed > 0 ? Math.round(tokensUsed * 0.7) : undefined,
    outputTokens: tokensUsed > 0 ? Math.round(tokensUsed * 0.3) : undefined,
    tokensSaved: saved > 0 ? saved : undefined,
    toolCalls: row.tool_calls ? Number(row.tool_calls) : undefined,
    cost: row.cost_estimate ? Number(row.cost_estimate) : undefined,
    success:
      row.success_rate !== null && row.success_rate !== undefined
        ? Number(row.success_rate) > 0
        : true,
    errorCode: row.error_code ? String(row.error_code) : null,
  };
}

/** Busca os envelopes na ai_telemetry (fail-open → []). */
function fetchEnvelopes(): Promise<TelemetryEnvelope[]> {
  return new Promise<TelemetryEnvelope[]>((resolve) => {
    supabase
      .from("ai_telemetry")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(
        ({ data }) => resolve((data ?? []).map(mapToEnvelope)),
        () => resolve([]),
      );
  });
}

/** TTL do cache — dados frescos por sessão sem recarregar a página (2026-09-07). */
export const ENVELOPES_TTL_MS = 5 * 60 * 1000;
let envelopesCache: { promise: Promise<TelemetryEnvelope[]>; at: number } | null = null;

/** Envelopes com cache TTL — resolve na hora dentro da janela, refetch fora. */
export function loadEnvelopes(): Promise<TelemetryEnvelope[]> {
  if (!envelopesCache || Date.now() - envelopesCache.at > ENVELOPES_TTL_MS) {
    envelopesCache = { promise: fetchEnvelopes(), at: Date.now() };
  }
  return envelopesCache.promise;
}

/** Reseta o cache — útil para testes. */
export function _resetEnvelopesCache(): void {
  envelopesCache = null;
}
