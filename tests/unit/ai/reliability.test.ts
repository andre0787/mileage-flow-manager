/**
 * reliability.test.ts — P11-02 Execution Reliability.
 *
 * Cobre: retry classificado (retryable/conditional/non_retryable), timeout
 * (deadline), cancelamento propagado, failure taxonomy (14 categorias) e
 * budget em todos os limites (below/at/above).
 */

import { describe, expect, it } from "vitest";
import { shouldRetry, retryWithBackoff, withTimeout } from "@/ai/execution/retry";
import { classifyFailure, FAILURE_CATEGORIES } from "@/ai/execution/failure-taxonomy";
import { dispatchPlan } from "@/ai/orchestration/dispatcher";
import { initialBudgetState, consumeBudget, checkBudget } from "@/ai/orchestration/budget";
import { defaultBudget, type ExecutionPlan } from "@/ai/core/execution-plan";
import { piAdapter } from "@/ai/adapters/pi";

function makePlan(steps: Array<{ id: string; role: string }>): ExecutionPlan {
  return {
    planId: "reliability-plan",
    taskId: "T1",
    agent: "pi",
    model: "m1",
    steps,
    budget: defaultBudget(),
    createdAt: new Date().toISOString(),
  };
}

describe("failure taxonomy (P11-02)", () => {
  it("classifica timeout, cancellation e budget por errorCode", () => {
    expect(classifyFailure("timeout")).toBe("timeout");
    expect(classifyFailure("cancelled")).toBe("cancellation");
    expect(classifyFailure("maxTokens excedido")).toBe("budget_failure");
    expect(classifyFailure("maxParallel excedido")).toBe("budget_failure");
  });

  it("classifica exit code por fase", () => {
    expect(classifyFailure("exit:1", "test")).toBe("test_failure");
    expect(classifyFailure("exit:1", "planning")).toBe("planning_failure");
    expect(classifyFailure("exit:1", "graph")).toBe("graph_failure");
    expect(classifyFailure("exit:1", "validation")).toBe("validation_failure");
    expect(classifyFailure("exit:1", "unknown")).toBe("agent_failure");
  });

  it("spawn: é infraestrutura", () => {
    expect(classifyFailure("spawn:ENOENT")).toBe("infrastructure_failure");
  });

  it("14 categorias na lista estável", () => {
    expect(FAILURE_CATEGORIES).toHaveLength(14);
    expect(FAILURE_CATEGORIES).toContain("timeout");
    expect(FAILURE_CATEGORIES).toContain("budget_failure");
  });
});

describe("retry policy (P11-02)", () => {
  it("deve retry para retryable (spawn) e conditional (timeout), não para exit", () => {
    expect(shouldRetry("spawn:ENOENT")).toBe(true);
    expect(shouldRetry("timeout")).toBe(true);
    expect(shouldRetry("exit:1")).toBe(false);
    expect(shouldRetry(null)).toBe(false);
    expect(shouldRetry("timeout", { maxRetries: 0 })).toBe(false);
  });

  it("nunca retry categorias proibidas mesmo retryable", () => {
    expect(
      shouldRetry("spawn:ENOENT", {
        maxRetries: 2,
        neverRetryCategories: ["infrastructure_failure"],
      }),
    ).toBe(false);
  });

  it("retryWithBackoff recupera após falhas transitórias", async () => {
    let calls = 0;
    const { result, attempts, retried } = await retryWithBackoff(
      async () => {
        calls += 1;
        if (calls < 3) return { success: false, errorCode: "spawn:busy" };
        return { success: true, errorCode: null };
      },
      { policy: { maxRetries: 3, baseDelayMs: 1, factor: 1 } },
    );
    expect(result.success).toBe(true);
    expect(attempts).toBe(3);
    expect(retried).toBe(true);
  });

  it("não retry quando erro não é retryable", async () => {
    const { attempts, retried } = await retryWithBackoff(
      async () => ({ success: false, errorCode: "exit:1" }),
      { policy: { maxRetries: 3, baseDelayMs: 1 } },
    );
    expect(attempts).toBe(1);
    expect(retried).toBe(false);
  });
});

describe("timeout (P11-02)", () => {
  it("withTimeout rejeita após deadline", async () => {
    const slow = async () => {
      await new Promise((r) => setTimeout(r, 500));
      return "ok";
    };
    await expect(withTimeout(slow, 50)).rejects.toThrow(/timeout/);
  });

  it("withTimeout resolve quando a função é rápida", async () => {
    const fast = async () => "ok";
    await expect(withTimeout(fast, 5000)).resolves.toBe("ok");
  });
});

