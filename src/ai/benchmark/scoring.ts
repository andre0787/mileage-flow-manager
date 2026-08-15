/**
 * scoring.ts — Benchmark metrics e eficiência composta (P11-06).
 *
 * Métricas da spec (success, test_pass, rework, tokens, cost, duration,
 * tool_calls, agent_count, parallelism, tempos, failure, retry, context,
 * quality) e a eficiência final quality/(cost+latency+context+rework),
 * penalizada por falha. Extraído de runner.ts (rule-41 — hard limit de
 * 150 linhas por arquivo).
 */

import type { TaskClass } from "@/ai/orchestration/classifier";
import type { BenchmarkStrategy } from "./profiles";

export interface BenchmarkMetrics {
  success: boolean;
  testPassRate: number; // 0..1
  reworkRate: number; // 0..1
  tokens: number;
  cost: number;
  durationMs: number;
  toolCalls: number;
  agentCount: number;
  parallelism: number;
  planningTimeMs: number;
  executionTimeMs: number;
  validationTimeMs: number;
  failureRate: number; // 0..1
  retryCount: number;
  contextSize: number;
  qualityScore: number; // 0..10
}

export interface BenchmarkRun {
  taskId: string;
  taskClass: TaskClass;
  strategy: BenchmarkStrategy;
  metrics: BenchmarkMetrics;
}

/**
 * Eficiência composta: quality / (cost + latency + context + rework),
 * penalizada por falhas (success=false e testPassRate baixo) — spec §P11-06:
 * a métrica final é quality/(cost+latency+context+rework) e uma execução
 * que falha não pode competir com uma que entregou.
 */
export function efficiencyScore(metrics: BenchmarkMetrics): number {
  const cost = Math.max(0.001, metrics.cost);
  const latency = Math.max(1, metrics.durationMs / 1000);
  const context = Math.max(1, metrics.contextSize / 1000);
  const rework = Math.max(0.001, metrics.reworkRate);
  // Estratégia que falha não entrega valor → eficiência 0 (não compete).
  const successFactor = metrics.success === false ? 0 : 1;
  const passRate = metrics.testPassRate === undefined ? 1 : metrics.testPassRate;
  const raw = metrics.qualityScore / (cost * latency * (1 + context) * (1 + rework));
  return Math.round(raw * successFactor * passRate * 100) / 100;
}
