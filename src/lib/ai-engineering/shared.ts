/**
 * shared.ts — Helpers compartilhados do AI Engineering (P11-08).
 *
 * Extraído de src/lib/aiEngineering.ts (rule-41 — hard limit de 150 linhas
 * por arquivo).
 */

import type { TelemetryEnvelope } from "@/ai/telemetry/envelope";

/** Envelope de conclusão de agente (para agregar execuções). */
export function isAgentEvent(env: TelemetryEnvelope): boolean {
  return env.eventType === "agent.completed" || env.eventType === "agent.failed";
}

export function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

/** Número de tentativas do envelope (1 = sem retry). */
export function attemptsOf(env: TelemetryEnvelope): number {
  return (env as TelemetryEnvelope & { attempts?: number }).attempts ?? 1;
}
