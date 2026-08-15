/**
 * reliability.ts — P12-05 Reliability & Bottleneck Analysis.
 *
 * Calcula métricas de confiabilidade por fase (planner/scheduler/graph/
 * context/agent/tool/validation/telemetry), ranking de gargalos e aciona
 * triggers de investigação da spec P12-05. Os triggers vivem em
 * reliability-triggers.ts (rule-41 — hard limit de 150 linhas).
 */

import type { RunMetrics, ValidationConfig } from "./types";
import { DEFAULT_VALIDATION_CONFIG } from "./runner";
import {
  buildTriggers,
  collectTriggerInputs,
  type ReliabilityTrigger,
} from "./reliability-triggers";

export type { ReliabilityTrigger } from "./reliability-triggers";

export interface PhaseLatency {
  phase:
    "planner" | "scheduler" | "graph" | "context" | "agent" | "tool" | "validation" | "telemetry";
  totalMs: number;
  share: number; // 0..1 do tempo total
}

export interface Bottleneck {
  phase: PhaseLatency["phase"];
  totalMs: number;
  share: number;
  rank: number;
}

export interface ReliabilityReport {
  triggers: ReliabilityTrigger[];
  bottlenecks: Bottleneck[];
  totalRuns: number;
  failureRate: number;
  reworkRate: number;
  telemetryCompleteness: number;
  budgetViolationRate: number;
  timeoutRate: number;
  contextStaleRate: number;
}

/** Distribui o durationMs de cada run entre as fases (determinístico). */
export function phaseLatencies(runs: RunMetrics[]): PhaseLatency[] {
  const totals: Record<PhaseLatency["phase"], number> = {
    planner: 0,
    scheduler: 0,
    graph: 0,
    context: 0,
    agent: 0,
    tool: 0,
    validation: 0,
    telemetry: 0,
  };
  for (const r of runs) {
    totals.planner += r.planningTimeMs;
    totals.validation += r.validationTimeMs;
    totals.graph += r.graphUsed ? r.graphLatencyMs : 0;
    // agent = execução; tool = subset da execução; scheduler/context/telemetry
    // são frações pequenas estimadas a partir do overhead.
    totals.agent += r.executionTimeMs;
    totals.tool += Math.round(r.executionTimeMs * 0.4);
    totals.scheduler += Math.round(r.durationMs * 0.01 * r.agentCount);
    totals.context += Math.round(r.durationMs * 0.015);
    totals.telemetry += Math.round(r.durationMs * 0.005);
  }
  const grand = runs.reduce((a, r) => a + r.durationMs, 0) || 1;
  return (Object.keys(totals) as PhaseLatency["phase"][]).map((phase) => ({
    phase,
    totalMs: totals[phase],
    share: Math.round((totals[phase] / grand) * 10000) / 10000,
  }));
}

export function analyzeReliability(
  runs: RunMetrics[],
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG,
): ReliabilityReport {
  const inputs = collectTriggerInputs(runs);
  const triggers = buildTriggers(inputs, config);

  const latency = phaseLatencies(runs);
  const ranked = [...latency]
    .sort((a, b) => b.totalMs - a.totalMs)
    .map((l, i) => ({
      phase: l.phase,
      totalMs: l.totalMs,
      share: l.share,
      rank: i + 1,
    }));

  return {
    triggers,
    bottlenecks: ranked,
    totalRuns: runs.length,
    failureRate: Math.round(inputs.failureRate * 1000) / 1000,
    reworkRate: Math.round(inputs.reworkRate * 1000) / 1000,
    telemetryCompleteness: Math.round(inputs.telemetryCompleteness * 10000) / 10000,
    budgetViolationRate: Math.round((inputs.budgetViolations / inputs.total) * 1000) / 1000,
    timeoutRate: Math.round((inputs.timeouts / inputs.total) * 1000) / 1000,
    contextStaleRate: Math.round((inputs.stale / inputs.total) * 1000) / 1000,
  };
}
