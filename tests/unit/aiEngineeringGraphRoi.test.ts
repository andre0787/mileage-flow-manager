/**
 * aiEngineeringGraphRoi.test.ts — Unit tests for AI Engineering Graph ROI & Readiness UI.
 *
 * Tests src/lib/ai-engineering/graph-roi.ts:
 * - computeGraphRoi: queries, tokensSaved, contextReuseTokens, cacheHitRate, reworkDifference
 * - computeReadinessUi: drivers detection (multi-hop, p95, nodes count, small workload fallback)
 */

import { describe, expect, it } from "vitest";
import { computeGraphRoi, computeReadinessUi } from "@/lib/ai-engineering/graph-roi";
import { createTelemetryEnvelope, type TelemetryEnvelope } from "@/ai/telemetry/envelope";
import type { Neo4jWorkloadMetrics } from "@/ai/graph/readiness";

const baseMeta = { taskId: "T1", runId: "R1", model: "pi-local", agentAdapter: "pi" };

describe("computeGraphRoi (src/lib/ai-engineering/graph-roi.ts)", () => {
  it("retorna zeros quando a lista de envelopes está vazia (fail-open)", () => {
    const roi = computeGraphRoi([]);

    expect(roi).toEqual({
      graphQueries: 0,
      tokensSaved: 0,
      contextReuseTokens: 0,
      cacheHitRate: 0,
      reworkDifference: 0,
    });
  });

  it("conta apenas eventos que começam com 'graph.query.' em graphQueries", () => {
    const envelopes: TelemetryEnvelope[] = [
      createTelemetryEnvelope("graph.query.started", baseMeta),
      createTelemetryEnvelope("graph.query.completed", baseMeta),
      createTelemetryEnvelope("graph.query.failed", baseMeta),
      createTelemetryEnvelope("agent.started", baseMeta),
      createTelemetryEnvelope("agent.completed", baseMeta),
      createTelemetryEnvelope("execution.completed", baseMeta),
    ];

    const roi = computeGraphRoi(envelopes);

    expect(roi.graphQueries).toBe(3);
  });

  it("soma tokensSaved e contextReuseTokens tratando propriedades ausentes/undefined", () => {
    const envelopes: TelemetryEnvelope[] = [
      createTelemetryEnvelope("agent.completed", { ...baseMeta, tokensSaved: 500 }),
      {
        ...createTelemetryEnvelope("agent.completed", baseMeta),
        contextReuseTokens: 300,
      } as TelemetryEnvelope,
      createTelemetryEnvelope("agent.completed", { ...baseMeta, tokensSaved: 200 }),
      {
        ...createTelemetryEnvelope("agent.completed", baseMeta),
        contextReuseTokens: 150,
      } as TelemetryEnvelope,
      createTelemetryEnvelope("agent.completed", baseMeta), // sem tokens
    ];

    const roi = computeGraphRoi(envelopes);

    expect(roi.tokensSaved).toBe(700);
    expect(roi.contextReuseTokens).toBe(450);
  });

  it("calcula cacheHitRate com precisão de 2 casas decimais para eventos graph.query.completed", () => {
    const envelopes: TelemetryEnvelope[] = [
      {
        ...createTelemetryEnvelope("graph.query.completed", baseMeta),
        cacheHit: true,
      } as TelemetryEnvelope,
      {
        ...createTelemetryEnvelope("graph.query.completed", baseMeta),
        cacheHit: false,
      } as TelemetryEnvelope,
      {
        ...createTelemetryEnvelope("graph.query.completed", baseMeta),
        cacheHit: false,
      } as TelemetryEnvelope,
    ];

    const roi = computeGraphRoi(envelopes);

    // 1 hit de 3 completed = 0.3333... arredondado para 0.33
    expect(roi.cacheHitRate).toBe(0.33);
  });

  it("retorna cacheHitRate = 0 se não houver consultas concluídas (completed)", () => {
    const envelopes: TelemetryEnvelope[] = [
      createTelemetryEnvelope("graph.query.started", baseMeta),
      createTelemetryEnvelope("graph.query.failed", baseMeta),
    ];

    const roi = computeGraphRoi(envelopes);

    expect(roi.graphQueries).toBe(2);
    expect(roi.cacheHitRate).toBe(0);
  });

  it("conta falhas de agente (agent.failed) como reworkDifference", () => {
    const envelopes: TelemetryEnvelope[] = [
      createTelemetryEnvelope("agent.failed", { ...baseMeta, errorCode: "ERR_1" }),
      createTelemetryEnvelope("agent.completed", baseMeta),
      createTelemetryEnvelope("agent.failed", { ...baseMeta, errorCode: "ERR_2" }),
    ];

    const roi = computeGraphRoi(envelopes);

    expect(roi.reworkDifference).toBe(2);
  });
});

