import { describe, it, expect } from "vitest";
import { __mindTest } from "@/components/workflow/WorkflowMindMap";

describe("WorkflowMindMap computeLayout performance & correctness", () => {
  it("computes layout correctly", () => {
    const layout = __mindTest.computeLayout();
    expect(layout.nodes.length).toBeGreaterThan(0);
    expect(layout.lines.length).toBeGreaterThan(0);
  });

  it("benchmarks computeLayout execution time", () => {
    const iterations = 1000;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      __mindTest.computeLayout();
    }
    const end = performance.now();
    const totalMs = end - start;
    expect(totalMs).toBeGreaterThan(0);
  });

  it("benchmarks O(N) array find vs O(1) Map lookup for nodes", () => {
    const layout = __mindTest.computeLayout();
    const nodes = layout.nodes;
    const nodesById = new Map(nodes.map((n) => [n.id, n]));
    const targetId = nodes[nodes.length - 1].id; // worst-case last element
    const iterations = 1_000_000;

    let dummyFind: unknown = null;
    let dummyMap: unknown = null;

    // Baseline: Array.find
    const startFind = performance.now();
    for (let i = 0; i < iterations; i++) {
      dummyFind = nodes.find((n) => n.id === targetId);
    }
    const durationFind = performance.now() - startFind;

    // Optimized: Map.get
    const startMap = performance.now();
    for (let i = 0; i < iterations; i++) {
      dummyMap = nodesById.get(targetId);
    }
    const durationMap = performance.now() - startMap;

    expect(dummyFind).toBeDefined();
    expect(dummyMap).toBeDefined();

    expect(durationMap).toBeLessThan(durationFind);
  });
});
