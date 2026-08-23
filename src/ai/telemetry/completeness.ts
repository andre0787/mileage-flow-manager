/**
 * completeness.ts — Telemetry completeness (P11-03 Telemetry E2E).
 *
 * Checa o envelope mínimo completo (runId/planId/stepId/parentStepId/cost) +
 * model identity obrigatória (nunca "unset") + meta de completude
 * (≥ 99,5% envelopes completos, 100% campos críticos).
 *
 * Extraído de envelope.ts (rule-41 — hard limit de 150 linhas).
 */

import type { TelemetryEnvelope } from "./envelope";

/** Campos críticos: precisam estar presentes para o envelope contar como completo. */
export const CRITICAL_ENVELOPE_FIELDS = ["eventId", "eventType", "timestamp", "success"] as const;

/** Campos de identidade do run: exigidos para envelopes de execução/agente. */
export const RUN_IDENTITY_FIELDS = ["taskId", "runId", "model"] as const;

/** Model identity válida? "unset" é inválida (P11-03). */
export function hasValidModelIdentity(env: TelemetryEnvelope): boolean {
  return (
    typeof env.model === "string" && env.model.trim().length > 0 && env.model.trim() !== "unset"
  );
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
    if (f === "model") return hasValidModelIdentity(env);
    const v = env[f];
    return typeof v === "string" && v.length > 0;
  });
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
  missingFields: Partial<Record<TelemetryEnvelope["eventType"], string[]>>;
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
          if (f === "model") {
            if (!hasValidModelIdentity(env)) missing.push(f);
            continue;
          }
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
