/**
 * compare.ts — Benchmark comparison e relatório (P11-06).
 *
 * Determina a melhor estratégia por eficiência composta por task e as
 * classes onde Graph/Multi-Agent são vantajosos. Extraído de runner.ts
 * (rule-41 — hard limit de 150 linhas por arquivo).
 */

import type { TaskClass } from "@/ai/orchestration/classifier";
import { efficiencyScore, type BenchmarkRun } from "./scoring";
import type { BenchmarkStrategy } from "./profiles";

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
