import { describe, expect, it } from "vitest";
import {
  checkEnvelopeCompleteness,
  createTelemetryEnvelope,
  envelopeToJsonLine,
  hasValidModelIdentity,
  isEnvelopeComplete,
} from "@/ai/telemetry/envelope";

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

describe("P11-03 — telemetry E2E", () => {
  it("envelope persistível completo exige identidade do run (taskId/runId/model)", () => {
    const full = createTelemetryEnvelope("agent.completed", {
      taskId: "T1",
      runId: "R1",
      model: "pi-local",
    });
    expect(isEnvelopeComplete(full)).toBe(true);

    const missingModel = createTelemetryEnvelope("agent.completed", { taskId: "T1", runId: "R1" });
    expect(isEnvelopeComplete(missingModel)).toBe(false);
  });

  it("evento não-persistível não exige identidade do run", () => {
    const env = createTelemetryEnvelope("gate.completed");
    expect(isEnvelopeComplete(env)).toBe(true);
  });

  it("model identity: 'unset' é inválida, vazio é inválido, concreto é válido", () => {
    expect(
      hasValidModelIdentity({ ...createTelemetryEnvelope("execution.started"), model: "unset" }),
    ).toBe(false);
    expect(
      hasValidModelIdentity({ ...createTelemetryEnvelope("execution.started"), model: "" }),
    ).toBe(false);
    expect(
      hasValidModelIdentity({ ...createTelemetryEnvelope("execution.started"), model: "qwen-2.5" }),
    ).toBe(true);
  });

  it("checkEnvelopeCompleteness: 100% completo → met true", () => {
    const envelopes = [
      createTelemetryEnvelope("execution.started", { taskId: "T1", runId: "R1", model: "m" }),
      createTelemetryEnvelope("agent.completed", { taskId: "T1", runId: "R1", model: "m" }),
      createTelemetryEnvelope("gate.completed"),
    ];
    const report = checkEnvelopeCompleteness(envelopes);
    expect(report.total).toBe(3);
    expect(report.complete).toBe(3);
    expect(report.completenessPct).toBe(100);
    expect(report.missingModelIdentity).toBe(0);
    expect(report.met).toBe(true);
  });

  it("checkEnvelopeCompleteness: envelope incompleto reduz percentual e met=false", () => {
    const envelopes = [
      createTelemetryEnvelope("agent.completed", { taskId: "T1", runId: "R1", model: "m" }),
      // Falta taskId/runId/model → incompleto + missingModelIdentity
      createTelemetryEnvelope("agent.completed"),
    ];
    const report = checkEnvelopeCompleteness(envelopes);
    expect(report.complete).toBe(1);
    expect(report.completenessPct).toBe(50);
    expect(report.missingModelIdentity).toBe(1);
    expect(report.met).toBe(false);
  });

  it("checkEnvelopeCompleteness: lista vazia → met false (sem dados)", () => {
    const report = checkEnvelopeCompleteness([]);
    expect(report.total).toBe(0);
    expect(report.met).toBe(false);
  });
});
