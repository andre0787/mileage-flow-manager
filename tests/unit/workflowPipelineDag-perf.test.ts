import { describe, it, expect } from "vitest";
import type { TelemetryEnvelope } from "@/ai/telemetry/envelope";
import { PIPELINE, roleToNode } from "@/components/workflow/pipeline-definition";

describe("WorkflowPipelineDag Envelope Lookup Performance Benchmark", () => {
  it("compares extracting default node lookup outside loop vs repeated PIPELINE.find inside loop", () => {
    const NUM_ENVELOPES = 100000;
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

    // Baseline implementation: PIPELINE.find inside loop for every envelope fallback
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

    // Optimized implementation: default node extracted outside the loop
    const startOptimized = performance.now();
    for (let iter = 0; iter < ITERATIONS; iter++) {
      const map = new Map<string, Partial<TelemetryEnvelope>[]>();
      const defaultNode = PIPELINE.find((n) => n.id === "agents");
      for (const env of envelopes) {
        const node = roleToNode(env.agentRole ?? "") ?? defaultNode;
        if (!node) continue;
        const list = map.get(node.id) ?? [];
        list.push(env);
        map.set(node.id, list);
      }
    }
    const durationOptimized = performance.now() - startOptimized;

    expect(durationOptimized).toBeLessThan(durationBaseline);
  });
});
