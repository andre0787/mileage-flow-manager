/**
 * runner.ts — P12-02/03/04 Strategy Runner (orquestração).
 *
 * Executa cada task real nas estratégias single / multi / graph+multi,
 * mantendo fixos task, modelo, estado do repositório e critérios de aceite
 * (spec §14 — variar apenas `strategy`). Registra métricas §11 e repeatability
 * (mean/median/variance, spec §16 — repeat >= 3 para tasks importantes).
 *
 * O modelo determinístico (executeValidationRun) vive em runner-model.ts
 * (rule-41 — hard limit de 150 linhas por arquivo).
 */

import { REAL_TASK_DATASET } from "./dataset";
import type { RealTask, RunMetrics, ValidationConfig, ValidationStrategy } from "./types";
import { executeValidationRun, type RepoState } from "./runner-model";
import { DEFAULT_VALIDATION_CONFIG } from "./runner-constants";

export { executeValidationRun } from "./runner-model";
export { DEFAULT_VALIDATION_CONFIG } from "./runner-constants";

export type { RepoState };

/** Repetição: repeat >= 3 para tasks medium+ (spec §16). */
function repeatsFor(task: RealTask, config: ValidationConfig): number {
  return task.class === "tiny" || task.class === "small" ? 1 : config.repeatImportant;
}

export interface StrategyResult {
  runs: RunMetrics[];
  meanDurationMs: number;
  medianDurationMs: number;
  varianceDurationMs: number;
  sampleCount: number;
}

/** Coleta mean/median/variance por task×estratégia com repetição. */
function aggregate(runs: RunMetrics[]): StrategyResult {
  const durations = runs.map((r) => r.durationMs).sort((a, b) => a - b);
  const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
  const mid = Math.floor(durations.length / 2);
  const median = durations.length % 2 ? durations[mid] : (durations[mid - 1] + durations[mid]) / 2;
  const variance = durations.reduce((a, b) => a + (b - mean) ** 2, 0) / durations.length;
  return {
    runs,
    meanDurationMs: Math.round(mean),
    medianDurationMs: Math.round(median),
    varianceDurationMs: Math.round(variance),
    sampleCount: runs.length,
  };
}

/** Roda o dataset completo nas 3 estratégias (P12-02/03/04). */
export function runValidationSuite(
  tasks: RealTask[] = REAL_TASK_DATASET,
  repo: RepoState,
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG,
  strategies: ValidationStrategy[] = ["single", "multi", "graph+multi"],
): { runs: RunMetrics[]; aggregated: StrategyResult[] } {
  const runs: RunMetrics[] = [];
  for (const task of tasks) {
    const repeats = repeatsFor(task, config);
    for (const strategy of strategies) {
      const singleRuns: RunMetrics[] = [];
      for (let i = 1; i <= repeats; i++) {
        singleRuns.push(executeValidationRun(task, strategy, repo, config, i));
      }
      const agg = aggregate(singleRuns);
      const enriched = agg.runs.map((r) => ({
        ...r,
        repeats,
        meanDurationMs: agg.meanDurationMs,
        medianDurationMs: agg.medianDurationMs,
        varianceDurationMs: agg.varianceDurationMs,
        sampleCount: agg.sampleCount,
        confidence: Math.min(1, agg.sampleCount / config.repeatImportant),
      }));
      runs.push(...enriched);
    }
  }
  return { runs, aggregated: [] }; // aggregated preenchido nas análises P12-05..08
}
