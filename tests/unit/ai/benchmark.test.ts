/**
 * benchmark.test.ts — P11-06 Benchmark Framework.
 *
 * Cobre: dataset T1-T8, simulação determinística das estratégias A/B/C,
 * eficiência composta (quality / (cost+latency+context+rework)) e relatório
 * com as classes onde Graph/Multi-Agent são vantajosos.
 */

import { describe, expect, it } from "vitest";
import { BENCHMARK_DATASET } from "@/ai/benchmark/dataset";
import {
  simulateRun,
  runBenchmark,
  efficiencyScore,
  compareStrategies,
} from "@/ai/benchmark/runner";

describe("dataset (P11-06)", () => {
  it("contém T1-T8 nas 8 categorias", () => {
    expect(BENCHMARK_DATASET.map((t) => t.id)).toEqual([
      "T1",
      "T2",
      "T3",
      "T4",
      "T5",
      "T6",
      "T7",
      "T8",
    ]);
    const categories = new Set(BENCHMARK_DATASET.map((t) => t.category));
    expect(categories.has("schema")).toBe(true);
    expect(categories.has("architectural")).toBe(true);
    expect(categories.has("regression")).toBe(true);
  });

  it("cada task declara sinais completos para o classifier", () => {
    for (const t of BENCHMARK_DATASET) {
      expect(t.signals.affectedFiles.length).toBeGreaterThan(0);
      expect(["low", "medium", "high"]).toContain(t.signals.risk);
    }
  });
});

describe("simulação determinística (P11-06)", () => {
  it("mesma task+estratégia+seed → mesmo resultado", () => {
    const a = simulateRun(BENCHMARK_DATASET[0], "tiny", "A-single-agent");
    const b = simulateRun(BENCHMARK_DATASET[0], "tiny", "A-single-agent");
    expect(a).toEqual(b);
  });

  it("C (graph) tem mais agentes, mais tokens, melhor qualidade e menos rework", () => {
    const task = BENCHMARK_DATASET[6]; // T7 regression, large
    const a = simulateRun(task, "large", "A-single-agent");
    const c = simulateRun(task, "large", "C-graph-multi-agent");
    expect(c.metrics.agentCount).toBeGreaterThan(a.metrics.agentCount);
    expect(c.metrics.qualityScore).toBeGreaterThan(a.metrics.qualityScore);
    expect(c.metrics.reworkRate).toBeLessThan(a.metrics.reworkRate);
    expect(c.metrics.tokens).toBeGreaterThan(a.metrics.tokens);
  });

  it("todas as métricas da spec presentes e válidas", () => {
    const run = simulateRun(BENCHMARK_DATASET[2], "medium", "B-multi-agent");
    const m = run.metrics;
    expect(typeof m.success).toBe("boolean");
    expect(m.testPassRate).toBeGreaterThanOrEqual(0);
    expect(m.testPassRate).toBeLessThanOrEqual(1);
    expect(m.qualityScore).toBeGreaterThan(0);
    expect(m.qualityScore).toBeLessThanOrEqual(10);
    expect(m.durationMs).toBeGreaterThan(0);
    expect(m.cost).toBeGreaterThan(0);
  });
});

describe("eficiência composta (P11-06)", () => {
  it("melhor qualidade + menor custo → maior score", () => {
    const good = {
      qualityScore: 9,
      cost: 0.01,
      durationMs: 1000,
      contextSize: 500,
      reworkRate: 0.05,
    };
    const bad = {
      qualityScore: 6,
      cost: 0.5,
      durationMs: 60_000,
      contextSize: 50_000,
      reworkRate: 0.8,
    };
    expect(efficiencyScore(good as never)).toBeGreaterThan(efficiencyScore(bad as never));
  });

  it("nunca divide por zero", () => {
    expect(
      efficiencyScore({
        qualityScore: 8,
        cost: 0,
        durationMs: 0,
        contextSize: 0,
        reworkRate: 0,
      } as never),
    ).toBeGreaterThan(0);
  });
});

describe("relatório de benchmark (P11-06)", () => {
  it("compara as 3 estratégias por task e escolhe a melhor", () => {
    const report = runBenchmark(BENCHMARK_DATASET.slice(0, 3));
    expect(report.runs).toHaveLength(9); // 3 tasks × 3 estratégias
    expect(report.summaries).toHaveLength(3);
    for (const s of report.summaries) {
      expect(["A-single-agent", "B-multi-agent", "C-graph-multi-agent"]).toContain(s.best);
      expect(s.taskId).toMatch(/^T[1-3]$/);
    }
  });

  it("determina classes onde Graph/Multi-Agent vencem", () => {
    const report = runBenchmark(BENCHMARK_DATASET);
    expect(report.summaries).toHaveLength(8);
    // Estratégias mais ricas vencem em classes complexas (large/medium).
    expect(report.graphWinsOn.length).toBeGreaterThan(0);
    expect(report.multiAgentWinsOn.length).toBeGreaterThan(0);
  });

  it("compareStrategies agrupa por task e ordena por id", () => {
    const runs = BENCHMARK_DATASET.flatMap((t) => {
      const cls = t.signals.touchesSchema ? "large" : "medium";
      return (["A-single-agent", "B-multi-agent", "C-graph-multi-agent"] as const).map((s) =>
        simulateRun(t, cls, s),
      );
    });
    const summaries = compareStrategies(runs);
    expect(summaries.map((s) => s.taskId)).toEqual(
      [...summaries].sort((a, b) => a.taskId.localeCompare(b.taskId)).map((s) => s.taskId),
    );
  });
});