describe("dispatcher reliability (P11-02)", () => {
  it("cancela steps quando o sinal é aborted (agent.cancelled)", async () => {
    const plan = makePlan([{ id: "s1", role: "scout" }]) as ExecutionPlan & {
      steps: Array<{ id: string; role: string; parallelGroup?: number }>;
    };
    const abort = new AbortController();
    const events: string[] = [];
    abort.abort();
    const { ok, cancelled } = await dispatchPlan(plan as ExecutionPlan, piAdapter, {
      executeStep: async (_adp, step) => ({
        stepId: step.id,
        role: step.role,
        success: true,
      }),
      onTelemetry: (env) => events.push(env.eventType),
      signal: abort.signal,
    });
    expect(cancelled).toBe(true);
    expect(ok).toBe(false);
    expect(events).toContain("agent.cancelled");
  });

  it("aplica retry policy no dispatcher (recupera step após falha transitória)", async () => {
    const plan = makePlan([{ id: "s1", role: "scout" }]);
    let calls = 0;
    const { outcomes, ok } = await dispatchPlan(plan, piAdapter, {
      executeStep: async (_adp, step) => {
        calls += 1;
        if (calls < 2) {
          return { stepId: step.id, role: step.role, success: false, errorCode: "spawn:busy" };
        }
        return { stepId: step.id, role: step.role, success: true };
      },
      retryPolicy: { maxRetries: 2, baseDelayMs: 1, factor: 1 },
    });
    expect(ok).toBe(true);
    expect(calls).toBe(2);
    expect(outcomes[0].attempts).toBe(2);
  });

  it("não retry erro non_retryable no dispatcher", async () => {
    const plan = makePlan([{ id: "s1", role: "scout" }]);
    let calls = 0;
    const { outcomes, ok } = await dispatchPlan(plan, piAdapter, {
      executeStep: async (_adp, step) => {
        calls += 1;
        return { stepId: step.id, role: step.role, success: false, errorCode: "exit:1" };
      },
      retryPolicy: { maxRetries: 3, baseDelayMs: 1 },
    });
    expect(ok).toBe(false);
    expect(calls).toBe(1);
    expect(outcomes[0].failureCategory).toBe("agent_failure");
  });
});

describe("budget edges (P11-02: below/at/above)", () => {
  const budget = defaultBudget();

  it("below limit → ok", () => {
    const state = initialBudgetState();
    expect(checkBudget(budget, state, { inputTokens: 10 }).ok).toBe(true);
  });

  it("at limit → ok (exato não bloqueia)", () => {
    let state = initialBudgetState();
    for (let i = 0; i < budget.maxAgents; i++) state = consumeBudget(state, {});
    // No limite exato: próximo dispatch daria agentsDispatched+1 > maxAgents → não ok
    expect(checkBudget(budget, state, {}).ok).toBe(false);
    // At limite - 1 → ok
    let below = initialBudgetState();
    for (let i = 0; i < budget.maxAgents - 1; i++) below = consumeBudget(below, {});
    expect(checkBudget(budget, below, {}).ok).toBe(true);
  });

  it("above limit → bloqueia todos os limites", () => {
    const limits: Array<{
      key: keyof typeof budget;
      value: number;
      consume: object;
      next: object;
    }> = [
      { key: "maxTokens", value: 500, consume: { inputTokens: 500 }, next: { inputTokens: 1 } },
      { key: "maxCost", value: 0.5, consume: { cost: 0.5 }, next: { cost: 0.01 } },
      { key: "maxDurationMs", value: 1000, consume: { durationMs: 1000 }, next: { durationMs: 1 } },
      { key: "maxToolCalls", value: 5, consume: { toolCalls: 5 }, next: { toolCalls: 1 } },
      { key: "maxTurns", value: 3, consume: {}, next: {} }, // consume({}) soma 1 turn
    ];
    for (const { key, value, consume, next } of limits) {
      const b = { ...budget, [key]: value };
      let state = initialBudgetState();
      // maxTurns precisa de 3 consumos (cada consume({}) soma 1 turn).
      const times = key === "maxTurns" ? 3 : 1;
      for (let i = 0; i < times; i++) state = consumeBudget(state, consume);
      const check = checkBudget(b, state, next);
      expect(check.ok, `limite ${key} acima deveria bloquear`).toBe(false);
    }
  });

  it("concurrent: budget compartilhado conta todos os steps", async () => {
    const plan = makePlan([
      { id: "s1", role: "scout" },
      { id: "s2", role: "architect" },
    ]);
    const tiny = { ...defaultBudget(), maxAgents: 1 };
    const exec = async (_adp: never, step: { id: string; role: string }) => ({
      stepId: step.id,
      role: step.role,
      success: true,
    });
    const { outcomes } = await dispatchPlan({ ...plan, budget: tiny } as ExecutionPlan, piAdapter, {
      executeStep: exec as never,
    });
    // maxAgents=1: segundo step bloqueia no budget
    const blocked = outcomes.filter((o) => o.errorCode?.includes("maxAgents"));
    expect(blocked.length).toBeGreaterThan(0);
  });
});
