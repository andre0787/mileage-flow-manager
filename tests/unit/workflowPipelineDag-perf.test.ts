import { describe, it, expect } from "vitest";
import type { TelemetryEnvelope } from "@/ai/telemetry/envelope";
import { PIPELINE, roleToNode } from "@/components/workflow/pipeline-definition";

describe("WorkflowPipelineDag Envelope Lookup Performance Benchmark", () => {
  it("verifies optimized envelope grouping correctness and performance behavior", () => {
    const NUM_ENVELOPES = 50000;
    const ITERATIONS = 10;

    // Create test envelopes with various roles (including unmapped/unknown roles that hit fallback)
    const envelopes: Partial<TelemetryEnvelope>[] = Array.from({ length: NUM_ENVELOPES }, (_, i) => {
      const roles = ["task", "classifier", "graph-scout", "architect", "unknown-role-1", "unknown-role-2", "tools", "final-validator", "result"];
      return {
        id: `env-${i}`,
        agentRole: roles[i % roles.length],
        eventType: "agent.completed",
      };
    });

    // Baseline map computation (PIPELINE.find in loop)
    const baselineMap = new Map<string, Partial<TelemetryEnvelope>[]>();
    for (const env of envelopes) {
      const node = roleToNode(env.agentRole ?? "") ?? PIPELINE.find((n) => n.id === "agents");
      if (!node) continue;
      const list = baselineMap.get(node.id) ?? [];
      list.push(env);
      baselineMap.set(node.id, list);
    }

    // Optimized map computation (defaultNode extracted outside loop)
    const optimizedMap = new Map<string, Partial<TelemetryEnvelope>[]>();
    const defaultNode = PIPELINE.find((n) => n.id === "agents");
    for (const env of envelopes) {
      const node = roleToNode(env.agentRole ?? "") ?? defaultNode;
      if (!node) continue;
      const list = optimizedMap.get(node.id) ?? [];
      list.push(env);
      optimizedMap.set(node.id, list);
    }

    // 1. Verify functional equivalence
    expect(optimizedMap.size).toBe(baselineMap.size);
    for (const [key, val] of baselineMap.entries()) {
      expect(optimizedMap.get(key)?.length).toBe(val.length);
    }

    // 2. Performance benchmark with warmup
    // Warmup JIT compiler
    for (let iter = 0; iter < 2; iter++) {
      const map = new Map<string, Partial<TelemetryEnvelope>[]>();
      for (const env of envelopes) {
        const node = roleToNode(env.agentRole ?? "") ?? defaultNode;
        if (!node) continue;
        const list = map.get(node.id) ?? [];
        list.push(env);
        map.set(node.id, list);
      }
    }

    const startBaseline = performance.now();
    for (let iter = 0; iter < ITERATIONS; iter++) {
      const map = new Map<string, Partial<TelemetryEnvelope>[]>();
      for (const env of envelopes) {
        const node = roleToNode(env.agentRole ?? "") ?? PIPELINE.find((n) => n.id === "agents");
        if (!node) continue;
        const list = map.get(node.id) ?? [];
        list.push(env);
        map.set(node.id, list);
      }
    }
    const durationBaseline = performance.now() - startBaseline;

    const startOptimized = performance.now();
    for (let iter = 0; iter < ITERATIONS; iter++) {
      const map = new Map<string, Partial<TelemetryEnvelope>[]>();
      const defNode = PIPELINE.find((n) => n.id === "agents");
      for (const env of envelopes) {
        const node = roleToNode(env.agentRole ?? "") ?? defNode;
        if (!node) continue;
        const list = map.get(node.id) ?? [];
        list.push(env);
        map.set(node.id, list);
      }
    }
    const durationOptimized = performance.now() - startOptimized;

    // Assert that optimized duration is reasonable (not significantly slower than baseline)
    // allowing for CI timer variance without failing build flakily
    expect(durationOptimized).toBeLessThanOrEqual(durationBaseline * 1.2);
  });
});
