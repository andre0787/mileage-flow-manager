/**
 * envelope.ts — Telemetry Envelope (SDD v5.0, seções 19-21; P11-03 Telemetry E2E).
 *
 * Todos os adapters emitem os MESMOS eventos com o MESMO envelope, com
 * agentAdapter/agentRole/model separados — permitindo comparar
 * "Pi + Qwen" vs "Codex + X" sem concatenar identificadores.
 *
 * P11-03: envelope mínimo completo (runId/planId/stepId/parentStepId/cost) +
 * model identity obrigatória (nunca "unset" sem justificativa) + completeness
 * checker (meta ≥ 99,5% envelopes completos, 100% campos críticos).
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

/** Campos críticos: precisam estar presentes para o envelope contar como completo. */
export const CRITICAL_ENVELOPE_FIELDS = ["eventId", "eventType", "timestamp", "success"] as const;

/** Campos de identidade do run: exigidos para envelopes de execução/agente. */
export const RUN_IDENTITY_FIELDS = ["taskId", "runId", "model"] as const;

/** Model identity válida? "unset" é inválida (P11-03). */
export function hasValidModelIdentity(env: TelemetryEnvelope): boolean {
  return typeof env.model === "string" && env.model.length > 0 && env.model !== "unset";
}

/**
 * Um envelope é "completo" se tem todos os campos críticos + identidade do
 * run quando é evento de execução/agente/tool/graph (persistíveis).
 */
export function isEnvelopeComplete(env: TelemetryEnvelope): boolean {
  const critical = CRITICAL_ENVELOPE_FIELDS.every((f) => {
    const v = env[f];
    return v !== undefined && v !== null && v !== "";
  });
  if (!critical) return false;
  const needsIdentity =
    env.eventType.startsWith("execution.") ||
    env.eventType.startsWith("agent.") ||
    env.eventType.startsWith("tool.") ||
    env.eventType.startsWith("graph.query.");
  if (!needsIdentity) return true;
  return RUN_IDENTITY_FIELDS.every((f) => {
    const v = env[f];
    return typeof v === "string" && v.length > 0;
  });
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

export interface EnvelopeCompletenessReport {
  total: number;
  complete: number;
  /** Percentual 0..100 de envelopes completos. */
  completenessPct: number;
  /** Envelopes com model identity inválida ("unset"/vazio). */
  missingModelIdentity: number;
  /** Meta P11-03: ≥ 99,5%. */
  met: boolean;
  missingFields: Partial<Record<TelemetryEventType, string[]>>;
}

/**
 * Mede completude de uma lista de envelopes (P11-03 telemetry completeness).
 * Meta: ≥ 99,5% completos; 100% dos campos críticos.
 */
export function checkEnvelopeCompleteness(
  envelopes: TelemetryEnvelope[],
): EnvelopeCompletenessReport {
  let complete = 0;
  let missingModelIdentity = 0;
  const missingFields: EnvelopeCompletenessReport["missingFields"] = {};

  for (const env of envelopes) {
    const persistable =
      env.eventType.startsWith("execution.") ||
      env.eventType.startsWith("agent.") ||
      env.eventType.startsWith("tool.") ||
      env.eventType.startsWith("graph.query.");
    if (persistable && !hasValidModelIdentity(env)) missingModelIdentity += 1;
    if (!isEnvelopeComplete(env)) {
      const missing: string[] = [];
      for (const f of CRITICAL_ENVELOPE_FIELDS) {
        const v = env[f];
        if (v === undefined || v === null || v === "") missing.push(f);
      }
      if (persistable) {
        for (const f of RUN_IDENTITY_FIELDS) {
          const v = env[f];
          if (typeof v !== "string" || v.length === 0) missing.push(f);
        }
      }
      missingFields[env.eventType] = missing;
    } else {
      complete += 1;
    }
  }

  const total = envelopes.length;
  const completenessPct = total === 0 ? 0 : Math.round((complete / total) * 1000) / 10;
  return {
    total,
    complete,
    completenessPct,
    missingModelIdentity,
    met: total > 0 && completenessPct >= 99.5 && missingModelIdentity === 0,
    missingFields,
  };
}
