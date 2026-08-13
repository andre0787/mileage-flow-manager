import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { MonthlySection } from "@/components/kpi/MonthlySection";
import type { MonthlyKPI } from "@/types/kpi";

function makeMonth(month: string, overrides: Partial<MonthlyKPI> = {}): MonthlyKPI {
  return {
    month,
    prePrPassRate: 80,
    prePrTotal: 100,
    prePrPass: 80,
    prePrFail: 20,
    testCoverageLibs: 92,
    testCoverageComponents: 88,
    gateActivations: { intent: 4, twins: 1, auth: 2 },
    avgOutcomeGrade: 90,
    topViolations: [],
    healedByRule: {},
    gateBlockedByRule: {},
    avgCycleTimeHours: 0.5,
    branchesMerged: 10,
    violationsCaught: 40,
    healedRate: 20,
    frictionPerPass: 0.5,
    ...overrides,
  };
}

// Taxas distintas por mês para evitar ambiguidade nas buscas
const MONTHS = [
  makeMonth("2026-06", { prePrPassRate: 70 }),
  makeMonth("2026-07", { prePrPassRate: 75 }),
  makeMonth("2026-08", { prePrPassRate: 80 }),
];

describe("MonthlySection", () => {
  it("renderiza cards do mês selecionado", () => {
    render(
      createElement(MonthlySection, {
        months: MONTHS,
        current: MONTHS[2],
        previous: MONTHS[1],
      }),
    );

    expect(screen.getByText("Evolução do processo")).toBeTruthy();
    expect(screen.getByText("Taxa Pre-Pr")).toBeTruthy();
    expect(screen.getAllByText("80%").length).toBeGreaterThan(0);
    expect(screen.getByText("Cobertura Libs")).toBeTruthy();
    expect(screen.getByText("Outcome Grade")).toBeTruthy();
  });

  it("renderiza as tabelas de tempo de ciclo e evolução", () => {
    render(
      createElement(MonthlySection, {
        months: MONTHS,
        current: MONTHS[2],
        previous: MONTHS[1],
      }),
    );

    expect(screen.getByText("⏱️ Tempo de Ciclo")).toBeTruthy();
    expect(screen.getByText("📈 Evolução da Taxa Pre-Pr")).toBeTruthy();
    expect(screen.getAllByText("2026-08").length).toBeGreaterThan(0);
    expect(screen.getAllByText("0.5h").length).toBeGreaterThan(0);
  });
});
