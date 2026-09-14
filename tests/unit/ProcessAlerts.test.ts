import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { ProcessAlerts } from "@/components/kpi/ProcessAlerts";
import type { DailyMetric, Summary30 } from "@/types/kpi";

const DAILY: DailyMetric[] = [
  {
    day: "2026-08-12",
    label: "12/08",
    prePrTotal: 20,
    prePrPass: 20,
    prePrFail: 0,
    prePrPassRate: 100,
    ruleFails: 5,
    healed: 2,
    sessions: 3,
    merges: 4,
    friction: 0.25,
  },
  {
    day: "2026-08-13",
    label: "13/08",
    prePrTotal: 25,
    prePrPass: 25,
    prePrFail: 0,
    prePrPassRate: 100,
    ruleFails: 12,
    healed: 4,
    sessions: 5,
    merges: 6,
    friction: 0.48,
  },
];

function makeSummary(overrides: Partial<Summary30> = {}): Summary30 {
  return {
    merges: 6,
    prs: 2,
    sessions: 8,
    violations: 30,
    healed: 8,
    prePrPassRate: 85,
    ...overrides,
  };
}

describe("ProcessAlerts", () => {
  const calmDaily: DailyMetric[] = [{ ...DAILY[0] }, { ...DAILY[1], ruleFails: 8 }];

  it("reporta processo saudável quando nada chama atenção", () => {
    render(createElement(ProcessAlerts, { daily: calmDaily, summary: makeSummary() }));
    expect(screen.getByText("Processo saudável")).toBeTruthy();
  });

  it("alerta taxa de pre-pr abaixo de 70% em 30 dias", () => {
    render(
      createElement(ProcessAlerts, {
        daily: calmDaily,
        summary: makeSummary({ prePrPassRate: 65 }),
      }),
    );
    expect(screen.getByText("Taxa de pre-pr baixa")).toBeTruthy();
  });

  it("alerta fricção alta quando o dia tem muitas violações", () => {
    render(createElement(ProcessAlerts, { daily: DAILY, summary: makeSummary() }));
    expect(screen.getByText("Fricção alta hoje")).toBeTruthy();
  });

  it("alerta crítico quando não há entregas em 30 dias", () => {
    render(
      createElement(ProcessAlerts, {
        daily: calmDaily,
        summary: makeSummary({ merges: 0 }),
      }),
    );
    expect(screen.getByText("Nenhuma entrega em 30 dias")).toBeTruthy();
  });

  it("alerta auto-correção baixa com muitas violações e pouco heal", () => {
    render(
      createElement(ProcessAlerts, {
        daily: calmDaily,
        summary: makeSummary({ violations: 200, healed: 10 }),
      }),
    );
    expect(screen.getByText("Auto-correção baixa")).toBeTruthy();
  });

  it("renderiza os alertas encontrados simultâneos", () => {
    render(
      createElement(ProcessAlerts, { daily: DAILY, summary: makeSummary({ prePrPassRate: 60 }) }),
    );
    expect(screen.getByText("Taxa de pre-pr baixa")).toBeTruthy();
    expect(screen.getByText("Fricção alta hoje")).toBeTruthy();
  });
});
