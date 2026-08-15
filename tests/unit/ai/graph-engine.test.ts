import { describe, expect, it } from "vitest";
import {
  computeReadinessScore,
  graphQuery,
  graphSearch,
  graphStatus,
  readinessBand,
} from "@/ai/graph/engine";

describe("computeReadinessScore", () => {
  it("grafo vazio → 0 (P4: sem evidência)", () => {
    expect(
      computeReadinessScore({
        nodes: 0,
        edges: 0,
        multiHopPct: 0,
        queryP95Ms: null,
        scannedNodes: 0,
        concurrency: 1,
      }),
    ).toBe(0);
  });

  it("densidade alta + multi-hop → score alto", () => {
    const score = computeReadinessScore({
      nodes: 100,
      edges: 500,
      multiHopPct: 80,
      queryP95Ms: 120,
      scannedNodes: 1000,
      concurrency: 4,
    });
    expect(score).toBeGreaterThan(0.5);
  });

  it("densidade baixa → score baixo (fica em Postgres)", () => {
    const score = computeReadinessScore({
      nodes: 50,
      edges: 10,
      multiHopPct: 5,
      queryP95Ms: 10,
      scannedNodes: 50,
      concurrency: 1,
    });
    expect(score).toBeLessThan(0.4);
  });
});

describe("readinessBand", () => {
  it("mapeia score para banda do SDD seção 25", () => {
    expect(readinessBand(0.2)).toBe("local/postgres");
    expect(readinessBand(0.5)).toBe("observe");
    expect(readinessBand(0.65)).toBe("prepare-poc");
    expect(readinessBand(0.8)).toBe("recommend-poc");
    expect(readinessBand(0.95)).toBe("high-priority");
  });
});

describe("graphStatus", () => {
  it("fail-open: nunca lança e retorna available:false sem CRG", () => {
    // O engine faz spawnSync — se o CRG não estiver instalado, degrada.
    const status = graphStatus();
    expect(typeof status.available).toBe("boolean");
    if (!status.available) {
      expect(status.error).toBeTruthy();
    }
  });
});

describe("graphSearch (v2.3.7)", () => {
  it("fail-open: nunca lança e devolve estrutura válida (com ou sem CRG)", () => {
    const r = graphSearch("owners", "Class");
    expect(Array.isArray(r.nodes)).toBe(true);
    expect(Array.isArray(r.edges)).toBe(true);
    expect(typeof r.queriedAt).toBe("string");
  });

  it("devolve nodes com id/label quando o CRG responde", () => {
    const r = graphSearch("owners");
    if (r.nodes.length > 0) {
      expect(r.nodes[0].id).toBeTruthy();
      expect(r.nodes[0].label).toBeTruthy();
    }
  });
});

describe("graphQuery (v2.3.7)", () => {
  it("fail-open: nunca lança e devolve estrutura válida", () => {
    const r = graphQuery();
    expect(Array.isArray(r.nodes)).toBe(true);
    expect(Array.isArray(r.edges)).toBe(true);
    expect(r.reachable === undefined || Array.isArray(r.reachable)).toBe(true);
  });
});
