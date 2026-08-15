/**
 * graph-metrics.test.ts — P11-04 Graph & Context Intelligence.
 *
 * Cobre: percentis (p50/p95/p99), resumo de métricas, cache de queries,
 * comparativo Graph Value (graph vs non-graph) e Context Packet estendido
 * (graph/domain/history/test context + confidence/freshness/source_count).
 */

import { describe, expect, it } from "vitest";
import {
  percentile,
  summarizeGraphMetrics,
  GraphQueryCache,
  type GraphQueryMetric,
} from "@/ai/graph/metrics";
import { compareGraphValue, reductionPct, type RunOutcome } from "@/ai/graph/graph-value";
import { buildContextPacket } from "@/ai/core/context-packet";
import { emptyGraphResult } from "@/ai/core/graph-types";

describe("percentis (P11-04)", () => {
  it("p50/p95/p99 de durações", () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(percentile(values, 50)).toBe(5);
    expect(percentile(values, 95)).toBe(10);
    expect(percentile(values, 99)).toBe(10);
  });

  it("lista vazia → null", () => {
    expect(percentile([], 95)).toBeNull();
  });
});

describe("summarizeGraphMetrics (P11-04)", () => {
  const mk = (partial: Partial<GraphQueryMetric>): GraphQueryMetric => ({
    queryId: "q",
    target: "t",
    durationMs: 10,
    nodesScanned: 5,
    edgesScanned: 2,
    hopCount: 1,
    resultSize: 3,
    cacheHit: false,
    contextReuseTokens: 0,
    timestamp: new Date().toISOString(),
    ...partial,
  });

  it("agrega contagem, percentis, multi-hop e cache", () => {
    const metrics = [
      mk({ queryId: "a", durationMs: 10, hopCount: 1, cacheHit: true }),
      mk({ queryId: "b", durationMs: 100, hopCount: 2, cacheHit: false }),
      mk({ queryId: "c", durationMs: 200, hopCount: 3, cacheHit: false }),
    ];
    const s = summarizeGraphMetrics(metrics);
    expect(s.queryCount).toBe(3);
    expect(s.p50Ms).toBe(100);
    expect(s.p95Ms).toBe(200);
    expect(s.multiHopRatio).toBeCloseTo(2 / 3, 2);
    expect(s.cacheHitRate).toBeCloseTo(1 / 3, 2);
    expect(s.avgHopCount).toBe(2);
  });

  it("lista vazia → zeros/nulls", () => {
    const s = summarizeGraphMetrics([]);
    expect(s.queryCount).toBe(0);
    expect(s.p95Ms).toBeNull();
    expect(s.multiHopRatio).toBe(0);
  });
});

describe("GraphQueryCache (P11-04)", () => {
  it("armazena e reusa resultados (context reuse)", () => {
    const cache = new GraphQueryCache();
    expect(cache.has("src/lib/x.ts")).toBe(false);
    cache.set("src/lib/x.ts", { nodes: [] });
    expect(cache.has("src/lib/x.ts")).toBe(true);
    expect(cache.get("src/lib/x.ts")?.result).toEqual({ nodes: [] });
    expect(cache.size).toBe(1);
    cache.clear();
    expect(cache.size).toBe(0);
  });
});

describe("Graph Value comparator (P11-04)", () => {
  const nonGraph: RunOutcome = {
    strategy: "non-graph",
    taskId: "T1",
    tokensUsed: 10_000,
    durationMs: 60_000,
    qualityScore: 7,
    failures: 2,
    reworkCount: 3,
  };
  const graphAssisted: RunOutcome = {
    strategy: "graph-assisted",
    taskId: "T1",
    tokensUsed: 6_000,
    durationMs: 45_000,
    qualityScore: 8.5,
    failures: 1,
    reworkCount: 1,
  };

  it("calcula economia de tokens, latência, qualidade e rework", () => {
    const report = compareGraphValue(nonGraph, graphAssisted);
    expect(report.tokensSaved).toBe(4_000);
    expect(report.tokensSavedPct).toBe(40);
    expect(report.qualityDelta).toBe(1.5);
    expect(report.reworkSaved).toBe(2);
    expect(report.failureDelta).toBe(-1);
    expect(report.beneficial).toBe(true);
  });

  it("reductionPct evita divisão por zero", () => {
    expect(reductionPct(0, 10)).toBe(0);
    expect(reductionPct(100, 75)).toBe(25);
  });

  it("marca não-beneficioso quando qualidade cai ou rework aumenta", () => {
    const worse = compareGraphValue(nonGraph, {
      ...graphAssisted,
      qualityScore: 5,
      reworkCount: 5,
    });
    expect(worse.beneficial).toBe(false);
  });
});

describe("Context Packet estendido (P11-04)", () => {
  it("inclui contextos especializados, confidence, freshness e source_count", () => {
    const packet = buildContextPacket(emptyGraphResult("v1"), {
      graphContext: ["src/lib/a.ts"],
      domainContext: ["accounts"],
      historyContext: ["T-123"],
      testContext: ["a.test.ts"],
      confidence: 0.87,
      freshness: "fresh",
      commit: "abc123",
    });
    expect(packet.graphContext).toEqual(["src/lib/a.ts"]);
    expect(packet.domainContext).toEqual(["accounts"]);
    expect(packet.historyContext).toEqual(["T-123"]);
    expect(packet.testContext).toEqual(["a.test.ts"]);
    expect(packet.confidence).toBe(0.87);
    expect(packet.freshness).toBe("fresh");
    expect(packet.source_count).toBe(1); // assembler (specialized presente)
  });

  it("packet sem fontes → source_count 0", () => {
    const packet = buildContextPacket(emptyGraphResult("v1"));
    expect(packet.source_count).toBe(0);
    expect(packet.freshness).toBeUndefined();
  });
});
