/**
 * kpi-report.test.ts — Testes do script de KPIs de processo.
 *
 * Uso: npx vitest run tests/kpi-report.test.ts -v
 */

import { describe, it, expect } from "vitest";
import {
  parseEvents,
  filterByMonth,
  computeMonthlyKPI,
  parseReportsForMonth,
  computeCycleTime,
} from "../scripts/kpi-report.mjs";
import { validateProcessEvent } from "../scripts/lib/process-events.mjs";

describe("parseEvents", () => {
  it("parses JSONL lines (formato plano do event-log)", () => {
    const input = `{"type":"pre-pr","timestamp":"2026-07-01T10:00:00Z","description":"pre-pr PASS","errors":0,"branch":"feat/a"}\n{"type":"pre-pr","timestamp":"2026-07-02T10:00:00Z","description":"pre-pr FAIL","errors":5,"branch":"feat/b"}`;
    const result = parseEvents(input);
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe("pre-pr");
    expect(result[0].description).toBe("pre-pr PASS");
    expect(result[0].errors).toBe(0);
    expect(result[1].errors).toBe(5);
  });

  it("handles empty input", () => {
    expect(parseEvents("")).toEqual([]);
  });

  it("skips empty lines", () => {
    const input = `{"type":"pre-pr","timestamp":"2026-07-01T10:00:00Z","errors":0}\n\n{"type":"session:start","timestamp":"2026-07-02T10:00:00Z","branch":"feat/a"}`;
    const result = parseEvents(input);
    expect(result).toHaveLength(2);
  });

  it("aceita evento router válido pelo validador compartilhado", () => {
    expect(
      validateProcessEvent({
        type: "llm.route.resolved",
        timestamp: "2026-07-01T10:00:00Z",
        taskId: "task-1",
        category: "feature",
        capability: null,
        profile: "coding",
        model: "model/primary",
        fallbackModels: [],
        source: "category-default",
        retrySafety: "may-write",
        configVersion: 1,
        skills: [],
      }),
    ).toEqual([]);
  });
});

describe("filterByMonth", () => {
  const events = [
    { type: "pre-pr", timestamp: "2026-07-15T10:00:00Z", description: "pre-pr PASS", errors: 0, branch: "feat/a" },
    { type: "pre-pr", timestamp: "2026-06-15T10:00:00Z", description: "pre-pr FAIL", errors: 5, branch: "feat/b" },
    { type: "session:start", timestamp: "2026-07-01T08:00:00Z", branch: "feat/c" },
  ];

  it("filters by specific year and month", () => {
    const july = filterByMonth(events, 2026, 7);
    expect(july).toHaveLength(2);
    expect(july.every((e) => e.timestamp.startsWith("2026-07"))).toBe(true);
  });

  it("returns empty for month with no events", () => {
    expect(filterByMonth(events, 2025, 1)).toEqual([]);
  });
});

describe("computeMonthlyKPI", () => {
  it("computes pass rate correctly from flat pre-pr events", () => {
    const events = [
      { type: "pre-pr", timestamp: "2026-07-01T10:00:00Z", description: "pre-pr PASS", errors: 0, branch: "feat/a" },
      { type: "pre-pr", timestamp: "2026-07-02T10:00:00Z", description: "pre-pr PASS", errors: 0, branch: "feat/b" },
      { type: "pre-pr", timestamp: "2026-07-03T10:00:00Z", description: "pre-pr FAIL", errors: 5, branch: "feat/c" },
      { type: "gate", timestamp: "2026-07-03T11:00:00Z", gate: "intent" },
      { type: "gate", timestamp: "2026-07-03T12:00:00Z", gate: "twins" },
    ];

    const result = computeMonthlyKPI(events, "2026-07");
    expect(result.month).toBe("2026-07");
    expect(result.prePrPassRate).toBe(66.7);
    expect(result.prePrTotal).toBe(3);
    expect(result.prePrPass).toBe(2);
    expect(result.prePrFail).toBe(1);
    expect(result.gateActivations.intent).toBe(1);
    expect(result.gateActivations.twins).toBe(1);
    expect(result.gateActivations.auth).toBe(0);
    expect(result.branchesMerged).toBe(2);
  });

  it("separa gate:blocked (bloqueio) de rule:fail (violação) em gateBlockedByRule", () => {
    const events = [
      { type: "rule:fail", timestamp: "2026-07-04T10:00:00Z", rule: "rule-10-clean" },
      { type: "gate:blocked", timestamp: "2026-07-05T10:00:00Z", rule: "rule-27-council-veredict", gate: "council" },
      { type: "gate:blocked", timestamp: "2026-07-06T10:00:00Z", rule: "rule-27-council-veredict", gate: "council" },
      { type: "gate:blocked", timestamp: "2026-07-07T10:00:00Z", rule: "rule-33-intent-gate", gate: "intent" },
    ];
    const result = computeMonthlyKPI(events, "2026-07");
    // Violação (rule:fail) não contamina gateBlockedByRule
    expect(result.gateBlockedByRule["rule-27-council-veredict"]).toBe(2);
    expect(result.gateBlockedByRule["rule-33-intent-gate"]).toBe(1);
    expect(result.gateBlockedByRule["rule-10-clean"]).toBeUndefined();
    // E gate:blocked não contamina topViolations (rule:fail)
    expect(result.topViolations.find((v) => v.rule === "rule-27-council-veredict")).toBeUndefined();
    expect(result.topViolations[0].rule).toBe("rule-10-clean");
  });

  it("returns zero-filled KPI for empty event list", () => {
    const result = computeMonthlyKPI([], "2026-07");
    expect(result.prePrPassRate).toBe(0);
    expect(result.prePrTotal).toBe(0);
    expect(result.gateActivations.intent).toBe(0);
  });

  it("preserva o formato legado aninhado de pre-pr", () => {
    const result = computeMonthlyKPI([
      {
        type: "pre-pr",
        timestamp: "2026-07-01T10:00:00Z",
        data: { result: "PASS", branch: "feat/legacy" },
      },
    ], "2026-07");

    expect(result.prePrPass).toBe(1);
    expect(result.branchesMerged).toBe(1);
  });

  it("inclui bloco llmRouter zero-filled para mês sem router", () => {
    const result = computeMonthlyKPI([], "2026-07");

    expect(result.llmRouter).toMatchObject({
      resolved: 0,
      completed: 0,
      failed: 0,
      unobserved: 0,
      fallbackUsed: 0,
      models: [],
      skillsByModel: [],
    });
    expect(result.llmRouter.completionRate).toBeNull();
  });

  it("calcula o bloco llmRouter para resolução + fallback completado", () => {
    const result = computeMonthlyKPI([
      {
        type: "llm.route.resolved",
        taskId: "aug-1",
        model: "model/primary",
        fallbackModels: ["model/fallback"],
        skills: [],
        timestamp: "2026-08-01T10:00:00Z",
      },
      {
        type: "llm.route.completed",
        taskId: "aug-1",
        model: "model/primary",
        attempt: 1,
        status: "failed",
        timestamp: "2026-08-01T10:01:00Z",
      },
      {
        type: "llm.route.completed",
        taskId: "aug-1",
        model: "model/fallback",
        attempt: 2,
        status: "completed",
        resolvedModel: "model/primary",
        fallbackUsed: true,
        skills: ["test-driven-development"],
        timestamp: "2026-08-01T10:02:00Z",
      },
    ], "2026-08");

    expect(result.llmRouter).toMatchObject({
      resolved: 1,
      completed: 1,
      failed: 0,
      unobserved: 0,
      fallbackUsed: 1,
      completionRate: 100,
      fallbackRate: 100,
      models: ["model/fallback"],
      skillsByModel: [{ skill: "test-driven-development", model: "model/fallback" }],
    });
  });
});

