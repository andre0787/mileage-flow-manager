import { describe, expect, it } from "vitest";
import { emptyGraphResult, parseGraphEdges, parseGraphNodes } from "@/ai/core/graph-types";

describe("parseGraphNodes", () => {
  it("retorna [] para entrada inválida (fail-open)", () => {
    expect(parseGraphNodes(null)).toEqual([]);
    expect(parseGraphNodes("foo")).toEqual([]);
    expect(parseGraphNodes(undefined)).toEqual([]);
  });

  it("aceita strings simples como file nodes", () => {
    const nodes = parseGraphNodes(["src/lib/a.ts", ""]);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({ id: "src/lib/a.ts", type: "file", label: "src/lib/a.ts" });
  });

  it("aceita objetos com id/name/type/label", () => {
    const nodes = parseGraphNodes([
      { id: "sym1", type: "symbol", label: "foo" },
      { name: "bar", type: "test" },
      { id: "", type: "symbol" },
    ]);
    expect(nodes).toHaveLength(2);
    expect(nodes[0]).toMatchObject({ id: "sym1", type: "symbol", label: "foo" });
    expect(nodes[1]).toMatchObject({ id: "bar", type: "test", label: "bar" });
  });
});

describe("parseGraphEdges", () => {
  it("retorna [] para entrada inválida", () => {
    expect(parseGraphEdges(null)).toEqual([]);
    expect(parseGraphEdges([{ source: "a" }])).toEqual([]); // sem target
  });

  it("normaliza source/target com fallback from/to", () => {
    const edges = parseGraphEdges([
      { source: "a", target: "b", type: "imports" },
      { from: "x", to: "y" },
    ]);
    expect(edges).toHaveLength(2);
    expect(edges[0]).toMatchObject({ source: "a", target: "b", type: "imports" });
    expect(edges[1]).toMatchObject({ source: "x", target: "y", type: "depends-on" });
  });
});

describe("emptyGraphResult", () => {
  it("gera resultado válido com queriedAt preenchido", () => {
    const r = emptyGraphResult("v1");
    expect(r.nodes).toEqual([]);
    expect(r.edges).toEqual([]);
    expect(r.graphVersion).toBe("v1");
    expect(r.queriedAt).toBeTruthy();
    expect(Number.isNaN(Date.parse(r.queriedAt))).toBe(false);
  });
});
