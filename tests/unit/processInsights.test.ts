import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { buildProcessInsights } from "@/lib/processInsights";
import { ProcessInsights } from "@/components/kpi/ProcessInsights";
import type { DailyMetric, MonthlyKPI } from "@/types/kpi";

const day = (over: Partial<DailyMetric> = {}): DailyMetric => ({
  day: "2026-09-06",
  label: "06/09",
  prePrTotal: 0,
  prePrPass: 0,
  prePrFail: 0,
  prePrPassRate: null,
  ruleFails: 0,
  healed: 0,
  sessions: 0,
  merges: 0,
  friction: null,
  ...over,
});

const month = (over: Partial<MonthlyKPI> = {}): MonthlyKPI => ({
  month: "2026-09",
  prePrPassRate: 100,
  prePrTotal: 10,
  prePrPass: 10,
  prePrFail: 0,
  testCoverageLibs: null,
  testCoverageComponents: null,
  gateActivations: { intent: 0, twins: 0, auth: 0 },
  avgOutcomeGrade: null,
  topViolations: [],
  healedByRule: {},
  gateBlockedByRule: {},
  avgCycleTimeHours: null,
  branchesMerged: 1,
  violationsCaught: 0,
  healedRate: null,
  frictionPerPass: null,
  ...over,
});

describe("buildProcessInsights", () => {
  it("aponta a top violação com ação conhecida (rule-10-clean)", () => {
    const insights = buildProcessInsights({
      daily: [],
      months: [month({ topViolations: [{ rule: "rule-10-clean", count: 7 }] })],
    });
    const top = insights.find((i) => i.id === "top-violation");
    expect(top?.severity).toBe("warn");
    expect(top?.title).toContain("rule-10-clean");
    expect(top?.actionCommand).toBe("git status --short");
  });

  it("usa ação padrão para regra desconhecida", () => {
    const insights = buildProcessInsights({
      daily: [],
      months: [month({ topViolations: [{ rule: "rule-99-x", count: 3 }] })],
    });
    expect(insights.find((i) => i.id === "top-violation")?.actionCommand).toBe("npm run pre-pr");
  });

  it("traz tendência da nota (queda = warn, alta = ok)", () => {
    const down = buildProcessInsights({
      daily: [],
      months: [month({ month: "2026-08", avgOutcomeGrade: 91 }), month({ avgOutcomeGrade: 86 })],
    });
    expect(down.find((i) => i.id === "grade-trend")?.severity).toBe("warn");
    const up = buildProcessInsights({
      daily: [],
      months: [month({ month: "2026-08", avgOutcomeGrade: 86 }), month({ avgOutcomeGrade: 92 })],
    });
    expect(up.find((i) => i.id === "grade-trend")?.severity).toBe("ok");
  });

  it("sinaliza falhas de pre-pr na semana e semana limpa", () => {
    const fails = buildProcessInsights({
      daily: [day({ prePrTotal: 5, prePrFail: 2 })],
      months: [],
    });
    expect(fails.find((i) => i.id === "prepr-fails")?.severity).toBe("warn");
    const clean = buildProcessInsights({
      daily: [day({ prePrTotal: 5, prePrFail: 0 })],
      months: [],
    });
    expect(clean.find((i) => i.id === "prepr-clean")?.severity).toBe("ok");
  });

  it("destaca a área de maior custo de IA", () => {
    const insights = buildProcessInsights({
      daily: [],
      months: [],
      aiCosts: [
        { area: "vendas", cost: 0.05, executions: 10, avgExecutionMs: 1000 },
        { area: "contas", cost: 0.01, executions: 4, avgExecutionMs: 500 },
      ],
    });
    const cost = insights.find((i) => i.id === "ai-cost");
    expect(cost?.severity).toBe("info");
    expect(cost?.title).toContain("vendas");
    expect(cost?.actionCommand).toBe("npm run telemetry:audit");
  });

  it("retorna vazio sem dados e ordena warn primeiro (máx 4)", () => {
    expect(buildProcessInsights({ daily: [], months: [] })).toEqual([]);
    const insights = buildProcessInsights({
      daily: [day({ prePrTotal: 3, prePrFail: 1 })],
      months: [month({ topViolations: [{ rule: "rule-30", count: 2 }] })],
      aiCosts: [{ area: "x", cost: 0.02, executions: 2, avgExecutionMs: 100 }],
    });
    expect(insights.length).toBeLessThanOrEqual(4);
    expect(insights[0].severity).toBe("warn");
  });
});

describe("ProcessInsights (componente)", () => {
  it("mostra empty acionável sem dados", () => {
    render(createElement(ProcessInsights, { daily: [], months: [] }));
    expect(screen.getByText("💡 Insights Acionáveis")).toBeTruthy();
    expect(screen.getByText("Sem insights ainda")).toBeTruthy();
    expect(screen.getByText("npm run data:refresh")).toBeTruthy();
  });

  it("renderiza os insights com comando de ação", () => {
    render(
      createElement(ProcessInsights, {
        daily: [day({ prePrTotal: 4, prePrFail: 1 })],
        months: [month({ topViolations: [{ rule: "rule-10-clean", count: 5 }] })],
      }),
    );
    expect(screen.getByText(/Regra que mais trava/)).toBeTruthy();
    expect(screen.getByText("git status --short")).toBeTruthy();
  });
});
