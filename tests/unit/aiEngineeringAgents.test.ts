/**
 * aiEngineeringAgents.test.ts — Unit tests for AI Engineering Agents Performance.
 *
 * Covers src/lib/ai-engineering/agents.ts:
 * - computeAgentPerformance
 * - computeModelPerformance
 */

import { describe, expect, it } from "vitest";
import {
  computeAgentPerformance,
  computeModelPerformance,
  type AgentPerformanceRow,
  type ModelPerformanceRow,
} from "@/lib/ai-engineering/agents";
import { createTelemetryEnvelope, type TelemetryEnvelope } from "@/ai/telemetry/envelope";

describe("computeAgentPerformance (src/lib/ai-engineering/agents.ts)", () => {
  it("returns empty array when input envelopes list is empty", () => {
    expect(computeAgentPerformance([])).toEqual([]);
  });

  it("filters out non-agent events and envelopes without agentRole", () => {
    const base = { taskId: "T1", runId: "R1", model: "gpt-4" };
    const envelopes: TelemetryEnvelope[] = [
      createTelemetryEnvelope("execution.completed", base),
      createTelemetryEnvelope("graph.query.started", base),
      createTelemetryEnvelope("agent.completed", base), // agentRole missing
    ];

    expect(computeAgentPerformance(envelopes)).toEqual([]);
  });

  it("aggregates performance metrics per agent role correctly", () => {
    const base = { taskId: "T1", runId: "R1", model: "gpt-4" };
    const envelopes: TelemetryEnvelope[] = [
      // Role: coder - 2 events (1 completed, 1 failed with retries)
      createTelemetryEnvelope("agent.completed", {
        ...base,
        agentRole: "coder",
        durationMs: 200,
        inputTokens: 1000,
        outputTokens: 500,
        cost: 0.005,
      }),
      {
        ...createTelemetryEnvelope("agent.failed", {
          ...base,
          agentRole: "coder",
          durationMs: 400,
          inputTokens: 1500,
          outputTokens: 300,
          cost: 0.006,
        }),
        attempts: 2,
      } as TelemetryEnvelope,

      // Role: reviewer - 1 completed event
      createTelemetryEnvelope("agent.completed", {
        ...base,
        agentRole: "reviewer",
        durationMs: 100,
        inputTokens: 300,
        outputTokens: 100,
        cost: 0.001,
      }),
    ];

    const result = computeAgentPerformance(envelopes);

    expect(result).toHaveLength(2);

    const coderRow = result.find((r) => r.role === "coder");
    expect(coderRow).toEqual<AgentPerformanceRow>({
      role: "coder",
      executions: 2,
      successRate: 0.5, // 1 completed out of 2
      avgLatencyMs: 300, // (200 + 400) / 2
      tokens: 3300, // (1000+500) + (1500+300)
      cost: 0.011, // 0.005 + 0.006
      rework: 1, // 2 - 1 completed
      retries: 1, // 1 event with attempts > 1
    });

    const reviewerRow = result.find((r) => r.role === "reviewer");
    expect(reviewerRow).toEqual<AgentPerformanceRow>({
      role: "reviewer",
      executions: 1,
      successRate: 1,
      avgLatencyMs: 100,
      tokens: 400,
      cost: 0.001,
      rework: 0,
      retries: 0,
    });
  });

  it("sorts result rows descending by cost", () => {
    const base = { taskId: "T1", runId: "R1", model: "gpt-4" };
    const envelopes: TelemetryEnvelope[] = [
      createTelemetryEnvelope("agent.completed", { ...base, agentRole: "cheap-agent", cost: 0.001 }),
      createTelemetryEnvelope("agent.completed", { ...base, agentRole: "expensive-agent", cost: 0.05 }),
      createTelemetryEnvelope("agent.completed", { ...base, agentRole: "mid-agent", cost: 0.01 }),
    ];

    const result = computeAgentPerformance(envelopes);

    expect(result.map((r) => r.role)).toEqual(["expensive-agent", "mid-agent", "cheap-agent"]);
  });

  it("handles missing or undefined optional numerical fields gracefully", () => {
    const base = { taskId: "T1", runId: "R1", model: "gpt-4" };
    const envelopes: TelemetryEnvelope[] = [
      createTelemetryEnvelope("agent.completed", {
        ...base,
        agentRole: "fallback-agent",
        // durationMs, inputTokens, outputTokens, cost missing
      }),
    ];

    const result = computeAgentPerformance(envelopes);

    expect(result).toEqual<AgentPerformanceRow[]>([
      {
        role: "fallback-agent",
        executions: 1,
        successRate: 1,
        avgLatencyMs: 0,
        tokens: 0,
        cost: 0,
        rework: 0,
        retries: 0,
      },
    ]);
  });
});

