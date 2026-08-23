import { describe, expect, it } from "vitest";
import {
  buildAiTelemetryRecord,
  computeSuccessRate,
  costPerArea,
  estimateCost,
  recordTelemetry,
} from "@/lib/aiTelemetry";

describe("estimateCost", () => {
  it("calcula custo proporcional por 1K tokens", () => {
    expect(estimateCost(1000)).toBe(0.003);
    expect(estimateCost(0)).toBe(0);
  });

  it("respeita preço customizado e arredonda para 5 casas (DECIMAL(10,5))", () => {
    expect(estimateCost(1500, 0.001)).toBe(0.0015);
    expect(estimateCost(3333, 0.003)).toBe(0.01);
  });
});

describe("computeSuccessRate", () => {
  it("retorna 0.0..1.0 arredondado", () => {
    expect(computeSuccessRate(4, 5)).toBe(0.8);
    expect(computeSuccessRate(0, 5)).toBe(0);
    expect(computeSuccessRate(5, 5)).toBe(1);
  });

  it("sem execuções → 1 (nada a reportar como falha)", () => {
    expect(computeSuccessRate(0, 0)).toBe(1);
  });

  it("limita taxas fora do intervalo permitido", () => {
    expect(computeSuccessRate(-1, 1)).toBe(0);
    expect(computeSuccessRate(2, 1)).toBe(1);
    expect(computeSuccessRate(Number.NaN, 1)).toBe(0);
    expect(computeSuccessRate(Number.POSITIVE_INFINITY, 1)).toBe(1);
  });
});

describe("buildAiTelemetryRecord", () => {
  it("aplica defaults (pruning 0, sucesso 1) e calcula custo", () => {
    const rec = buildAiTelemetryRecord({
      userId: "u1",
      sessionId: "sess-2026-08-14",
      area: "vendas",
      tokensUsed: 2000,
      totalExecutionTimeMs: 12000,
    });
    expect(rec.user_id).toBe("u1");
    expect(rec.area).toBe("vendas");
    expect(rec.tokens_used).toBe(2000);
    expect(rec.prompt_tokens_saved_by_pruning).toBe(0);
    expect(rec.total_execution_time_ms).toBe(12000);
    expect(rec.cost_estimate).toBe(0.006);
    expect(rec.success_rate).toBe(1);
  });

  it("aceita overrides e área nula", () => {
    const rec = buildAiTelemetryRecord({
      userId: "u1",
      sessionId: "s1",
      tokensUsed: 500,
      promptTokensSavedByPruning: 200,
      totalExecutionTimeMs: 3000,
      successRate: 0.5,
    });
    expect(rec.prompt_tokens_saved_by_pruning).toBe(200);
    expect(rec.success_rate).toBe(0.5);
    expect(rec.area).toBeNull();
  });

  it("limita override de sucesso ao intervalo permitido", () => {
    const low = buildAiTelemetryRecord({
      userId: "u1",
      sessionId: "s1",
      tokensUsed: 0,
      totalExecutionTimeMs: 0,
      successRate: -0.5,
    });
    const high = buildAiTelemetryRecord({
      userId: "u1",
      sessionId: "s1",
      tokensUsed: 0,
      totalExecutionTimeMs: 0,
      successRate: 1.5,
    });
    expect(low.success_rate).toBe(0);
    expect(high.success_rate).toBe(1);
    expect(
      buildAiTelemetryRecord({
        userId: "u1",
        sessionId: "s1",
        tokensUsed: 0,
        totalExecutionTimeMs: 0,
        successRate: Number.NaN,
      }).success_rate,
    ).toBe(1);
    expect(
      buildAiTelemetryRecord({
        userId: "u1",
        sessionId: "s1",
        tokensUsed: 0,
        totalExecutionTimeMs: 0,
        successRate: Number.POSITIVE_INFINITY,
      }).success_rate,
    ).toBe(1);
  });

  it("expõe a gravação resiliente pela API de telemetria", () => {
    expect(recordTelemetry).toBeTypeOf("function");
  });
});

describe("costPerArea", () => {
  it("agrupa por área, soma custo e calcula média de tempo", () => {
    const rows = [
      { area: "vendas", cost_estimate: 0.006, total_execution_time_ms: 1000 },
      { area: "vendas", cost_estimate: 0.003, total_execution_time_ms: 3000 },
      { area: "contas", cost_estimate: 0.01, total_execution_time_ms: 5000 },
    ];
    const result = costPerArea(rows as never);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ area: "contas", cost: 0.01, executions: 1, avgExecutionMs: 5000 });
    expect(result[1]).toMatchObject({ area: "vendas", cost: 0.009, executions: 2, avgExecutionMs: 2000 });
  });

  it("trata área vazia como 'geral'", () => {
    const result = costPerArea([
      { area: null, cost_estimate: 0.003, total_execution_time_ms: 1000 },
    ] as never);
    expect(result[0].area).toBe("geral");
  });
});
