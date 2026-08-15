/**
 * envelope.ts — Telemetry Envelope (SDD v5.0, seções 19-21; P11-03 Telemetry E2E).
 *
 * Todos os adapters emitem os MESMOS eventos com o MESMO envelope, com
 * agentAdapter/agentRole/model separados — permitindo comparar
 * "Pi + Qwen" vs "Codex + X" sem concatenar identificadores.
 *
 * P11-03: envelope mínimo completo (runId/planId/stepId/parentStepId/cost) +
 * model identity obrigatória. O completeness checker vive em completeness.ts
 * (rule-41 — hard limit de 150 linhas por arquivo).
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
  /** Identificador do run (uma execução completa do pipeline). */
  runId?: string;
  planId?: string;
  /** Identificador do step (papel) dentro do plano. */
  stepId?: string;
  /** Step pai (ex.: agente → tool filho). */
  parentStepId?: string;
  executionId?: string;
  parentExecutionId?: string;
  agentAdapter?: string;
  agentRole?: string;
  /** Model identity — NUNCA "unset" sem justificativa (P11-03). */
  model?: string;
  profile?: string;
  phase?: string;
  durationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  tokensSaved?: number;
  toolCalls?: number;
  /** Custo estimado (USD) da execução (P11-03). */
  cost?: number;
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

// Completeness checker (P11-03) — extraído para manter o arquivo ≤ 150 linhas.
export {
  checkEnvelopeCompleteness,
  CRITICAL_ENVELOPE_FIELDS,
  hasValidModelIdentity,
  isEnvelopeComplete,
  RUN_IDENTITY_FIELDS,
  type EnvelopeCompletenessReport,
} from "./completeness";