describe("computeModelPerformance (src/lib/ai-engineering/agents.ts)", () => {
  it("returns empty array when input envelopes list is empty", () => {
    expect(computeModelPerformance([])).toEqual([]);
  });

  it("filters out non-agent events and envelopes without model property", () => {
    const base = { taskId: "T1", runId: "R1" };
    const envelopes: TelemetryEnvelope[] = [
      createTelemetryEnvelope("execution.completed", { ...base, model: "gpt-4" }),
      createTelemetryEnvelope("agent.completed", base), // model missing
    ];

    expect(computeModelPerformance(envelopes)).toEqual([]);
  });

  it("groups by model and role, defaulting missing agentRole to 'unknown'", () => {
    const base = { taskId: "T1", runId: "R1", model: "gpt-4" };
    const envelopes: TelemetryEnvelope[] = [
      createTelemetryEnvelope("agent.completed", {
        ...base,
        agentRole: "scout",
        durationMs: 150,
        inputTokens: 800,
        outputTokens: 200,
        cost: 0.003,
      }),
      createTelemetryEnvelope("agent.completed", {
        ...base, // agentRole missing
        durationMs: 100,
        inputTokens: 400,
        outputTokens: 100,
        cost: 0.001,
      }),
    ];

    const result = computeModelPerformance(envelopes);

    expect(result).toHaveLength(2);
    const unknownRow = result.find((r) => r.role === "unknown");
    expect(unknownRow).toEqual<ModelPerformanceRow>({
      model: "gpt-4",
      role: "unknown",
      executions: 1,
      successRate: 1,
      avgLatencyMs: 100,
      tokens: 500,
      cost: 0.001,
      failures: 0,
    });
  });

  it("aggregates performance and counts failures correctly", () => {
    const envelopes: TelemetryEnvelope[] = [
      createTelemetryEnvelope("agent.completed", {
        taskId: "T1",
        runId: "R1",
        model: "claude-3-5-sonnet",
        agentRole: "tester",
        durationMs: 500,
        inputTokens: 2000,
        outputTokens: 500,
        cost: 0.01,
      }),
      createTelemetryEnvelope("agent.failed", {
        taskId: "T2",
        runId: "R2",
        model: "claude-3-5-sonnet",
        agentRole: "tester",
        durationMs: 300,
        inputTokens: 1000,
        outputTokens: 100,
        cost: 0.005,
      }),
    ];

    const result = computeModelPerformance(envelopes);

    expect(result).toEqual<ModelPerformanceRow[]>([
      {
        model: "claude-3-5-sonnet",
        role: "tester",
        executions: 2,
        successRate: 0.5,
        avgLatencyMs: 400,
        tokens: 3600,
        cost: 0.015,
        failures: 1,
      },
    ]);
  });

  it("sorts result rows descending by total tokens", () => {
    const envelopes: TelemetryEnvelope[] = [
      createTelemetryEnvelope("agent.completed", {
        taskId: "T1",
        runId: "R1",
        model: "model-low",
        agentRole: "coder",
        inputTokens: 100,
        outputTokens: 100,
      }),
      createTelemetryEnvelope("agent.completed", {
        taskId: "T2",
        runId: "R2",
        model: "model-high",
        agentRole: "coder",
        inputTokens: 5000,
        outputTokens: 1000,
      }),
    ];

    const result = computeModelPerformance(envelopes);

    expect(result.map((r) => r.model)).toEqual(["model-high", "model-low"]);
  });
});
