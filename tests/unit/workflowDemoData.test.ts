import { describe, it, expect } from "vitest";
import {
  DATA_DATE,
  EVENT_TYPES,
  GRADES,
  KPI_STATS,
  MAX_EVENTS,
  MAX_GRADE,
  MIND,
  GATES,
  SIM_SCENARIOS,
  JOURNEY_STEPS,
  FLUXO_ITEMS,
  RECENT_TIMELINE,
  GATE_EFFICIENCY,
  kpiForId,
} from "@/lib/workflowStaticData";

describe("workflowDemoData (rule-31)", () => {
  it("expõe a data de geração dos dados ilustrativos", () => {
    expect(DATA_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("KPI_STATS tem 6 estatísticas com valores positivos", () => {
    expect(KPI_STATS).toHaveLength(6);
    KPI_STATS.forEach((s) => {
      expect(s.value).toBeGreaterThan(0);
      expect(s.label).toBeTruthy();
      expect(s.sub).toBeTruthy();
    });
  });

  it("kpiForId resolve pelo valor numérico", () => {
    expect(kpiForId("1850")?.label).toBe("eventos registrados");
    expect(kpiForId("99999")).toBeUndefined();
  });

  it("EVENT_TYPES soma 1850 eventos reais e respeita MAX_EVENTS", () => {
    const total = EVENT_TYPES.reduce((acc, e) => acc + e.n, 0);
    expect(total).toBe(1850);
    expect(MAX_EVENTS).toBe(819);
    EVENT_TYPES.forEach((e) => {
      expect(e.name).toBeTruthy();
      expect(e.color).toMatch(/^#/);
    });
  });

  it("GRADES soma 435 notas e respeita MAX_GRADE", () => {
    const total = GRADES.reduce((acc, g) => acc + g.n, 0);
    expect(total).toBe(435);
    expect(MAX_GRADE).toBe(288);
  });

  it("GATE_EFFICIENCY reflete violações pegas, healed e pre-pr aprovados", () => {
    expect(GATE_EFFICIENCY.ruleFails).toBe(395);
    expect(GATE_EFFICIENCY.healed).toBe(59);
    expect(GATE_EFFICIENCY.prePrPass).toBe(312);
    expect(GATE_EFFICIENCY.prePrPassRate).toBe(70.6);
    expect(GATE_EFFICIENCY.topViolations[0].rule).toBe("rule-10-clean");
    expect(GATE_EFFICIENCY.topViolations.length).toBe(5);
  });

  it("RECENT_TIMELINE contém eventos pre-pr e rule:fail", () => {
    expect(RECENT_TIMELINE.length).toBeGreaterThan(0);
    const kinds = new Set(RECENT_TIMELINE.map((e) => e.d));
    expect(kinds.has("pre-pr")).toBe(true);
    expect(kinds.has("rule:fail")).toBe(true);
  });

  it("JOURNEY_STEPS cobre os 12 passos + o bloqueio fail-closed", () => {
    expect(JOURNEY_STEPS.length).toBe(13);
    expect(JOURNEY_STEPS[0].badge).toBe("rule-26");
    expect(JOURNEY_STEPS.some((s) => s.blocked)).toBe(true);
  });

  it("FLUXO_ITEMS tem 5 fases alternando com passos", () => {
    const phases = FLUXO_ITEMS.filter((i) => i.type === "phase");
    expect(phases).toHaveLength(5);
    const steps = FLUXO_ITEMS.filter((i) => i.type === "step");
    // 9 passos + 3 gates (INTENT, TWINS, AUTH)
    expect(steps.length).toBe(12);
    const kinds = steps.map((s) => s.step.kind);
    expect(kinds.filter((k) => k === "gate")).toHaveLength(3);
    expect(kinds.filter((k) => k === "fail")).toHaveLength(1);
  });

  it("MIND tem 9 ramos com folhas e evidência", () => {
    expect(MIND).toHaveLength(9);
    MIND.forEach((b) => {
      expect(b.id).toBeTruthy();
      expect(b.kids.length).toBeGreaterThan(0);
      expect(b.detail).toBeTruthy();
      expect(b.ev).toBeTruthy();
    });
  });

  it("GATES cobre os 6 portões com regras válidas", () => {
    expect(GATES).toHaveLength(6);
    const rules = GATES.map((g) => g.rule).join(" ");
    expect(rules).toMatch(/rule-33/);
    expect(rules).toMatch(/rule-34/);
    expect(rules).toMatch(/rule-35/);
    expect(rules).toMatch(/rule-38 \+ rule-39/);
  });

  it("SIM_SCENARIOS tem os 2 cenários (fail-closed e fluxo completo)", () => {
    expect(SIM_SCENARIOS).toHaveLength(2);
    const fail = SIM_SCENARIOS.find((s) => s.id === "fail");
    const ok = SIM_SCENARIOS.find((s) => s.id === "ok");
    expect(fail?.summary).toContain("BLOQUEADO");
    expect(ok?.summary).toContain("LIBERADO");
  });
});
