/**
 * runner.ts — Benchmark Runner (P11-06 Benchmark Framework).
 *
 * Compara estratégias (spec §P11-06):
 *   A = single-agent        (implementer apenas)
 *   B = multi-agent         (workflow medium: scout+architect+implement+test+review)
 *   C = graph + multi-agent (workflow large com graph scouts)
 *
 * Perfis/classes vivem em profiles.ts, métricas+eficiência em scoring.ts e
 * o comparador/relatório em compare.ts (rule-41 — hard limit de 150 linhas).
 */

import type { TaskClass } from "@/ai/orchestration/classifier";
import type { BenchmarkTask } from "./dataset";
import {
  CLASS_FACTOR,
  DEFAULT_STRATEGY_PROFILES,
  type BenchmarkStrategy,
  type StrategyProfiles,
} from "./profiles";
import type { BenchmarkMetrics } from "./scoring";
import { compareStrategies, type BenchmarkReport, type BenchmarkSummary } from "./compare";

/**
 * Simula um run determinístico (mesmo seed → mesmo resultado) para a task +
 * estratégia. Em produção, esta função recebe métricas reais do dispatcher.
 */
export function simulateRun(
  task: BenchmarkTask,
  taskClass: TaskClass,
  strategy: BenchmarkStrategy,
  profiles: StrategyProfiles = DEFAULT_STRATEGY_PROFILES,
  seed = 1,
) {
  const profile = profiles[strategy];
  const factor = CLASS_FACTOR[taskClass];
  const jitter = 1 + ((seed * 7 + task.id.charCodeAt(1)) % 10) / 100; // ±10%
  const tokens = Math.round(profile.baseTokens * factor * jitter);
  const durationMs = Math.round(profile.baseDurationMs * factor * jitter);
  const contextSize = Math.round(tokens * 2.2);
  // Custo USD = tokens/1000 * preço por 1K (0.003 ≈ GPT-4o-mini).
  const cost = Math.round((tokens / 1000) * 0.003 * 10000) / 10000;
  // Agente único falha/retrabalha mais em tarefas medium/large (cross-file,
  // schema, API) — é aí que Graph/Multi-Agent provam valor (spec §P11-06).
  const reworkBase = taskClass === "large" ? 0.45 : taskClass === "medium" ? 0.3 : 0.15;
  const failureBase = taskClass === "large" ? 0.5 : taskClass === "medium" ? 0.35 : 0.1;
  const reworkRate = Math.max(0, reworkBase - profile.reworkReduction);
  const failureRate = Math.max(0.02, failureBase - profile.failureReduction);
  const qualityScore = Math.min(
    10,
    Math.round((5.5 + profile.qualityBoost + factor * 0.5) * 10) / 10,
  );

  const metrics: BenchmarkMetrics = {
    // Sucesso: falha < 30% (tolerância realista de execução).
    success: failureRate < 0.3,
    testPassRate: Math.round(Math.max(0.5, 1 - reworkRate - failureRate / 2) * 100) / 100,
    reworkRate: Math.round(reworkRate * 100) / 100,
    tokens,
    cost,
    durationMs,
    toolCalls: Math.round(profile.agentCount * 4 * factor),
    agentCount: profile.agentCount,
    parallelism: profile.parallelism,
    planningTimeMs: Math.round(durationMs * 0.15),
    executionTimeMs: Math.round(durationMs * 0.6),
    validationTimeMs: Math.round(durationMs * 0.25),
    failureRate: Math.round(failureRate * 100) / 100,
    retryCount: failureRate > 0.2 ? 1 : 0,
    contextSize,
    qualityScore,
  };
  return { taskId: task.id, taskClass, strategy, metrics };
}

/** Roda o dataset completo nas 3 estratégias e gera o relatório. */
export function runBenchmark(
  tasks: BenchmarkTask[],
  profiles: StrategyProfiles = DEFAULT_STRATEGY_PROFILES,
): BenchmarkReport {
  const runs = tasks.flatMap((task) => {
    const taskClass =
      task.signals.touchesSchema || task.signals.touchesSecurity
        ? "large"
        : task.signals.touchesApi || task.signals.dependencyCount >= 5
          ? "medium"
          : task.signals.affectedFiles.length >= 2
            ? "small"
            : "tiny";
    return (Object.keys(profiles) as BenchmarkStrategy[]).map((strategy) =>
      simulateRun(task, taskClass, strategy, profiles, 1),
    );
  });
  const summaries = compareStrategies(runs);
  return {
    runs,
    summaries,
    graphWinsOn: [...new Set(summaries.filter((s) => s.graphBeneficial).map((s) => s.taskClass))],
    multiAgentWinsOn: [
      ...new Set(summaries.filter((s) => s.multiAgentBeneficial).map((s) => s.taskClass)),
    ],
  };
}

// Perfis, métricas e comparador — extraídos (rule-41).
export {
  CLASS_FACTOR,
  DEFAULT_STRATEGY_PROFILES,
  type BenchmarkStrategy,
  type StrategyProfiles,
} from "./profiles";
export { efficiencyScore, type BenchmarkMetrics, type BenchmarkRun } from "./scoring";
export { compareStrategies, type BenchmarkSummary, type BenchmarkReport } from "./compare";
