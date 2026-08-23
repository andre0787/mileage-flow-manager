import { describe, expect, it } from "vitest";
import { envelopeToRecord, isPersistableEnvelope } from "@/ai/telemetry/persist";
import { createTelemetryEnvelope, type TelemetryEnvelope } from "@/ai/telemetry/envelope";
import { isEnvelopeComplete } from "@/ai/telemetry/completeness";

function env(partial: Partial<TelemetryEnvelope>): TelemetryEnvelope {
  return {
    eventId: "e1",
    eventType: "agent.completed",
    timestamp: new Date().toISOString(),
    success: true,
    errorCode: null,
    model: "test-model",
    ...partial,
  };
}

describe("envelopeToRecord", () => {
  it("mapeia campos principais (agentAdapter/role/model separados)", () => {
    const record = envelopeToRecord(
      env({
        eventType: "agent.completed",
        agentAdapter: "pi",
        agentRole: "graph-scout",
        model: "qwen-2.5",
        durationMs: 1234,
        inputTokens: 1000,
        outputTokens: 500,
        tokensSaved: 3000,
        toolCalls: 5,
      }),
      { sessionId: "sess-1" },
    );
    expect(record.session_id).toBe("sess-1");
    expect(record.area).toBe("graph-scout");
    expect(record.agent_adapter).toBe("pi");
    expect(record.agent_role).toBe("graph-scout");
    expect(record.model).toBe("qwen-2.5");
    expect(record.tokens_used).toBe(1500);
    expect(record.total_execution_time_ms).toBe(1234);
    expect(record.tool_calls).toBe(5);
    expect(record.success_rate).toBe(1);
  });

  it("área cai para agentAdapter quando não há role", () => {
    const record = envelopeToRecord(env({ agentAdapter: "codex", agentRole: undefined }), {
      sessionId: "s",
    });
    expect(record.area).toBe("codex");
  });

  it("success=false vira success_rate 0 e preserva error_code", () => {
    const record = envelopeToRecord(
      env({ success: false, errorCode: "boom", eventType: "agent.failed" }),
      { sessionId: "s" },
    );
    expect(record.success_rate).toBe(0);
    expect(record.error_code).toBe("boom");
    expect(record.event_type).toBe("agent.failed");
  });

  it("calcula custo via estimateCost (default 0.003/1K)", () => {
    const record = envelopeToRecord(env({ inputTokens: 1000, outputTokens: 0 }), {
      sessionId: "s",
    });
    // 1000 tokens / 1000 * 0.003 = 0.003
    expect(record.cost_estimate).toBe(0.003);
  });

  it("fail-open: campos ausentes viram null/0", () => {
    const record = envelopeToRecord(env({ model: undefined }), { sessionId: "s" });
    expect(record.model).toBeNull();
    expect(record.tokens_used).toBe(0);
    expect(record.area).toBeNull();
    expect(record.task_id).toBeNull();
  });
});

describe("isEnvelopeComplete", () => {
  it("rejeita model vazio ou unset com espaços", () => {
    expect(isEnvelopeComplete(env({ eventType: "agent.completed", model: "   " }))).toBe(false);
    expect(isEnvelopeComplete(env({ eventType: "agent.completed", model: " unset " }))).toBe(false);
  });
});

describe("isPersistableEnvelope", () => {
  it("aceita execution/agent/graph.query", () => {
    expect(isPersistableEnvelope(env({ eventType: "execution.started" }))).toBe(true);
    expect(isPersistableEnvelope(env({ eventType: "agent.failed" }))).toBe(true);
    expect(isPersistableEnvelope(env({ eventType: "graph.query.completed" }))).toBe(true);
  });

  it("rejeita eventos de contexto/gate (não-persistíveis)", () => {
    expect(isPersistableEnvelope(env({ eventType: "context.created" }))).toBe(false);
    expect(isPersistableEnvelope(env({ eventType: "gate.completed" }))).toBe(false);
    expect(isPersistableEnvelope(createTelemetryEnvelope("tool.started"))).toBe(false);
  });

  it("rejeita persistência sem identidade de modelo válida", () => {
    expect(isPersistableEnvelope(env({ model: undefined }))).toBe(false);
    expect(isPersistableEnvelope(env({ model: "unset" }))).toBe(false);
    expect(isPersistableEnvelope(env({ model: "   " }))).toBe(false);
  });
});
