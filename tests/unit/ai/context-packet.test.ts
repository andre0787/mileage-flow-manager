import { describe, expect, it } from "vitest";
import { buildContextPacket, estimateTokens, packetHash } from "@/ai/core/context-packet";
import type { GraphQueryResult } from "@/ai/core/graph-types";

const sampleResult: GraphQueryResult = {
  nodes: [
    { id: "a.ts", type: "file", label: "a.ts" },
    { id: "b.ts", type: "file", label: "b.ts" },
    { id: "foo", type: "symbol", label: "foo" },
    { id: "a.test.ts", type: "test", label: "a.test.ts" },
    { id: "OWNER", type: "domain", label: "OWNER" },
  ],
  edges: [
    { id: "e1", source: "a.ts", target: "b.ts", type: "imports" },
    { id: "e2", source: "foo", target: "a.ts", type: "references" },
  ],
  queriedAt: new Date().toISOString(),
};

describe("buildContextPacket", () => {
  it("separa affectedFiles, symbols, tests e domainEntities", () => {
    const p = buildContextPacket(sampleResult);
    expect(p.affectedFiles).toEqual(["a.ts", "b.ts"]);
    expect(p.symbols).toEqual(["foo"]);
    expect(p.tests).toEqual(["a.test.ts"]);
    expect(p.domainEntities).toEqual(["OWNER"]);
    expect(p.dependencies).toEqual(["b.ts", "a.ts"]);
    expect(p.dependents).toEqual(["a.ts", "foo"]);
  });

  it("deduplica itens", () => {
    const result: GraphQueryResult = {
      nodes: [
        { id: "a.ts", type: "file", label: "a.ts" },
        { id: "a.ts", type: "file", label: "a.ts" },
      ],
      edges: [],
      queriedAt: new Date().toISOString(),
    };
    const p = buildContextPacket(result);
    expect(p.affectedFiles).toEqual(["a.ts"]);
  });

  it("inclui metadados de governança", () => {
    const p = buildContextPacket(sampleResult, {
      commit: "abc123",
      prunedItems: 3,
      task: { taskId: "P5-01" },
    });
    expect(p.commit).toBe("abc123");
    expect(p.pruned_items).toBe(3);
    expect(p.task).toEqual({ taskId: "P5-01" });
    expect(p.packet_id).toBeTruthy();
    expect(p.hash).toMatch(/^[0-9a-f]{12}$/);
    expect(Number.isNaN(Date.parse(p.created_at))).toBe(false);
  });

  it("fail-open: resultado vazio gera packet vazio sem lançar", () => {
    const p = buildContextPacket({
      nodes: [],
      edges: [],
      queriedAt: new Date().toISOString(),
    });
    expect(p.affectedFiles).toEqual([]);
    expect(p.token_estimate).toBe(0);
  });
});

describe("estimateTokens / packetHash", () => {
  it("estima ~4 chars por token", () => {
    expect(estimateTokens("abcd")).toBe(1);
    expect(estimateTokens("abcdefgh")).toBe(2);
  });

  it("hash é estável e curto", () => {
    expect(packetHash(["a", "b"])).toBe(packetHash(["a", "b"]));
    expect(packetHash(["a", "b"])).not.toBe(packetHash(["b", "a"]));
  });
});
