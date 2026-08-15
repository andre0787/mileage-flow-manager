/**
 * reliability-triggers.ts — Triggers de investigação (P12-05).
 *
 * Extraído do reliability.ts para respeitar o hard limit de 150 linhas
 * (rule-41). Os thresholds são configuráveis (spec P12-05 — são triggers
 * de investigação, não requisitos universais).
 */

import type { RunMetrics, ValidationConfig } from "./types";

export interface ReliabilityTrigger {
  name: string;
  metric: string;
  value: number;
  threshold: number;
  triggered: boolean;
}

export interface TriggerInputs {
  total: number;
  failureRate: number;
  reworkRate: number;
  telemetryCompleteness: number;
  budgetViolations: number;
  timeouts: number;
  stale: number;
}

/** Compõe os 6 triggers da spec P12-05. */
export function buildTriggers(
  inputs: TriggerInputs,
  config: ValidationConfig,
): ReliabilityTrigger[] {
  const t = config.triggers;
  return [
    {
      name: "failure-rate",
      metric: "failureRate",
      value: inputs.failureRate,
      threshold: t.failureRate,
      triggered: inputs.failureRate > t.failureRate,
    },
    {
      name: "rework-rate",
      metric: "reworkRate",
      value: inputs.reworkRate,
      threshold: t.reworkRate,
      triggered: inputs.reworkRate > t.reworkRate,
    },
    {
      name: "telemetry-completeness",
      metric: "telemetryCompleteness",
      value: inputs.telemetryCompleteness,
      threshold: t.telemetryCompleteness,
      triggered: inputs.telemetryCompleteness < t.telemetryCompleteness,
    },
    {
      name: "budget-violation",
      metric: "budgetViolationRate",
      value: inputs.budgetViolations / inputs.total,
      threshold: t.budgetViolation,
      triggered: inputs.budgetViolations / inputs.total > t.budgetViolation,
    },
    {
      name: "timeout-rate",
      metric: "timeoutRate",
      value: inputs.timeouts / inputs.total,
      threshold: t.timeoutRate,
      triggered: inputs.timeouts / inputs.total > t.timeoutRate,
    },
    {
      name: "context-stale",
      metric: "contextStaleRate",
      value: inputs.stale / inputs.total,
      threshold: t.contextStaleRate,
      triggered: inputs.stale / inputs.total > t.contextStaleRate,
    },
  ];
}

/** Coleta as métricas brutas que alimentam os triggers. */
export function collectTriggerInputs(runs: RunMetrics[]): TriggerInputs {
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
  return {
    total,
    failureRate,
    reworkRate,
    telemetryCompleteness: telemetryComplete / total,
    budgetViolations,
    timeouts,
    stale,
  };
}