describe("computeCycleTime", () => {
  it("computes average cycle time in hours from session:start+pre-pr events", () => {
    const events = [
      { type: "session:start", timestamp: "2026-07-01T08:00:00Z", branch: "feat/a" },
      { type: "pre-pr", timestamp: "2026-07-03T08:00:00Z", description: "pre-pr PASS", errors: 0, branch: "feat/a" },
      { type: "session:start", timestamp: "2026-07-05T10:00:00Z", branch: "feat/b" },
      { type: "pre-pr", timestamp: "2026-07-06T10:00:00Z", description: "pre-pr PASS", errors: 0, branch: "feat/b" },
    ];

    const result = computeCycleTime(events);
    // 48h e 24h → média 36 horas
    expect(result).toBe(36);
  });

  it("returns null when no cycles complete", () => {
    const events = [
      { type: "session:start", timestamp: "2026-07-01T08:00:00Z", branch: "feat/a" },
    ];
    expect(computeCycleTime(events)).toBeNull();
  });

  it("returns null for empty events", () => {
    expect(computeCycleTime([])).toBeNull();
  });

  it("ignores invalid cycles (pre-pr before session start)", () => {
    const events = [
      { type: "session:start", timestamp: "2026-07-02T08:00:00Z", branch: "feat/a" },
      { type: "pre-pr", timestamp: "2026-07-01T10:00:00Z", description: "pre-pr PASS", errors: 0, branch: "feat/a" },
      { type: "session:start", timestamp: "2026-07-05T10:00:00Z", branch: "feat/b" },
      { type: "pre-pr", timestamp: "2026-07-05T12:30:00Z", description: "pre-pr PASS", errors: 0, branch: "feat/b" },
    ];
    const result = computeCycleTime(events);
    // apenas o ciclo válido (2.5h) conta; o negativo é ignorado
    expect(result).toBe(2.5);
  });

  it("returns null when all cycles are invalid", () => {
    const events = [
      { type: "session:start", timestamp: "2026-07-02T08:00:00Z", branch: "feat/a" },
      { type: "pre-pr", timestamp: "2026-07-01T10:00:00Z", description: "pre-pr PASS", errors: 0, branch: "feat/a" },
    ];
    expect(computeCycleTime(events)).toBeNull();
  });
});

describe("parseReportsForMonth (quality.jsonl)", () => {
  it("returns null metrics when file does not exist or month has no data", () => {
    const result = parseReportsForMonth("2025-01");
    expect(result.avgOutcomeGrade).toBeNull();
    expect(result.testCoverageLibs).toBeNull();
    expect(result.testCoverageComponents).toBeNull();
  });
});

describe("computeMonthlyKPI — fontes reais", () => {
  it("derives topViolations from rule:fail events", () => {
    const events = [
      { type: "rule:fail", timestamp: "2026-07-01T10:00:00Z", rule: "rule-30-outcome-grade" },
      { type: "rule:fail", timestamp: "2026-07-02T10:00:00Z", rule: "rule-30-outcome-grade" },
      { type: "rule:fail", timestamp: "2026-07-03T10:00:00Z", rule: "rule-31-lib-test-coverage" },
    ];
    const result = computeMonthlyKPI(events, "2026-07");
    expect(result.topViolations).toEqual([
      { rule: "rule-30-outcome-grade", count: 2 },
      { rule: "rule-31-lib-test-coverage", count: 1 },
    ]);
  });

  it("uses avgCycleTimeHours field with null when no cycles", () => {
    const result = computeMonthlyKPI([], "2026-07");
    expect(result.avgCycleTimeHours).toBeNull();
  });
});