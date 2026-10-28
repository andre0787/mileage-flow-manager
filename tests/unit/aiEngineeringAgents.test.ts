/**
 * aiEngineeringAgents.test.ts — Unit tests for Agent and Model performance calculations (P11-08).
 *
 * Direct tests for computeModelPerformance and computeAgentPerformance functions in src/lib/ai-engineering/agents.ts.
 */

import { describe, expect, it } from "vitest";
import { computeAgentPerformance, computeModelPerformance } from "@/lib/ai-engineering/agents";
import { createTelemetryEnvelope, type TelemetryEnvelope } from "@/ai/telemetry/envelope";

describe("computeModelPerformance (src/lib/ai-engineering/agents.ts)", () => {
  it("returns an empty array when given no envelopes", () => {
    expect(computeModelPerformance([])).toEqual([]);
  });

  it("ignores non-agent events and envelopes without model identity", () => {
    const envelopes: TelemetryEnvelope[] = [
      createTelemetryEnvelope("agent.dispatched", { model: "gpt-4o", agentRole: "scout" }),
      createTelemetryEnvelope("graph.query.completed", { model: "gpt-4o", agentRole: "scout" }),
      createTelemetryEnvelope("agent.completed", { agentRole: "scout" }), // missing model
      createTelemetryEnvelope("agent.failed", { model: "", agentRole: "scout" }), // empty model
    ];

    expect(computeModelPerformance(envelopes)).toEqual([]);
  });

  it("groups performance by model and role correctly", () => {
    const envelopes: TelemetryEnvelope[] = [
      createTelemetryEnvelope("agent.completed", {
        model: "claude-3-5-sonnet",
        agentRole: "coder",
        durationMs: 1000,
        inputTokens: 500,
        outputTokens: 200,
        cost: 0.01,
      }),
      createTelemetryEnvelope("agent.failed", {
        model: "claude-3-5-sonnet",
        agentRole: "coder",
        durationMs: 500,
        inputTokens: 300,
        outputTokens: 100,
        cost: 0.005,
      }),
      createTelemetryEnvelope("agent.completed", {
        model: "gpt-4o",
        agentRole: "reviewer",
        durationMs: 800,
        inputTokens: 1000,
        outputTokens: 400,
        cost: 0.02,
      }),
    ];

    const results = computeModelPerformance(envelopes);
    expect(results).toHaveLength(2);

    const sonnetCoder = results.find((r) => r.model === "claude-3-5-sonnet" && r.role === "coder");
    expect(sonnetCoder).toBeDefined();
    expect(sonnetCoder?.executions).toBe(2);
    expect(sonnetCoder?.successRate).toBe(0.5);
    expect(sonnetCoder?.avgLatencyMs).toBe(750);
    expect(sonnetCoder?.tokens).toBe(1100);
    expect(sonnetCoder?.cost).toBe(0.015);
    expect(sonnetCoder?.failures).toBe(1);

    const gptReviewer = results.find((r) => r.model === "gpt-4o" && r.role === "reviewer");
    expect(gptReviewer).toBeDefined();
    expect(gptReviewer?.executions).toBe(1);
    expect(gptReviewer?.successRate).toBe(1);
    expect(gptReviewer?.failures).toBe(0);
  });

  it("handles missing agentRole by defaulting role to 'unknown'", () => {
    const envelopes: TelemetryEnvelope[] = [
      createTelemetryEnvelope("agent.completed", {
        model: "qwen-local",
        durationMs: 200,
        inputTokens: 100,
        outputTokens: 50,
        cost: 0.001,
      }),
    ];

    const results = computeModelPerformance(envelopes);
    expect(results).toHaveLength(1);
    expect(results[0].model).toBe("qwen-local");
    expect(results[0].role).toBe("unknown");
  });

  it("sorts performance rows by total tokens descending", () => {
    const envelopes: TelemetryEnvelope[] = [
      createTelemetryEnvelope("agent.completed", {
        model: "model-low-tokens",
        agentRole: "worker",
        inputTokens: 100,
        outputTokens: 50,
      }),
      createTelemetryEnvelope("agent.completed", {
        model: "model-high-tokens",
        agentRole: "worker",
        inputTokens: 5000,
        outputTokens: 2000,
      }),
    ];

    const results = computeModelPerformance(envelopes);
    expect(results[0].model).toBe("model-high-tokens");
    expect(results[1].model).toBe("model-low-tokens");
  });
});

describe("computeAgentPerformance (src/lib/ai-engineering/agents.ts)", () => {
  it("returns an empty array when given no envelopes", () => {
    expect(computeAgentPerformance([])).toEqual([]);
  });

  it("ignores non-agent events or envelopes without agentRole", () => {
    const envelopes: TelemetryEnvelope[] = [
      createTelemetryEnvelope("agent.dispatched", { agentRole: "tester" }),
      createTelemetryEnvelope("agent.completed", { agentRole: undefined }),
    ];

    expect(computeAgentPerformance(envelopes)).toEqual([]);
  });

  it("calculates successRate, retries, rework, latency, tokens, and cost correctly", () => {
    const envelopes: TelemetryEnvelope[] = [
      createTelemetryEnvelope("agent.completed", {
        agentRole: "architect",
        durationMs: 400,
        inputTokens: 1000,
        outputTokens: 500,
        cost: 0.03,
      }),
      {
        ...createTelemetryEnvelope("agent.completed", {
          agentRole: "architect",
          durationMs: 600,
          inputTokens: 800,
          outputTokens: 200,
          cost: 0.02,
        }),
        attempts: 2,
      } as TelemetryEnvelope,
      createTelemetryEnvelope("agent.failed", {
        agentRole: "architect",
        durationMs: 200,
        inputTokens: 500,
        outputTokens: 100,
        cost: 0.01,
      }),
    ];

    const results = computeAgentPerformance(envelopes);
    expect(results).toHaveLength(1);

    const arch = results[0];
    expect(arch.role).toBe("architect");
    expect(arch.executions).toBe(3);
    expect(arch.successRate).toBe(0.667);
    expect(arch.avgLatencyMs).toBe(400);
    expect(arch.tokens).toBe(3100);
    expect(arch.cost).toBe(0.06);
    expect(arch.rework).toBe(1);
    expect(arch.retries).toBe(1);
  });

  it("sorts agent rows by cost descending", () => {
    const envelopes: TelemetryEnvelope[] = [
      createTelemetryEnvelope("agent.completed", { agentRole: "cheap", cost: 0.001 }),
      createTelemetryEnvelope("agent.completed", { agentRole: "expensive", cost: 0.09 }),
    ];

    const results = computeAgentPerformance(envelopes);
    expect(results[0].role).toBe("expensive");
    expect(results[1].role).toBe("cheap");
  });
});
