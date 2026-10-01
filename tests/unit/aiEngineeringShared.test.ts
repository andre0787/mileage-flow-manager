/**
 * aiEngineeringShared.test.ts — Testes unitários para helpers de AI Engineering (src/lib/ai-engineering/shared.ts).
 *
 * Cobre:
 * - attemptsOf: extração do número de tentativas com fallback para 1 (sem retry)
 * - isAgentEvent: identificação de eventos do agente (completed/failed)
 * - avg: cálculo de média aritmética arredondada para 1 casa decimal
 */

import { describe, expect, it } from "vitest";
import { attemptsOf, avg, isAgentEvent } from "@/lib/ai-engineering/shared";
import { createTelemetryEnvelope, type TelemetryEnvelope } from "@/ai/telemetry/envelope";

describe("attemptsOf (src/lib/ai-engineering/shared.ts)", () => {
  it("retorna o número de tentativas quando definido na propriedade attempts", () => {
    const env = {
      ...createTelemetryEnvelope("agent.completed", {
        taskId: "T1",
        runId: "R1",
        model: "pi-local",
        agentAdapter: "pi",
      }),
      attempts: 3,
    } as TelemetryEnvelope;

    expect(attemptsOf(env)).toBe(3);
  });

  it("retorna 1 quando a propriedade attempts é 1", () => {
    const env = {
      ...createTelemetryEnvelope("agent.completed", {
        taskId: "T1",
        runId: "R1",
        model: "pi-local",
        agentAdapter: "pi",
      }),
      attempts: 1,
    } as TelemetryEnvelope;

    expect(attemptsOf(env)).toBe(1);
  });

  it("retorna 1 como padrão quando a propriedade attempts é undefined", () => {
    const env = createTelemetryEnvelope("agent.completed", {
      taskId: "T1",
      runId: "R1",
      model: "pi-local",
      agentAdapter: "pi",
    });

    expect(attemptsOf(env)).toBe(1);
  });

  it("retorna 0 quando a propriedade attempts é explicitamente 0", () => {
    const env = {
      ...createTelemetryEnvelope("agent.completed", {
        taskId: "T1",
        runId: "R1",
        model: "pi-local",
        agentAdapter: "pi",
      }),
      attempts: 0,
    } as TelemetryEnvelope;

    expect(attemptsOf(env)).toBe(0);
  });

  it("retorna 1 como padrão quando a propriedade attempts é null", () => {
    const env = {
      ...createTelemetryEnvelope("agent.completed", {
        taskId: "T1",
        runId: "R1",
        model: "pi-local",
        agentAdapter: "pi",
      }),
      attempts: null,
    } as unknown as TelemetryEnvelope;

    expect(attemptsOf(env)).toBe(1);
  });
});

describe("isAgentEvent (src/lib/ai-engineering/shared.ts)", () => {
  it("retorna true para agent.completed e agent.failed", () => {
    const completedEnv = createTelemetryEnvelope("agent.completed", {
      taskId: "T1",
      runId: "R1",
      model: "pi-local",
      agentAdapter: "pi",
    });
    const failedEnv = createTelemetryEnvelope("agent.failed", {
      taskId: "T1",
      runId: "R1",
      model: "pi-local",
      agentAdapter: "pi",
      errorCode: "exit:1",
    });

    expect(isAgentEvent(completedEnv)).toBe(true);
    expect(isAgentEvent(failedEnv)).toBe(true);
  });

  it("retorna false para outros eventos de telemetria", () => {
    const dispatchedEnv = createTelemetryEnvelope("agent.dispatched", {
      taskId: "T1",
      runId: "R1",
      model: "pi-local",
      agentAdapter: "pi",
    });
    const execEnv = createTelemetryEnvelope("execution.completed", {
      taskId: "T1",
      runId: "R1",
      model: "pi-local",
      agentAdapter: "pi",
    });

    expect(isAgentEvent(dispatchedEnv)).toBe(false);
    expect(isAgentEvent(execEnv)).toBe(false);
  });
});

describe("avg (src/lib/ai-engineering/shared.ts)", () => {
  it("retorna 0 para array vazio", () => {
    expect(avg([])).toBe(0);
  });

  it("calcula a média e arredonda para 1 casa decimal", () => {
    expect(avg([10, 20, 30])).toBe(20);
    expect(avg([10, 15, 12])).toBe(12.3);
    expect(avg([5.55, 10.12])).toBe(7.8);
  });
});
