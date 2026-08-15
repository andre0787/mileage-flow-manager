import { describe, expect, it } from "vitest";
import {
  clearAdapters,
  listAdapters,
  registerAdapter,
  resolveAdapter,
} from "@/ai/adapters/registry";
import { genericAdapter, genericCapabilities, GENERIC_ADAPTER_ID } from "@/ai/adapters/generic";
import { piAdapter, piCapabilities, PI_ADAPTER_ID } from "@/ai/adapters/pi";
import { planExecution, pickAdapter, DEFAULT_ROLES } from "@/ai/orchestration/planner";
import { schedulePlan } from "@/ai/orchestration/scheduler";
import { findCycle, resolveOrder } from "@/ai/orchestration/dependency-resolver";
import { checkBudget, consumeBudget, initialBudgetState } from "@/ai/orchestration/budget";
import { dispatchPlan } from "@/ai/orchestration/dispatcher";
import { defaultBudget, type ExecutionPlan, type ExecutionStep } from "@/ai/core/execution-plan";
import { normalizeTask } from "@/ai/core/task-contract";
import type { AgentAdapter } from "@/ai/core/agent-contract";

function makePlan(steps: ExecutionStep[]): ExecutionPlan {
  return {
    planId: "test-plan",
    taskId: "T1",
    agent: "pi",
    model: "m1",
    steps,
    budget: defaultBudget(),
    createdAt: new Date().toISOString(),
  };
}

describe("adapter registry", () => {
  it("registra e resolve por id (core não importa adapter concreto)", () => {
    clearAdapters();
    registerAdapter(piAdapter);
    expect(resolveAdapter(PI_ADAPTER_ID)?.id).toBe("pi");
    expect(resolveAdapter("codex")).toBeUndefined();
    expect(listAdapters().map((a) => a.id)).toContain("pi");
  });

  it("capabilities do pi e do generic seguem o SDD §9", () => {
    expect(piCapabilities().subagents).toBe(true);
    expect(piCapabilities().parallelAgents).toBe(true);
    expect(genericCapabilities().subagents).toBe(false);
    expect(genericCapabilities().structuredOutput).toBe(false);
  });
});

describe("planner", () => {
  it("cria plano com adapter compatível (capability-driven)", () => {
    const task = normalizeTask({
      taskId: "P6-01",
      intent: "implement orchestrator",
      requiredCapabilities: ["toolCalling", "structuredOutput"],
    });
    const out = planExecution({ task, adapters: [piAdapter] });
    expect(out.plan?.agent).toBe("pi");
    expect(out.plan?.steps.map((s) => s.role)).toEqual(DEFAULT_ROLES.map((r) => r.role));
  });

  it("degrava: adapter sem capacidade → erro descritivo", () => {
    const task = normalizeTask({
      taskId: "P6-02",
      intent: "x",
      requiredCapabilities: ["subagents", "streaming"],
    });
    const out = planExecution({ task, adapters: [genericAdapter] });
    expect(out.error).toContain("Nenhum adapter");
    expect(out.plan).toBeUndefined();
  });

  it("pickAdapter escolhe o primeiro que satisfaz", () => {
    const picked = pickAdapter([genericAdapter, piAdapter], ["subagents"]);
    expect(picked?.id).toBe("pi");
  });
});

describe("dependency-resolver", () => {
  it("resolve ordem topológica respeitando dependsOn", () => {
    const steps: ExecutionStep[] = [
      { id: "implementer", role: "implementer", dependsOn: ["architect"] },
      { id: "architect", role: "architect", dependsOn: ["scout"] },
      { id: "scout", role: "graph-scout" },
    ];
    const { order } = resolveOrder(steps);
    expect(order.map((s) => s.id)).toEqual(["scout", "architect", "implementer"]);
  });

  it("detecta ciclo", () => {
    const steps: ExecutionStep[] = [
      { id: "a", role: "a", dependsOn: ["b"] },
      { id: "b", role: "b", dependsOn: ["a"] },
    ];
    const { cycle } = resolveOrder(steps);
    expect(cycle).toBeDefined();
    expect(findCycle(steps)).toContain("a");
  });
});

describe("scheduler", () => {
  it("agrupa por parallelGroup quando há paralelismo", () => {
    const plan = makePlan([
      { id: "s1", role: "scout", parallelGroup: 1 },
      { id: "s2", role: "scout", parallelGroup: 1 },
      { id: "a1", role: "architect", parallelGroup: 2, dependsOn: ["s1", "s2"] },
    ]);
    const { batches, serial } = schedulePlan(plan, { supportsParallel: true });
    expect(serial).toBe(false);
    expect(batches).toHaveLength(2);
    expect(batches[0].map((s) => s.id)).toEqual(["s1", "s2"]);
  });

  it("degrava para serial sem paralelismo (SDD §14)", () => {
    const plan = makePlan([
      { id: "s1", role: "scout", parallelGroup: 1 },
      { id: "a1", role: "architect", parallelGroup: 2, dependsOn: ["s1"] },
    ]);
    const { batches, serial } = schedulePlan(plan, { supportsParallel: false });
    expect(serial).toBe(true);
    expect(batches.every((b) => b.length === 1)).toBe(true);
  });

  it("ignora steps skipped (papel que o adapter não desempenha)", () => {
    const plan = makePlan([
      { id: "s1", role: "scout", skipped: true },
      { id: "a1", role: "architect", parallelGroup: 1 },
    ]);
    const { batches } = schedulePlan(plan, { supportsParallel: true });
    expect(batches.flat().map((s) => s.id)).toEqual(["a1"]);
  });
});

