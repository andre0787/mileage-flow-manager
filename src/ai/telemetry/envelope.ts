/**
 * envelope.ts — Telemetry Envelope (SDD v5.0, seções 19-21).
 *
 * Todos os adapters emitem os MESMOS eventos com o MESMO envelope, com
 * agentAdapter/agentRole/model separados — permitindo comparar
 * "Pi + Qwen" vs "Codex + X" sem concatenar identificadores.
 */

import { randomUUID } from "node:crypto";

export type TelemetryEventType =
  | "execution.started"
  | "execution.completed"
  | "execution.failed"
  | "agent.dispatched"
  | "agent.started"
  | "agent.completed"
  | "agent.failed"
  | "agent.cancelled"
  | "tool.started"
  | "tool.completed"
  | "tool.failed"
  | "graph.query.started"
  | "graph.query.completed"
  | "graph.query.failed"
  | "context.created"
  | "context.pruned"
  | "model.route.resolved"
  | "model.route.completed"
  | "parallel.batch.started"
  | "parallel.batch.completed"
  | "gate.started"
  | "gate.completed"
  | "gate.failed";

export interface TelemetryEnvelope {
  eventId: string;
  eventType: TelemetryEventType;
  timestamp: string; // ISO-8601
  sessionId?: string;
  taskId?: string;
  executionId?: string;
  parentExecutionId?: string;
  agentAdapter?: string;
  agentRole?: string;
  model?: string;
  profile?: string;
  phase?: string;
  durationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  tokensSaved?: number;
  toolCalls?: number;
  success: boolean;
  errorCode?: string | null;
}

/** Constrói um envelope com defaults seguros. Fail-open: nunca lança. */
export function createTelemetryEnvelope(
  eventType: TelemetryEventType,
  partial: Partial<Omit<TelemetryEnvelope, "eventId" | "eventType" | "timestamp" | "success">> = {},
  success = true,
): TelemetryEnvelope {
  return {
    eventId: randomUUID(),
    eventType,
    timestamp: new Date().toISOString(),
    success,
    errorCode: null,
    ...partial,
  };
}

/** Converte o envelope em linha JSON (formato do event-log do projeto). */
export function envelopeToJsonLine(env: TelemetryEnvelope): string {
  return JSON.stringify(env);
}
