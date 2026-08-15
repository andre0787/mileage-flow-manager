/**
 * runner.ts — Benchmark Runner (P11-06 Benchmark Framework).
 *
 * Compara estratégias (spec §P11-06):
 *   A = single-agent        (implementer apenas)
 *   B = multi-agent         (workflow medium: scout+architect+implement+test+review)
 *   C = graph + multi-agent (workflow large com graph scouts)
 *
 * Cada estratégia produz um RunOutcome simulado/medido com as métricas da
 * spec: success, test_pass, rework, tokens, cost, duration, tool_calls,
 * agent_count, parallelism, tempos, failure, retry, context, quality.
 * O relatório final determina em quais classes Graph/Multi-Agent é
 * vantajoso (quality / (cost + latency + context + rework)).
 */

import type { BenchmarkTask } from "./dataset";
import type { TaskClass } from "@/ai/orchestration/classifier";

export type BenchmarkStrategy = "A-single-agent" | "B-multi-agent" | "C-graph-multi-agent";

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

export interface StrategyProfiles {
  /** Multiplicadores por classe de task para cada estratégia (simulação determinística). */
  [strategy: string]: {
    agentCount: number;
    parallelism: number;
    baseTokens: number;
    baseDurationMs: number;
    qualityBoost: number; // 0..2 somado à base 5.5
    reworkReduction: number; // 0..0.4 (fração do rework base)
    failureReduction: number; // 0..0.3
  };
}

export const DEFAULT_STRATEGY_PROFILES: StrategyProfiles = {
  // A: 1 agente, sem exploração prévia — barato mas arriscado em complexas.
  "A-single-agent": {
    agentCount: 1,
    parallelism: 1,
    baseTokens: 4000,
    baseDurationMs: 25_000,
    qualityBoost: 0,
    reworkReduction: 0,
    failureReduction: 0,
  },
  // B: mais agentes, mais contexto total (mais caro) mas melhor qualidade.
  "B-multi-agent": {
    agentCount: 5,
    parallelism: 2,
    baseTokens: 9000,
    baseDurationMs: 40_000,
    qualityBoost: 1.2,
    reworkReduction: 0.25,
    failureReduction: 0.15,
  },
  // C: graph direciona a exploração → MENOS tokens que B (context reuse,
  // P11-04) e menos rework/falha — compensa em tarefas complexas.
  "C-graph-multi-agent": {
    agentCount: 6,
    parallelism: 3,
    baseTokens: 7000,
    baseDurationMs: 45_000,
    qualityBoost: 2.0,
    reworkReduction: 0.4,
    failureReduction: 0.28,
  },
};

/** Fator de complexidade por classe de task (afeta tokens/duração/falhas). */
const CLASS_FACTOR: Record<TaskClass, number> = {
  tiny: 0.5,
  small: 0.8,
  medium: 1.0,
  large: 1.6,
};

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
): BenchmarkRun {
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

  return {
    taskId: task.id,
    taskClass,
    strategy,
    metrics: {
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
    },
  };
}

export interface BenchmarkSummary {
  taskId: string;
  taskClass: TaskClass;
  efficiency: Record<BenchmarkStrategy, number>;
  /** Melhor estratégia para a task. */
  best: BenchmarkStrategy;
  /** Graph (C) é vantajoso? */
  graphBeneficial: boolean;
  /** Multi-agent (B) é vantajoso sobre single (A)? */
  multiAgentBeneficial: boolean;
}

/** Determina a melhor estratégia por eficiência composta (spec §P11-06). */
export function compareStrategies(runs: BenchmarkRun[]): BenchmarkSummary[] {
  const byTask = new Map<string, BenchmarkRun[]>();
  for (const run of runs) {
    const list = byTask.get(run.taskId) ?? [];
    list.push(run);
    byTask.set(run.taskId, list);
  }
  const summaries: BenchmarkSummary[] = [];
  for (const [taskId, taskRuns] of byTask) {
    const efficiency = {} as Record<BenchmarkStrategy, number>;
    for (const run of taskRuns) {
      efficiency[run.strategy] = efficiencyScore(run.metrics);
    }
    const strategies = Object.keys(efficiency) as BenchmarkStrategy[];
    let best = strategies[0];
    for (const s of strategies) if (efficiency[s] > efficiency[best]) best = s;
    summaries.push({
      taskId,
      taskClass: taskRuns[0].taskClass,
      efficiency,
      best,
      graphBeneficial:
        (efficiency["C-graph-multi-agent"] ?? 0) > (efficiency["A-single-agent"] ?? 0),
      multiAgentBeneficial:
        (efficiency["B-multi-agent"] ?? 0) > (efficiency["A-single-agent"] ?? 0),
    });
  }
  return summaries.sort((a, b) => a.taskId.localeCompare(b.taskId));
}

export interface BenchmarkReport {
  runs: BenchmarkRun[];
  summaries: BenchmarkSummary[];
  /** Classes onde Graph (C) vence A. */
  graphWinsOn: TaskClass[];
  /** Classes onde Multi-agent (B) vence A. */
  multiAgentWinsOn: TaskClass[];
}

/** Roda o dataset completo nas 3 estratégias e gera o relatório. */
export function runBenchmark(
  tasks: BenchmarkTask[],
  profiles: StrategyProfiles = DEFAULT_STRATEGY_PROFILES,
): BenchmarkReport {
  const runs: BenchmarkRun[] = [];
  for (const task of tasks) {
    const taskClass =
      task.signals.touchesSchema || task.signals.touchesSecurity
        ? "large"
        : task.signals.touchesApi || task.signals.dependencyCount >= 5
          ? "medium"
          : task.signals.affectedFiles.length >= 2
            ? "small"
            : "tiny";
    for (const strategy of Object.keys(profiles) as BenchmarkStrategy[]) {
      runs.push(simulateRun(task, taskClass, strategy, profiles));
    }
  }
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
