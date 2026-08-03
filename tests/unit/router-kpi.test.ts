import { describe, expect, it } from "vitest";
import { computeRouterKPI } from "../../scripts/lib/router-kpi.mjs";

const resolved = (taskId, model = "model/primary", fallbacks = ["model/fallback"]) => ({
  type: "llm.route.resolved",
  taskId,
  model,
  fallbackModels: fallbacks,
  timestamp: "2026-08-01T10:00:00Z",
  skills: [],
});

const completed = (taskId, model, status = "completed", extra = {}) => ({
  type: "llm.route.completed",
  taskId,
  model,
  attempt: 1,
  status,
  timestamp: "2026-08-01T10:05:00Z",
  ...extra,
});

describe("router-kpi computeRouterKPI", () => {
  it("conta primário completado sem fallback", () => {
    const result = computeRouterKPI([
      resolved("t1"),
      completed("t1", "model/primary", "completed", {
        resolvedModel: "model/primary",
        fallbackUsed: false,
      }),
    ]);

    expect(result).toMatchObject({
      resolved: 1,
      completed: 1,
      failed: 0,
      unobserved: 0,
      fallbackUsed: 0,
      completionRate: 100,
      fallbackRate: 0,
    });
  });

  it("conta primário falho seguido de fallback completado", () => {
    const result = computeRouterKPI([
      resolved("t1"),
      completed("t1", "model/primary", "failed", { attempt: 1 }),
      completed("t1", "model/fallback", "completed", {
        attempt: 2,
        resolvedModel: "model/primary",
        fallbackUsed: true,
      }),
    ]);

    expect(result).toMatchObject({
      resolved: 1,
      completed: 1,
      failed: 0,
      unobserved: 0,
      fallbackUsed: 1,
      completionRate: 100,
      fallbackRate: 100,
    });
  });

  it("conta falha terminal sem conclusão de sucesso", () => {
    const result = computeRouterKPI([
      resolved("t1"),
      completed("t1", "model/primary", "failed", { attempt: 1 }),
    ]);

    expect(result).toMatchObject({
      resolved: 1,
      completed: 0,
      failed: 1,
      unobserved: 0,
      completionRate: 0,
    });
  });

  it("conta resolução sem conclusão como unobserved", () => {
    const result = computeRouterKPI([resolved("unseen")]);

    expect(result.unobserved).toBe(1);
    expect(result.completionRate).toBe(0);
  });

  it("deduplica tentativas do mesmo taskId usando a última terminal", () => {
    const result = computeRouterKPI([
      resolved("t1"),
      completed("t1", "model/primary", "failed", { attempt: 1 }),
      completed("t1", "model/primary", "failed", { attempt: 2 }),
      completed("t1", "model/fallback", "completed", {
        attempt: 3,
        resolvedModel: "model/primary",
        fallbackUsed: true,
      }),
    ]);

    expect(result).toMatchObject({ resolved: 1, completed: 1, failed: 0 });
  });

  it("agrega modelos efetivos e skills por modelo de forma determinística", () => {
    const result = computeRouterKPI([
      resolved("t1", "model/a", ["model/b"]),
      completed("t1", "model/a", "completed", {
        resolvedModel: "model/a",
        fallbackUsed: false,
        skills: ["systematic-debugging"],
      }),
      resolved("t2", "model/a", ["model/b"]),
      completed("t2", "model/b", "completed", {
        attempt: 2,
        resolvedModel: "model/a",
        fallbackUsed: true,
        skills: ["systematic-debugging", "test-driven-development"],
      }),
    ]);

    expect(result.models).toEqual(["model/a", "model/b"]);
    expect(result.skillsByModel).toEqual([
      { skill: "systematic-debugging", model: "model/a" },
      { skill: "systematic-debugging", model: "model/b" },
      { skill: "test-driven-development", model: "model/b" },
    ]);
  });

  it("retorna zeros sem eventos", () => {
    expect(computeRouterKPI([])).toMatchObject({
      resolved: 0,
      completed: 0,
      failed: 0,
      unobserved: 0,
      fallbackUsed: 0,
      completionRate: null,
      fallbackRate: null,
      models: [],
      skillsByModel: [],
    });
  });
});