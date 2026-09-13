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

/**
 * Verifica se um run possui TODOS os campos de telemetria §11 preenchidos,
 * independentemente de ter sido executado com sucesso ou falha.
 */
export function isRunTelemetryComplete(r: RunMetrics): boolean {
  if (!r) return false;

  const validIdentity =
    typeof r.taskId === "string" &&
    r.taskId.trim().length > 0 &&
    typeof r.agent === "string" &&
    r.agent.trim().length > 0 &&
    typeof r.model === "string" &&
    r.model.trim().length > 0 &&
    r.model.trim() !== "unset" &&
    typeof r.role === "string" &&
    r.role.trim().length > 0 &&
    typeof r.strategy === "string" &&
    r.strategy.trim().length > 0 &&
    typeof r.status === "string" &&
    r.status.trim().length > 0;

  if (!validIdentity) return false;

  const validRepo =
    Boolean(r.repository) &&
    typeof r.repository.commitSha === "string" &&
    r.repository.commitSha.trim().length > 0 &&
    typeof r.repository.branch === "string" &&
    r.repository.branch.trim().length > 0 &&
    typeof r.repository.workingTreeClean === "boolean" &&
    typeof r.repository.beforeSha === "string" &&
    r.repository.beforeSha.trim().length > 0 &&
    typeof r.repository.afterSha === "string" &&
    r.repository.afterSha.trim().length > 0;

  if (!validRepo) return false;

  return (
    typeof r.quality === "number" &&
    r.quality >= 0 &&
    typeof r.durationMs === "number" &&
    r.durationMs > 0 &&
    typeof r.inputTokens === "number" &&
    r.inputTokens >= 0 &&
    typeof r.outputTokens === "number" &&
    r.outputTokens >= 0 &&
    typeof r.totalTokens === "number" &&
    r.totalTokens > 0 &&
    typeof r.cost === "number" &&
    r.cost >= 0 &&
    typeof r.toolCalls === "number" &&
    r.toolCalls >= 0 &&
    typeof r.retryCount === "number" &&
    r.retryCount >= 0 &&
    typeof r.rework === "number" &&
    r.rework >= 0 &&
    typeof r.graphUsed === "boolean" &&
    typeof r.graphLatencyMs === "number" &&
    r.graphLatencyMs >= 0 &&
    typeof r.contextSize === "number" &&
    r.contextSize > 0 &&
    typeof r.contextFreshness === "number" &&
    r.contextFreshness > 0 &&
    typeof r.budgetUsage === "number" &&
    r.budgetUsage >= 0 &&
    typeof r.validation === "boolean" &&
    typeof r.testPassRate === "number" &&
    r.testPassRate >= 0 &&
    typeof r.failureRate === "number" &&
    r.failureRate >= 0 &&
    typeof r.agentCount === "number" &&
    r.agentCount > 0 &&
    typeof r.orchestrationOverhead === "number" &&
    r.orchestrationOverhead >= 0 &&
    typeof r.planningTimeMs === "number" &&
    r.planningTimeMs >= 0 &&
    typeof r.executionTimeMs === "number" &&
    r.executionTimeMs >= 0 &&
    typeof r.validationTimeMs === "number" &&
    r.validationTimeMs >= 0
  );
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
  const telemetryComplete = runs.filter(isRunTelemetryComplete).length;
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
