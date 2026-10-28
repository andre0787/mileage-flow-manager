/**
 * aiEngineeringExecutive.test.ts — Unit tests for AI Engineering Executive Metrics (P11-08).
 *
 * Tests `computeExecutiveMetrics` in `src/lib/ai-engineering/executive.ts`.
 */

import { describe, expect, it } from "vitest";
import { computeExecutiveMetrics } from "@/lib/ai-engineering/executive";
import { createTelemetryEnvelope, type TelemetryEnvelope } from "@/ai/telemetry/envelope";

describe("computeExecutiveMetrics (src/lib/ai-engineering/executive.ts)", () => {
  it("returns zeroed metrics when envelopes list is empty (fail-open)", () => {
    const metrics = computeExecutiveMetrics([]);

    expect(metrics).toEqual({
      tasks: 0,
      successRate: 0,
      cost: 0,
      tokens: 0,
      tokensSaved: 0,
      reworkCount: 0,
      avgLatencyMs: 0,
      graphRoiPct: 0,
      agentEfficiency: 0,
      totalDurationMs: 0,
    });
  });

  it("calculates tasks count by deduplicating runId and taskId combinations", () => {
    const base = { model: "pi-local", agentAdapter: "pi" };
    const envelopes: TelemetryEnvelope[] = [
      createTelemetryEnvelope("agent.completed", { ...base, runId: "R1", taskId: "T1" }),
      createTelemetryEnvelope("agent.completed", { ...base, runId: "R1", taskId: "T1" }), // duplicate runId:taskId
      createTelemetryEnvelope("agent.completed", { ...base, runId: "R1", taskId: "T2" }), // same runId, different taskId
      createTelemetryEnvelope("agent.completed", { ...base, runId: "R2", taskId: "T1" }), // different runId, same taskId name
      createTelemetryEnvelope("agent.completed", { ...base, taskId: "T3" }), // no runId (runId undefined)
      createTelemetryEnvelope("agent.completed", { ...base, runId: "R3" }), // no taskId -> excluded from tasks count
    ];

    const metrics = computeExecutiveMetrics(envelopes);
    // Unique combinations: "R1:T1", "R1:T2", "R2:T1", ":T3" => 4
    expect(metrics.tasks).toBe(4);
  });

  it("calculates successRate accurately and rounds to 3 decimal places", () => {
    const base = { runId: "R1", taskId: "T1", model: "pi-local", agentAdapter: "pi" };
    // 2 completed, 1 failed => completed / total = 2 / 3 = 0.666666... => 0.667
    const envelopes: TelemetryEnvelope[] = [
      createTelemetryEnvelope("agent.completed", base),
      createTelemetryEnvelope("agent.completed", base),
      createTelemetryEnvelope("agent.failed", base),
      createTelemetryEnvelope("agent.dispatched", base), // non-agent event ignored for successRate
    ];

    const metrics = computeExecutiveMetrics(envelopes);
    expect(metrics.successRate).toBe(0.667);
  });

  it("aggregates tokens, tokensSaved, explicit cost, and fallback estimated cost", () => {
    const base = { runId: "R1", taskId: "T1", model: "pi-local", agentAdapter: "pi" };
    const envelopes: TelemetryEnvelope[] = [
      createTelemetryEnvelope("agent.completed", {
        ...base,
        inputTokens: 1000,
        outputTokens: 500,
        cost: 0.005,
        tokensSaved: 200,
      }),
      createTelemetryEnvelope("agent.failed", {
        ...base,
        inputTokens: 500,
        outputTokens: 500, // 1000 total tokens -> estimated cost = (1000 / 1000) * 0.003 = 0.003
        tokensSaved: 100,
      }),
      createTelemetryEnvelope("graph.query.completed", {
        ...base,
        tokensSaved: 150, // tokensSaved from non-agent event
      } as never),
    ];

    const metrics = computeExecutiveMetrics(envelopes);
    // agent tokens = (1000 + 500) + (500 + 500) = 2500
    expect(metrics.tokens).toBe(2500);
    // tokensSaved = 200 + 100 + 150 = 450
    expect(metrics.tokensSaved).toBe(450);
    // total cost = 0.005 (explicit) + 0.003 (estimated from 1000 tokens) = 0.008
    expect(metrics.cost).toBe(0.008);
  });

  it("calculates reworkCount correctly based on failed agent events and retried attempts", () => {
    const base = { runId: "R1", taskId: "T1", model: "pi-local", agentAdapter: "pi" };
    const envelopes: TelemetryEnvelope[] = [
      createTelemetryEnvelope("agent.completed", { ...base, attempts: 1 }), // no retry
      createTelemetryEnvelope("agent.completed", { ...base, attempts: 2 } as never), // retry 1 (attempts > 1)
      createTelemetryEnvelope("agent.completed", { ...base, attempts: 3 } as never), // retry 2 (attempts > 1)
      createTelemetryEnvelope("agent.failed", { ...base, attempts: 1 }), // failed
    ];

    const metrics = computeExecutiveMetrics(envelopes);
    // reworkCount in executive metrics returns `retried` (envelopes with attempts > 1)
    expect(metrics.reworkCount).toBe(2);
  });

  it("calculates Graph ROI percentage and rounds to 1 decimal place", () => {
    const base = { runId: "R1", taskId: "T1", model: "pi-local", agentAdapter: "pi" };
    // Graph ROI % = Math.round((tokensSaved / tokens) * 1000) / 10
    const envelopes: TelemetryEnvelope[] = [
      createTelemetryEnvelope("agent.completed", {
        ...base,
        inputTokens: 1000,
        outputTokens: 0,
        tokensSaved: 250, // 250 / 1000 = 25%
      }),
    ];

    const metrics = computeExecutiveMetrics(envelopes);
    expect(metrics.graphRoiPct).toBe(25);
  });

  it("returns 0 graphRoiPct when tokens is 0", () => {
    const base = { runId: "R1", taskId: "T1", model: "pi-local", agentAdapter: "pi" };
    const envelopes: TelemetryEnvelope[] = [
      createTelemetryEnvelope("execution.completed", { ...base, tokensSaved: 100 }),
    ];

    const metrics = computeExecutiveMetrics(envelopes);
    expect(metrics.tokens).toBe(0);
    expect(metrics.graphRoiPct).toBe(0);
  });

  it("calculates agentEfficiency as successRate / cost and handles cost = 0", () => {
    const base = { runId: "R1", taskId: "T1", model: "pi-local", agentAdapter: "pi" };
    // 1 completed out of 1 -> successRate = 1.0. cost = 0.01 -> efficiency = 1.0 / 0.01 = 100
    const envelopesWithCost: TelemetryEnvelope[] = [
      createTelemetryEnvelope("agent.completed", { ...base, cost: 0.01 }),
    ];
    const metricsCost = computeExecutiveMetrics(envelopesWithCost);
    expect(metricsCost.agentEfficiency).toBe(100);

    // 0 cost -> efficiency = 0
    const envelopesZeroCost: TelemetryEnvelope[] = [
      createTelemetryEnvelope("agent.completed", { ...base, cost: 0, inputTokens: 0, outputTokens: 0 }),
    ];
    const metricsZeroCost = computeExecutiveMetrics(envelopesZeroCost);
    expect(metricsZeroCost.agentEfficiency).toBe(0);
  });

  it("calculates avgLatencyMs for agent events and totalDurationMs across all envelopes", () => {
    const base = { runId: "R1", taskId: "T1", model: "pi-local", agentAdapter: "pi" };
    const envelopes: TelemetryEnvelope[] = [
      createTelemetryEnvelope("agent.completed", { ...base, durationMs: 100 }),
      createTelemetryEnvelope("agent.completed", { ...base, durationMs: 200 }),
      createTelemetryEnvelope("agent.dispatched", { ...base, durationMs: 50 }), // non-agent event
    ];

    const metrics = computeExecutiveMetrics(envelopes);
    // avgLatencyMs = avg([100, 200]) = 150
    expect(metrics.avgLatencyMs).toBe(150);
    // totalDurationMs = 100 + 200 + 50 = 350
    expect(metrics.totalDurationMs).toBe(350);
  });
});
