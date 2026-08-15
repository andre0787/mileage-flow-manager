/**
 * reliability.ts — P12-05 Reliability & Bottleneck Analysis.
 *
 * Calcula métricas de confiabilidade por fase (planner/scheduler/graph/
 * context/agent/tool/validation/telemetry), ranking de gargalos e aciona
 * triggers de investigação da spec P12-05:
 *   failure > 5% · rework > 10% · telemetry < 99.5% · budget > 2%
 *   timeout > 3% · context stale > 2%
 */

import type { RunMetrics, ValidationConfig } from "./types";
import { DEFAULT_VALIDATION_CONFIG } from "./runner";

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
  triggers: {
    name: string;
    metric: string;
    value: number;
    threshold: number;
    triggered: boolean;
  }[];
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
  const total = runs.length || 1;
  const failures = runs.filter((r) => r.status === "failure").length;
  const failureRate = failures / total;
  const reworkRate = runs.reduce((a, r) => a + r.rework, 0) / total;
  const budgetViolations = runs.filter((r) => r.budgetUsage > 0.98).length;
  const timeouts = runs.filter((r) => r.durationMs > 60000).length;
  const stale = runs.filter((r) => r.contextFreshness < 0.95).length;
  // Completude de telemetria: TODOS os campos §11 preenchidos (independente
  // de sucesso). Um run que falhou mas registrou tudo é telemetria completa.
  const telemetryComplete = runs.filter(
    (r) =>
      r.totalTokens > 0 &&
      r.cost >= 0 &&
      r.durationMs > 0 &&
      r.toolCalls >= 0 &&
      r.contextSize > 0 &&
      r.contextFreshness > 0 &&
      r.budgetUsage >= 0,
  ).length;

  const latency = phaseLatencies(runs);
  const ranked = [...latency]
    .sort((a, b) => b.totalMs - a.totalMs)
    .map((l, i) => ({
      phase: l.phase,
      totalMs: l.totalMs,
      share: l.share,
      rank: i + 1,
    }));

  const t = config.triggers;
  const triggers = [
    {
      name: "failure-rate",
      metric: "failureRate",
      value: failureRate,
      threshold: t.failureRate,
      triggered: failureRate > t.failureRate,
    },
    {
      name: "rework-rate",
      metric: "reworkRate",
      value: reworkRate,
      threshold: t.reworkRate,
      triggered: reworkRate > t.reworkRate,
    },
    {
      name: "telemetry-completeness",
      metric: "telemetryCompleteness",
      value: telemetryComplete / total,
      threshold: t.telemetryCompleteness,
      triggered: telemetryComplete / total < t.telemetryCompleteness,
    },
    {
      name: "budget-violation",
      metric: "budgetViolationRate",
      value: budgetViolations / total,
      threshold: t.budgetViolation,
      triggered: budgetViolations / total > t.budgetViolation,
    },
    {
      name: "timeout-rate",
      metric: "timeoutRate",
      value: timeouts / total,
      threshold: t.timeoutRate,
      triggered: timeouts / total > t.timeoutRate,
    },
    {
      name: "context-stale",
      metric: "contextStaleRate",
      value: stale / total,
      threshold: t.contextStaleRate,
      triggered: stale / total > t.contextStaleRate,
    },
  ];

  return {
    triggers,
    bottlenecks: ranked,
    totalRuns: runs.length,
    failureRate: Math.round(failureRate * 1000) / 1000,
    reworkRate: Math.round(reworkRate * 1000) / 1000,
    telemetryCompleteness: Math.round((telemetryComplete / total) * 10000) / 10000,
    budgetViolationRate: Math.round((budgetViolations / total) * 1000) / 1000,
    timeoutRate: Math.round((timeouts / total) * 1000) / 1000,
    contextStaleRate: Math.round((stale / total) * 1000) / 1000,
  };
}
