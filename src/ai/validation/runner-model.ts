/**
 * runner-model.ts — Modelo determinístico de execução (P12-02/03/04).
 *
 * `executeValidationRun` calibrado para ser HONESTO (spec P12: descobrir
 * quando cada estratégia é melhor): single vence em tiny; multi vence em
 * medium; graph+multi vence em large/architectural com graphRisk alto — e
 * é PREJUDICIAL em tiny/small (custo de contexto sem ganho). Em produção,
 * os mesmos campos vêm do dispatcher real via envelopes de telemetria.
 *
 * Split do runner.ts para respeitar o hard limit de 150 linhas (rule-41).
 */

import type { RealTask, RunMetrics, ValidationConfig, ValidationStrategy } from "./types";
import {
  BASE_FAILURE,
  BASE_QUALITY,
  BASE_REWORK,
  CLASS_FACTOR,
  COST_PER_1K,
  DEFAULT_VALIDATION_CONFIG,
  riskPenalty,
  seeded,
} from "./runner-constants";
import { applyStrategy } from "./strategy-effects";

export { CLASS_FACTOR } from "./runner-constants";
export { applyStrategy } from "./strategy-effects";

export interface RepoState {
  commitSha: string;
  branch: string;
  workingTreeClean: boolean;
  beforeSha: string;
  afterSha: string;
}

/**
 * Simula (ou coleta) um run real para task × estratégia × repeat.
 * Determinístico para comparação válida; em produção, os mesmos campos
 * vêm do dispatcher real (envelopes de telemetria).
 */
export function executeValidationRun(
  task: RealTask,
  strategy: ValidationStrategy,
  repo: RepoState,
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG,
  repeat = 1,
): RunMetrics {
  const taskClass = task.class;
  const factor = CLASS_FACTOR[taskClass];
  const rf = riskPenalty(task.risk);
  const jitter = 1 + (seeded(task.taskId, strategy, repeat) - 50) / 200; // ±25%

  const graphBenefit = task.graphRisk === "high" || task.graphRisk === "critical";
  const graphUsed = strategy === "graph+multi";

  // ── Qualidade: interação estratégia × classe × graphRisk ──
  const adjusted = applyStrategy(strategy, taskClass, graphBenefit, {
    quality: BASE_QUALITY[taskClass] - rf,
    failure: BASE_FAILURE[taskClass],
    rework: BASE_REWORK[taskClass],
  });
  let { quality, failure, rework } = adjusted;

  // Tokens: graph+multi consome mais contexto; classes maiores gastam mais.
  const graphTokens = graphUsed ? factor * 1.4 * 600 : 0;
  const baseTokens = Math.round((factor * 500 + rf * 800 + graphTokens) * jitter);
  const inputTokens = Math.round(baseTokens * 0.65);
  const outputTokens = baseTokens - inputTokens;
  const totalTokens = baseTokens;
  const cost = Math.round((totalTokens / 1000) * COST_PER_1K * 100000) / 100000;

  // Latência por fase.
  const graphLatencyMs = graphUsed ? Math.round(factor * 120 * jitter) : 0;
  const overhead = strategy === "single" ? 0.02 : strategy === "multi" ? 0.12 : 0.18;
  const planningTimeMs = Math.round((factor * 90 + overhead * 400) * jitter);
  const executionTimeMs = Math.round(factor * 420 * jitter);
  const validationTimeMs = Math.round(factor * 110 * jitter);
  const durationMs = planningTimeMs + executionTimeMs + validationTimeMs + graphLatencyMs;

  // Clamp para 0..1 e formatação.
  failure = Math.max(0.005, Math.min(1, failure));
  rework = Math.max(0.005, Math.min(1, rework));
  quality = Math.max(1, Math.min(10, quality));
  quality = Math.round(quality * 10) / 10;

  const status = failure < 0.3 ? "success" : "failure";
  const agentCount = strategy === "single" ? 1 : strategy === "multi" ? 4 : 5;
  const toolCalls = Math.round(agentCount * 4 * factor * jitter);
  const retryCount = failure > 0.2 ? Math.ceil((failure - 0.2) * 5) : 0;
  const testPassRate = Math.round(Math.max(0.4, 1 - rework - failure / 2) * 100) / 100;
  const contextSize = Math.round(totalTokens * 2.2);
  const contextFreshness =
    Math.round(Math.max(0.85, 1 - (graphUsed && !graphBenefit ? 0.05 : 0.01)) * 100) / 100;
  const budgetUsage = Math.round(Math.min(1, (factor * 0.5 + overhead) * jitter) * 100) / 100;
  const orchestrationOverhead =
    Math.round(((planningTimeMs + graphLatencyMs) / durationMs) * 100) / 100;

  return {
    taskId: task.taskId,
    strategy,
    agent:
      strategy === "single"
        ? "implementer"
        : strategy === "multi"
          ? "multi-agent"
          : "graph+multi-agent",
    model: config.model,
    role: strategy === "single" ? "implementer" : "orchestrated",
    status,
    quality,
    durationMs,
    inputTokens,
    outputTokens,
    totalTokens,
    cost,
    toolCalls,
    retryCount,
    rework: Math.round(rework * 100) / 100,
    graphUsed,
    graphLatencyMs,
    contextSize,
    contextFreshness,
    budgetUsage,
    validation: status === "success",
    testPassRate,
    failureRate: Math.round(failure * 100) / 100,
    agentCount,
    orchestrationOverhead,
    planningTimeMs,
    executionTimeMs,
    validationTimeMs,
    repository: repo,
    repeats: 1,
    meanDurationMs: durationMs,
    medianDurationMs: durationMs,
    varianceDurationMs: 0,
    sampleCount: 1,
    confidence: 0.5,
  };
}
