/**
 * bottlenecks.test.ts — Unit tests for computeBottlenecks (P11-08 AI Engineering).
 */

import { describe, expect, it } from "vitest";
import { computeBottlenecks } from "@/lib/ai-engineering/bottlenecks";
import { createTelemetryEnvelope, type TelemetryEnvelope } from "@/ai/telemetry/envelope";

function baseEnvelope(agentRole: string) {
  return {
    taskId: "T1",
    runId: "R1",
    model: "pi-local",
    agentAdapter: "pi",
    agentRole,
  };
}

describe("computeBottlenecks", () => {
  it("retorna lista vazia quando envelopes está vazio", () => {
    const result = computeBottlenecks([]);
    expect(result).toEqual([]);
  });

  it("ignora eventos que não pertencem a agentes (ex: gate.completed, execution.completed)", () => {
    const envelopes: TelemetryEnvelope[] = [
      createTelemetryEnvelope("execution.started", { taskId: "T1" }),
      createTelemetryEnvelope("gate.completed", { taskId: "T1" }),
      createTelemetryEnvelope("graph.query.started", { taskId: "T1" }),
    ];
    const result = computeBottlenecks(envelopes);
    expect(result).toEqual([]);
  });

  it("não gera gargalos se latência, falhas, retries e custo forem <= 0", () => {
    const envelopes: TelemetryEnvelope[] = [
      createTelemetryEnvelope("agent.completed", {
        ...baseEnvelope("fast-agent"),
        durationMs: 0,
        cost: 0,
        attempts: 1,
      }),
    ];

    const result = computeBottlenecks(envelopes);
    expect(result).toEqual([]);
  });

  it("identifica gargalos de latência, falhas, retries e custo para um único agente", () => {
    const envelopes: TelemetryEnvelope[] = [
      createTelemetryEnvelope("agent.completed", {
        ...baseEnvelope("worker"),
        durationMs: 1500,
        cost: 0.05,
        attempts: 2,
      } as never),
      createTelemetryEnvelope("agent.failed", {
        ...baseEnvelope("worker"),
        durationMs: 800,
        cost: 0.02,
        errorCode: "exit:1",
      }),
    ];

    const result = computeBottlenecks(envelopes);
    expect(result).toEqual([
      { type: "latency", role: "worker", value: 1150 },
      { type: "failures", role: "worker", value: 1 },
      { type: "retries", role: "worker", value: 1 },
      { type: "expensive", role: "worker", value: 0.07 },
    ]);
  });

  it("seleciona os piores agentes em cada categoria em um cenário multi-agente", () => {
    const envelopes: TelemetryEnvelope[] = [
      // Agent 1: High latency, low cost, 0 retries, 0 failures
      createTelemetryEnvelope("agent.completed", {
        ...baseEnvelope("slow-agent"),
        durationMs: 3000,
        cost: 0.001,
        attempts: 1,
      }),

      // Agent 2: High failures and retries, medium latency, medium cost
      createTelemetryEnvelope("agent.failed", {
        ...baseEnvelope("unstable-agent"),
        durationMs: 500,
        cost: 0.01,
        attempts: 3,
      } as never),
      createTelemetryEnvelope("agent.failed", {
        ...baseEnvelope("unstable-agent"),
        durationMs: 500,
        cost: 0.01,
        attempts: 2,
      } as never),

      // Agent 3: High cost, fast, 0 failures, 0 retries
      createTelemetryEnvelope("agent.completed", {
        ...baseEnvelope("expensive-agent"),
        durationMs: 100,
        cost: 0.99,
        attempts: 1,
      }),
    ];

    const result = computeBottlenecks(envelopes);

    expect(result).toEqual([
      { type: "latency", role: "slow-agent", value: 3000 },
      { type: "failures", role: "unstable-agent", value: 2 },
      { type: "retries", role: "unstable-agent", value: 2 },
      { type: "expensive", role: "expensive-agent", value: 0.99 },
    ]);
  });

  it("omite apenas os tipos de gargalo que não possuem valor > 0", () => {
    const envelopes: TelemetryEnvelope[] = [
      createTelemetryEnvelope("agent.completed", {
        ...baseEnvelope("efficient-costly"),
        durationMs: 0,
        cost: 0.5,
        attempts: 1,
      }),
    ];

    const result = computeBottlenecks(envelopes);
    expect(result).toEqual([
      { type: "expensive", role: "efficient-costly", value: 0.5 },
    ]);
  });
});
