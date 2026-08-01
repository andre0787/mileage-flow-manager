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

  it("returns zero-filled KPI for empty event list", () => {
    const result = computeMonthlyKPI([], "2026-07");
    expect(result.prePrPassRate).toBe(0);
    expect(result.prePrTotal).toBe(0);
    expect(result.gateActivations.intent).toBe(0);
  });
});

describe("computeCycleTime", () => {
  it("computes average cycle time from session:start+pre-pr events", () => {
    const events = [
      { type: "session:start", timestamp: "2026-07-01T08:00:00Z", branch: "feat/a" },
      { type: "pre-pr", timestamp: "2026-07-03T08:00:00Z", description: "pre-pr PASS", errors: 0, branch: "feat/a" },
      { type: "session:start", timestamp: "2026-07-05T10:00:00Z", branch: "feat/b" },
      { type: "pre-pr", timestamp: "2026-07-06T10:00:00Z", description: "pre-pr PASS", errors: 0, branch: "feat/b" },
    ];

    const result = computeCycleTime(events);
    expect(result).toBe(1.5);
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
});

describe("parseReportsForMonth", () => {
  it("returns null metrics when dir does not exist", () => {
    const result = parseReportsForMonth("2025-01");
    expect(result.avgOutcomeGrade).toBeNull();
    expect(result.testCoverageLibs).toBeNull();
    expect(result.testCoverageComponents).toBeNull();
  });
});