describe("budget", () => {
  it("bloqueia quando maxAgents é excedido", () => {
    const budget = defaultBudget();
    let state = initialBudgetState();
    for (let i = 0; i < budget.maxAgents; i++) state = consumeBudget(state, {});
    const check = checkBudget(budget, state, {});
    expect(check.ok).toBe(false);
    expect(check.reason).toContain("maxAgents");
  });

  it("bloqueia quando maxTokens é excedido", () => {
    const budget = { ...defaultBudget(), maxTokens: 1000 };
    const state = consumeBudget(initialBudgetState(), { inputTokens: 900 });
    const check = checkBudget(budget, state, { inputTokens: 200 });
    expect(check.ok).toBe(false);
    expect(check.reason).toContain("maxTokens");
  });

  it("permite dentro do limite", () => {
    const check = checkBudget(defaultBudget(), initialBudgetState(), { inputTokens: 10 });
    expect(check.ok).toBe(true);
  });

  it("bloqueia quando maxTurns é excedido", () => {
    const budget = { ...defaultBudget(), maxTurns: 2 };
    const state = consumeBudget(consumeBudget(initialBudgetState(), {}), {});
    const check = checkBudget(budget, state, {});
    expect(check.ok).toBe(false);
    expect(check.reason).toContain("maxTurns");
  });

  it("maxTurns default (60) não bloqueia sessões normais", () => {
    const budget = defaultBudget();
    const state = consumeBudget(initialBudgetState(), {});
    const check = checkBudget(budget, state, {});
    expect(check.ok).toBe(true);
  });
});

describe("dispatcher", () => {
  it("executa steps via executeStep injetável e acumula outcomes", async () => {
    const plan = makePlan([
      { id: "s1", role: "scout", parallelGroup: 1 },
      { id: "a1", role: "architect", parallelGroup: 2, dependsOn: ["s1"] },
    ]);
    const adapter: AgentAdapter = {
      id: "mock",
      capabilities: () => piCapabilities(),
      execute: async () => ({ success: true }),
    };
    const { outcomes, ok } = await dispatchPlan(plan, adapter, {
      executeStep: async (_adp, step) => ({
        stepId: step.id,
        role: step.role,
        success: true,
        inputTokens: 100,
        durationMs: 10,
      }),
    });
    expect(ok).toBe(true);
    expect(outcomes.map((o) => o.stepId)).toEqual(["s1", "a1"]);
    expect(outcomes[0].inputTokens).toBe(100);
  });

  it("falha (ok=false) quando um step falha e maxFailures=0", async () => {
    const plan = makePlan([{ id: "s1", role: "scout", parallelGroup: 1 }]);
    const adapter: AgentAdapter = {
      id: "mock",
      capabilities: () => piCapabilities(),
      execute: async () => ({ success: true }),
    };
    const { ok, outcomes } = await dispatchPlan(plan, adapter, {
      executeStep: async (_adp, step) => ({
        stepId: step.id,
        role: step.role,
        success: false,
        errorCode: "boom",
      }),
    });
    expect(ok).toBe(false);
    expect(outcomes[0].errorCode).toBe("boom");
  });

  it("emite telemetry envelope para eventos §19", async () => {
    const plan = makePlan([{ id: "s1", role: "scout", parallelGroup: 1 }]);
    const adapter: AgentAdapter = {
      id: "mock",
      capabilities: () => piCapabilities(),
      execute: async () => ({ success: true }),
    };
    const events: string[] = [];
    const { ok } = await dispatchPlan(plan, adapter, {
      executeStep: async (_adp, step) => ({ stepId: step.id, role: step.role, success: true }),
      onTelemetry: (env) => events.push(env.eventType),
    });
    expect(ok).toBe(true);
    expect(events).toContain("execution.started");
    expect(events).toContain("agent.dispatched");
    expect(events).toContain("agent.completed");
    expect(events).toContain("execution.completed");
  });

  it("respeita o adapter generic (degradação serial)", async () => {
    const plan = makePlan([
      { id: "s1", role: "scout", parallelGroup: 1 },
      { id: "a1", role: "architect", parallelGroup: 2, dependsOn: ["s1"] },
    ]);
    const { outcomes, ok } = await dispatchPlan(plan, genericAdapter, {
      executeStep: async (_adp, step) => ({ stepId: step.id, role: step.role, success: true }),
    });
    expect(ok).toBe(true);
    expect(outcomes).toHaveLength(2);
  });
});

describe("GENERIC_ADAPTER_ID export", () => {
  it("expõe o id do adapter genérico", () => {
    expect(GENERIC_ADAPTER_ID).toBe("generic-cli");
  });
});
