/**
 * ai-engineering.test.ts — P11-08 AI Engineering Command Center (módulo puro).
 *
 * Cobre: visão executiva (tasks, success, cost, tokens, rework, Graph ROI),
 * workflow efficiency por fase, agent performance, model performance,
 * bottlenecks e Neo4j readiness UI.
 */

import { describe, expect, it } from "vitest";
import {
  computeExecutiveMetrics,
  computePhaseEfficiency,
  computeAgentPerformance,
  computeModelPerformance,
  computeBottlenecks,
  computeGraphRoi,
  computeReadinessUi,
  buildAiEngineeringDashboard,
} from "@/lib/aiEngineering";
import { createTelemetryEnvelope, type TelemetryEnvelope } from "@/ai/telemetry/envelope";

function sampleEnvelopes(): TelemetryEnvelope[] {
  const base = { taskId: "T1", runId: "R1", model: "pi-local", agentAdapter: "pi" };
  return [
    createTelemetryEnvelope("agent.dispatched", { ...base, agentRole: "graph-scout" }),
    createTelemetryEnvelope("agent.completed", {
      ...base,
      agentRole: "graph-scout",
      durationMs: 100,
      inputTokens: 500,
      outputTokens: 100,
      cost: 0.002,
      tokensSaved: 300,
    }),
    createTelemetryEnvelope("graph.query.started", { ...base }),
    createTelemetryEnvelope("graph.query.completed", {
      ...base,
      durationMs: 20,
      cacheHit: true,
    } as never),
    createTelemetryEnvelope("agent.completed", {
      ...base,
      agentRole: "implementer",
      durationMs: 500,
      inputTokens: 2000,
      outputTokens: 800,
      cost: 0.008,
      attempts: 1,
    } as never),
    createTelemetryEnvelope("agent.failed", {
      ...base,
      agentRole: "tester",
      durationMs: 300,
      inputTokens: 1000,
      outputTokens: 200,
      cost: 0.004,
      errorCode: "exit:1",
    }),
    createTelemetryEnvelope("execution.completed", { ...base }),
  ];
}

describe("computeExecutiveMetrics (P11-08)", () => {
  it("agrega tasks, success rate, tokens, custo, rework e Graph ROI", () => {
    const m = computeExecutiveMetrics(sampleEnvelopes());
    expect(m.tasks).toBeGreaterThan(0);
    expect(m.successRate).toBeGreaterThan(0);
    expect(m.successRate).toBeLessThanOrEqual(1);
    expect(m.tokens).toBeGreaterThan(0);
    expect(m.cost).toBeGreaterThan(0);
    expect(m.reworkCount).toBeGreaterThanOrEqual(0);
    expect(m.tokensSaved).toBe(300);
    expect(m.graphRoiPct).toBeGreaterThanOrEqual(0);
    expect(m.avgLatencyMs).toBeGreaterThan(0);
  });

  it("sem envelopes → zeros (fail-open)", () => {
    const m = computeExecutiveMetrics([]);
    expect(m.tasks).toBe(0);
    expect(m.successRate).toBe(0);
    expect(m.cost).toBe(0);
    expect(m.avgLatencyMs).toBe(0);
  });
});

describe("computePhaseEfficiency (P11-08)", () => {
  it("distribui tempo por fase em %", () => {
    const phases = computePhaseEfficiency(sampleEnvelopes());
    expect(phases.length).toBeGreaterThan(0);
    const totalPct = phases.reduce((a, p) => a + p.pct, 0);
    expect(totalPct).toBeCloseTo(100, 0);
    // discovery (graph-scout) deve aparecer
    expect(phases.some((p) => p.phase === "discovery")).toBe(true);
  });
});

describe("computeAgentPerformance (P11-08)", () => {
  it("agrega por role com success/latency/tokens/cost/rework", () => {
    const rows = computeAgentPerformance(sampleEnvelopes());
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.role.length).toBeGreaterThan(0);
      expect(row.executions).toBeGreaterThan(0);
      expect(row.successRate).toBeGreaterThanOrEqual(0);
      expect(row.successRate).toBeLessThanOrEqual(1);
    }
    const tester = rows.find((r) => r.role === "tester");
    expect(tester?.rework).toBe(1); // 1 falha
  });
});

describe("computeModelPerformance (P11-08)", () => {
  it("agrega Model × Role", () => {
    const rows = computeModelPerformance(sampleEnvelopes());
    expect(rows.length).toBeGreaterThan(0);
    const row = rows[0];
    expect(row.model).toBe("pi-local");
    expect(row.executions).toBeGreaterThan(0);
  });
});

describe("computeBottlenecks (P11-08)", () => {
  it("detecta gargalos (failures do tester)", () => {
    const bottlenecks = computeBottlenecks(sampleEnvelopes());
    const failures = bottlenecks.find((b) => b.type === "failures");
    expect(failures?.role).toBe("tester");
  });
});

describe("computeGraphRoi (P11-08)", () => {
  it("conta queries, cache hits e reuso", () => {
    const roi = computeGraphRoi(sampleEnvelopes());
    expect(roi.graphQueries).toBe(2);
    expect(roi.cacheHitRate).toBe(1); // 1 hit de 1 completed
    expect(roi.tokensSaved).toBe(300);
  });
});

describe("computeReadinessUi (P11-08)", () => {
  it("score, banda, drivers e recomendação", () => {
    const ui = computeReadinessUi({
      nodes: 2330,
      edges: 26469,
      multiHopRatio: 0.7,
      queryP95Ms: 400,
      concurrency: 8,
      scannedNodes: 300,
      growthPct: 5,
    });
    expect(ui.score).toBeGreaterThan(50);
    expect(ui.drivers.length).toBeGreaterThan(0);
    expect(ui.recommendation.length).toBeGreaterThan(0);
    expect(["local", "monitor", "prepare-poc", "migration-justified"]).toContain(ui.band);
  });
});

describe("buildAiEngineeringDashboard (P11-08)", () => {
  it("monta todas as visões", () => {
    const d = buildAiEngineeringDashboard(sampleEnvelopes(), {
      nodes: 2330,
      edges: 26469,
    });
    expect(d.executive.tasks).toBeGreaterThan(0);
    expect(Array.isArray(d.phases)).toBe(true);
    expect(Array.isArray(d.agents)).toBe(true);
    expect(Array.isArray(d.models)).toBe(true);
    expect(Array.isArray(d.bottlenecks)).toBe(true);
    expect(d.graphRoi.graphQueries).toBe(2);
    expect(d.readiness.score).toBeGreaterThan(0);
  });
});
