import { describe, expect, it } from "vitest";
import { createTelemetryEnvelope, envelopeToJsonLine } from "@/ai/telemetry/envelope";

describe("createTelemetryEnvelope", () => {
  it("gera envelope com defaults (eventId, timestamp, success)", () => {
    const env = createTelemetryEnvelope("agent.completed");
    expect(env.eventType).toBe("agent.completed");
    expect(env.success).toBe(true);
    expect(env.errorCode).toBeNull();
    expect(env.eventId).toBeTruthy();
    expect(Number.isNaN(Date.parse(env.timestamp))).toBe(false);
  });

  it("preenche campos parciais (adapter/role/model separados)", () => {
    const env = createTelemetryEnvelope(
      "agent.failed",
      {
        agentAdapter: "pi",
        agentRole: "graph-scout",
        model: "qwen-2.5",
        durationMs: 1234,
        inputTokens: 1000,
        outputTokens: 500,
        tokensSaved: 3000,
        toolCalls: 5,
      },
      false,
    );
    expect(env.agentAdapter).toBe("pi");
    expect(env.agentRole).toBe("graph-scout");
    expect(env.model).toBe("qwen-2.5");
    expect(env.durationMs).toBe(1234);
    expect(env.tokensSaved).toBe(3000);
    expect(env.success).toBe(false);
  });

  it("mantém eventId único entre chamadas", () => {
    const a = createTelemetryEnvelope("gate.completed");
    const b = createTelemetryEnvelope("gate.completed");
    expect(a.eventId).not.toBe(b.eventId);
  });
});

describe("envelopeToJsonLine", () => {
  it("serializa em linha JSON parseável", () => {
    const env = createTelemetryEnvelope("execution.started", { taskId: "P5-01" });
    const line = envelopeToJsonLine(env);
    const parsed = JSON.parse(line);
    expect(parsed.taskId).toBe("P5-01");
    expect(parsed.eventType).toBe("execution.started");
  });
});
