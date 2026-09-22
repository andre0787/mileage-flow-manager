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
    const avgMs = totalMs / iterations;
    console.log(`[BENCHMARK] computeLayout: ${iterations} iterations in ${totalMs.toFixed(2)}ms (avg: ${avgMs.toFixed(4)}ms/op)`);
    expect(totalMs).toBeGreaterThan(0);
  });
});