describe("computeReadinessUi (src/lib/ai-engineering/graph-roi.ts)", () => {
  const baseMetrics: Neo4jWorkloadMetrics = {
    nodes: 500,
    edges: 2000,
    multiHopRatio: 0.1,
    queryP95Ms: 150,
    concurrency: 2,
    scannedNodes: 100,
    growthPct: 2,
  };

  it("retorna 'workload ainda pequeno' quando nenhuma métrica ultrapassa os limites", () => {
    const ui = computeReadinessUi(baseMetrics);

    expect(ui.drivers).toEqual(["workload ainda pequeno"]);
    expect(typeof ui.score).toBe("number");
    expect(typeof ui.band).toBe("string");
    expect(typeof ui.recommendation).toBe("string");
  });

  it("ativa o driver de multi-hop quando multiHopRatio > 0.3", () => {
    const ui = computeReadinessUi({
      ...baseMetrics,
      multiHopRatio: 0.456,
    });

    expect(ui.drivers).toContain("multi-hop 46%");
  });

  it("ativa o driver de p95 quando queryP95Ms > 200", () => {
    const ui = computeReadinessUi({
      ...baseMetrics,
      queryP95Ms: 320,
    });

    expect(ui.drivers).toContain("p95 320ms");
  });

  it("ignora driver de p95 quando queryP95Ms é null", () => {
    const ui = computeReadinessUi({
      ...baseMetrics,
      queryP95Ms: null,
    });

    expect(ui.drivers).toEqual(["workload ainda pequeno"]);
  });

  it("ativa o driver de número de nós quando nodes > 1000", () => {
    const ui = computeReadinessUi({
      ...baseMetrics,
      nodes: 1500,
    });

    expect(ui.drivers).toContain("1500 nós");
  });

  it("combina múltiplos drivers quando vários limites são ultrapassados", () => {
    const ui = computeReadinessUi({
      ...baseMetrics,
      multiHopRatio: 0.5,
      queryP95Ms: 250,
      nodes: 2000,
    });

    expect(ui.drivers).toEqual(["multi-hop 50%", "p95 250ms", "2000 nós"]);
  });

  it("respeita rigorosamente os limites de fronteira (boundary condition checks)", () => {
    // Exatamente nos limites -> não deve ativar drivers adicionais
    const uiAtBoundaries = computeReadinessUi({
      ...baseMetrics,
      multiHopRatio: 0.3,
      queryP95Ms: 200,
      nodes: 1000,
    });
    expect(uiAtBoundaries.drivers).toEqual(["workload ainda pequeno"]);

    // Ligeiramente acima dos limites -> deve ativar todos os drivers
    const uiAboveBoundaries = computeReadinessUi({
      ...baseMetrics,
      multiHopRatio: 0.31,
      queryP95Ms: 201,
      nodes: 1001,
    });
    expect(uiAboveBoundaries.drivers).toEqual(["multi-hop 31%", "p95 201ms", "1001 nós"]);
  });
});
