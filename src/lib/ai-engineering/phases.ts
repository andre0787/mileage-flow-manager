/**
 * phases.ts — Workflow efficiency por fase (P11-08).
 *
 * Extraído de src/lib/aiEngineering.ts (rule-41 — hard limit de 150 linhas).
 */

import type { TelemetryEnvelope } from "@/ai/telemetry/envelope";

/** Fase → papel associado (workflow efficiency). */
const PHASE_ROLES: Record<string, string[]> = {
  planning: ["architect", "intent"],
  discovery: ["graph-scout", "domain-scout", "test-scout", "history-scout"],
  implementation: ["implementer"],
  testing: ["tester", "test-scout"],
  review: ["reviewer", "security-reviewer", "performance-reviewer"],
  validation: ["final-validator"],
};

export interface PhaseEfficiency {
  phase: string;
  durationMs: number;
  /** Percentual do tempo total (0..100). */
  pct: number;
}

/** Workflow efficiency: tempo por fase em % (spec §P11-08). */
export function computePhaseEfficiency(envelopes: TelemetryEnvelope[]): PhaseEfficiency[] {
  const byPhase = new Map<string, number>();
  for (const env of envelopes) {
    if (env.durationMs === undefined) continue;
    const role = env.agentRole ?? "";
    for (const [phase, roles] of Object.entries(PHASE_ROLES)) {
      if (roles.includes(role)) {
        byPhase.set(phase, (byPhase.get(phase) ?? 0) + env.durationMs);
        break;
      }
    }
  }
  const total = [...byPhase.values()].reduce((a, b) => a + b, 0);
  return [...byPhase.entries()]
    .map(([phase, durationMs]) => ({
      phase,
      durationMs,
      pct: total === 0 ? 0 : Math.round((durationMs / total) * 1000) / 10,
    }))
    .sort((a, b) => b.durationMs - a.durationMs);
}
