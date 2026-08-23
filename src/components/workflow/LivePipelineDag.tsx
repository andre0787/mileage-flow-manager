/**
 * LivePipelineDag.tsx — Fetches live telemetry from ai_telemetry
 * and maps to TelemetryEnvelope format for the DAG visualization.
 */

import { Suspense, use } from "react";
import { supabase } from "@/lib/supabase";
import WorkflowPipelineDag from "./WorkflowPipelineDag";
import type { TelemetryEnvelope } from "@//ai/telemetry/envelope";

/** Maps ai_telemetry row to TelemetryEnvelope format. */
function mapToEnvelope(row: Record<string, unknown>): TelemetryEnvelope {
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

/** Loads telemetry envelopes from Supabase (fail-open → []). */
function loadEnvelopes(): Promise<TelemetryEnvelope[]> {
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

let envelopePromise: Promise<TelemetryEnvelope[]> | null = null;

function LiveContent() {
  if (!envelopePromise) envelopePromise = loadEnvelopes();
  const envelopes = use(envelopePromise);
  return <WorkflowPipelineDag envelopes={envelopes} />;
}

export default function LivePipelineDag() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Pipeline real (DAG)</h3>
            <span className="text-xs text-muted-foreground">Carregando...</span>
          </div>
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
        </div>
      }
    >
      <LiveContent />
    </Suspense>
  );
}
