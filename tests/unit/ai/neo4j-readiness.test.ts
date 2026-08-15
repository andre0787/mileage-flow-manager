/**
 * neo4j-readiness.test.ts — P11-07 Neo4j Readiness Evolution.
 *
 * Cobre: score composto (densidade, multi-hop, complexidade), bandas com
 * thresholds configuráveis (0-39 local, 40-69 monitor, 70-84 PoC, 85+
 * migração), trend vs histórico, snapshots e recomendação — sem migração
 * automática.
 */

import { describe, expect, it } from "vitest";
import {
  computeNeedScore,
  readinessBand,
  recommendationFor,
  computeTrend,
  evaluateNeo4jReadiness,
  snapshotFromMetrics,
  DEFAULT_READINESS_THRESHOLDS,
  type Neo4jWorkloadMetrics,
} from "@/ai/graph/readiness";

function baseMetrics(partial: Partial<Neo4jWorkloadMetrics> = {}): Neo4jWorkloadMetrics {
  return {
    nodes: 100,
    edges: 200,
    multiHopRatio: 0.5,
    queryP95Ms: 100,
    concurrency: 4,
    scannedNodes: 100,
    growthPct: 0,
    ...partial,
  };
}

describe("computeNeedScore (P11-07)", () => {
  it("grafo vazio → 0", () => {
    expect(computeNeedScore(baseMetrics({ nodes: 0, edges: 0 }))).toBe(0);
  });

  it("grafo denso com multi-hop alto → score alto", () => {
    const score = computeNeedScore(
      baseMetrics({
        nodes: 100,
        edges: 500,
        multiHopRatio: 1,
        concurrency: 20,
        scannedNodes: 500,
        queryP95Ms: 600,
      }),
    );
    expect(score).toBeGreaterThan(60);
  });

  it("grafo pequeno simples → score baixo", () => {
    const score = computeNeedScore(
      baseMetrics({
        nodes: 50,
        edges: 40,
        multiHopRatio: 0.05,
        concurrency: 1,
        scannedNodes: 10,
        queryP95Ms: 5,
      }),
    );
    expect(score).toBeLessThanOrEqual(30);
  });
});

describe("bandas e thresholds (P11-07)", () => {
  it("thresholds padrão da spec (0-39 local, 40-69 monitor, 70-84 PoC, 85+ migração)", () => {
    expect(readinessBand(0)).toBe("local");
    expect(readinessBand(39)).toBe("local");
    expect(readinessBand(40)).toBe("monitor");
    expect(readinessBand(69)).toBe("monitor");
    expect(readinessBand(70)).toBe("prepare-poc");
    expect(readinessBand(84)).toBe("prepare-poc");
    expect(readinessBand(85)).toBe("migration-justified");
    expect(readinessBand(100)).toBe("migration-justified");
  });

  it("thresholds configuráveis", () => {
    const tight = { localMax: 20, monitorMax: 40, preparePocMax: 60, migrationMin: 61 };
    expect(readinessBand(50, tight)).toBe("prepare-poc");
    expect(readinessBand(30, tight)).toBe("monitor");
  });
});

describe("trend (P11-07)", () => {
  it("sem histórico → no-history", () => {
    expect(computeTrend(50, [])).toBe("no-history");
  });

  it("sobe/desce/estável comparado ao último snapshot", () => {
    const history = [
      {
        timestamp: "t1",
        nodeCount: 100,
        edgeCount: 200,
        queryP95Ms: 50,
        multiHopRatio: 0.3,
        concurrency: 2,
        needScore: 40,
      },
    ];
    expect(computeTrend(55, history)).toBe("up");
    expect(computeTrend(35, history)).toBe("down");
    expect(computeTrend(41, history)).toBe("stable");
  });
});

describe("evaluateNeo4jReadiness (P11-07)", () => {
  it("retorna score, banda, recomendação e histórico", () => {
    const result = evaluateNeo4jReadiness(
      baseMetrics({
        nodes: 2000,
        edges: 9000,
        multiHopRatio: 0.8,
        concurrency: 8,
        scannedNodes: 500,
        queryP95Ms: 600,
      }),
      {
        history: [snapshotFromMetrics(baseMetrics({ nodes: 500 }))],
      },
    );
    expect(result.band).toBe("migration-justified");
    expect(result.recommendation).toContain("migração justificada");
    expect(result.trend).toBe("up");
    expect(result.history).toHaveLength(1);
    expect(result.score).toBeGreaterThanOrEqual(85);
  });

  it("fail-open: sem métricas → local, no-history", () => {
    const result = evaluateNeo4jReadiness(baseMetrics({ nodes: 0, edges: 0 }));
    expect(result.score).toBe(0);
    expect(result.band).toBe("local");
    expect(result.trend).toBe("no-history");
  });

  it("recomenda monitorar no meio", () => {
    const result = evaluateNeo4jReadiness(
      baseMetrics({ nodes: 100, edges: 300, multiHopRatio: 0.4 }),
    );
    expect(["local", "monitor"]).toContain(result.band);
  });
});

describe("snapshots (P11-07)", () => {
  it("snapshotFromMetrics captura métricas e score", () => {
    const snap = snapshotFromMetrics(baseMetrics({ nodes: 300, edges: 600 }));
    expect(snap.nodeCount).toBe(300);
    expect(snap.edgeCount).toBe(600);
    expect(snap.needScore).toBe(computeNeedScore(baseMetrics({ nodes: 300, edges: 600 })));
    expect(Number.isNaN(Date.parse(snap.timestamp))).toBe(false);
  });

  it("DEFAULT_READINESS_THRESHOLDS segue a spec §P11-07", () => {
    expect(DEFAULT_READINESS_THRESHOLDS.localMax).toBe(39);
    expect(DEFAULT_READINESS_THRESHOLDS.monitorMax).toBe(69);
    expect(DEFAULT_READINESS_THRESHOLDS.preparePocMax).toBe(84);
    expect(DEFAULT_READINESS_THRESHOLDS.migrationMin).toBe(85);
  });
});
