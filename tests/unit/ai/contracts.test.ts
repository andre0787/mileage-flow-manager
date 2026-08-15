import { describe, expect, it } from "vitest";
import { defaultCapabilities, satisfiesCapabilities } from "@/ai/core/agent-contract";
import { modelSatisfies, rankModels, type ModelCapabilities } from "@/ai/core/model-contract";
import { conflictsWith, normalizeTask } from "@/ai/core/task-contract";
import {
  defaultBudget,
  groupSteps,
  serializePlan,
  type ExecutionPlan,
} from "@/ai/core/execution-plan";

describe("agent-contract", () => {
  it("defaultCapabilities degrada para tudo falso", () => {
    const caps = defaultCapabilities();
    expect(caps.toolCalling).toBe(false);
    expect(caps.parallelAgents).toBe(false);
    expect(caps.roles).toEqual([]);
  });

  it("satisfiesCapabilities respeita a lista requerida", () => {
    const caps = defaultCapabilities();
    expect(satisfiesCapabilities(caps, [])).toBe(true);
    expect(satisfiesCapabilities(caps, ["toolCalling"])).toBe(false);
    const full = { ...caps, toolCalling: true, subagents: true };
    expect(satisfiesCapabilities(full, ["toolCalling", "subagents"])).toBe(true);
    expect(satisfiesCapabilities(full, ["toolCalling", "streaming"])).toBe(false);
  });
});

describe("model-contract", () => {
  const cheap: ModelCapabilities = {
    model: "cheap",
    contextWindow: 32000,
    toolCalling: true,
    structuredOutput: true,
    reasoning: "low",
    coding: "medium",
    speed: "fast",
    costTier: "low",
  };
  const strong: ModelCapabilities = {
    model: "strong",
    contextWindow: 128000,
    toolCalling: true,
    structuredOutput: true,
    reasoning: "high",
    coding: "high",
    speed: "slow",
    costTier: "high",
  };

  it("modelSatisfies valida capacidades", () => {
    expect(modelSatisfies(cheap, { toolCalling: true })).toBe(true);
    expect(modelSatisfies(cheap, { minReasoning: "high" })).toBe(false);
    expect(modelSatisfies(strong, { minReasoning: "high", minCoding: "high" })).toBe(true);
  });

  it("rankModels preserva o contract e ordena por custo", () => {
    const ranked = rankModels([strong, cheap], { toolCalling: true });
    expect(ranked.map((m) => m.model)).toEqual(["cheap", "strong"]);
    const onlyStrong = rankModels([strong, cheap], { minReasoning: "high" });
    expect(onlyStrong.map((m) => m.model)).toEqual(["strong"]);
  });
});

describe("task-contract", () => {
  it("conflictsWith detecta sobreposição de writeScope", () => {
    const a = normalizeTask({ taskId: "A", writeScope: ["src/lib/x.ts", "src/lib/y.ts"] });
    const b = normalizeTask({ taskId: "B", writeScope: ["src/lib/y.ts"] });
    const c = normalizeTask({ taskId: "C", writeScope: ["src/lib/z.ts"] });
    expect(conflictsWith(a, b)).toBe(true);
    expect(conflictsWith(a, c)).toBe(false);
  });

  it("normalizeTask preenche defaults seguros", () => {
    const t = normalizeTask({});
    expect(t.taskId).toBe("TASK-UNNAMED");
    expect(t.risk).toBe("medium");
    expect(t.parallelizable).toBe(false);
    expect(t.writeScope).toEqual([]);
  });
});

describe("execution-plan", () => {
  it("defaultBudget segue o SDD seção 18", () => {
    const b = defaultBudget();
    expect(b.maxAgents).toBe(8);
    expect(b.maxParallel).toBe(4);
    expect(b.maxCost).toBe(2.0);
  });

  it("groupSteps agrupa por parallelGroup em ordem", () => {
    const plan: ExecutionPlan = {
      planId: "p1",
      taskId: "t1",
      agent: "pi",
      model: "m",
      createdAt: new Date().toISOString(),
      budget: defaultBudget(),
      steps: [
        { id: "a", role: "scout", parallelGroup: 1 },
        { id: "b", role: "scout", parallelGroup: 1 },
        { id: "c", role: "architect", parallelGroup: 2, dependsOn: ["a", "b"] },
      ],
    };
    const groups = groupSteps(plan.steps);
    expect(groups).toHaveLength(2);
    expect(groups[0].map((s) => s.id)).toEqual(["a", "b"]);
    expect(groups[1][0].id).toBe("c");
  });

  it("serializePlan degrada para sequencial", () => {
    const plan: ExecutionPlan = {
      planId: "p1",
      taskId: "t1",
      agent: "generic",
      model: "m",
      createdAt: new Date().toISOString(),
      budget: defaultBudget(),
      steps: [
        { id: "a", role: "scout" },
        { id: "b", role: "architect" },
      ],
    };
    const serial = serializePlan(plan);
    expect(serial.steps[0].parallelGroup).toBe(1);
    expect(serial.steps[1].parallelGroup).toBe(2);
    expect(serial.steps[1].dependsOn).toEqual(["a"]);
  });
});
