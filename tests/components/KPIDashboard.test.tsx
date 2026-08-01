import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import KPIDashboard from "../../src/components/KPIDashboard";

const mockData = {
  generatedAt: "2026-07-29T23:00:00.000Z",
  currentMonth: "2026-07",
  months: [
    {
      month: "2026-07",
      prePrPassRate: 85.7,
      prePrTotal: 7,
      prePrPass: 6,
      prePrFail: 1,
      testCoverageLibs: 90,
      testCoverageComponents: 80,
      gateActivations: { intent: 3, twins: 1, auth: 0 },
      avgOutcomeGrade: 92.5,
      topViolations: [{ rule: "rule-14", count: 2 }],
      avgCycleTimeHours: 1.5,
      branchesMerged: 4,
    },
    {
      month: "2026-06",
      prePrPassRate: 72.3,
      prePrTotal: 11,
      prePrPass: 8,
      prePrFail: 3,
      testCoverageLibs: 85,
      testCoverageComponents: 72,
      gateActivations: { intent: 2, twins: 0, auth: 0 },
      avgOutcomeGrade: 88.0,
      topViolations: [],
      avgCycleTimeHours: 2.1,
      branchesMerged: 5,
    },
  ],
};

describe("KPIDashboard", () => {
  it("renders page title", () => {
    render(<KPIDashboard data={mockData} />);
    expect(screen.getByText(/KPIs de Processo/i)).toBeDefined();
  });

  it("shows generated timestamp", () => {
    render(<KPIDashboard data={mockData} />);
    expect(screen.getByText(/Última atualização.*2026/)).toBeDefined();
  });

  it("renders month selector", () => {
    render(<KPIDashboard data={mockData} />);
    expect(screen.getByRole("combobox")).toBeDefined();
  });

  it("renders KPI cards with values", () => {
    render(<KPIDashboard data={mockData} />);
    expect(screen.getByText("85.7%")).toBeDefined();
    expect(screen.getByText("90%")).toBeDefined();
    expect(screen.getByText("80%")).toBeDefined();
    expect(screen.getByText("92.5%")).toBeDefined();
  });

  it("renders tables with data", () => {
    render(<KPIDashboard data={mockData} />);
    const months = screen.getAllByText("2026-07");
    expect(months.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("2026-06").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("1.5h")).toBeDefined();
    expect(screen.getByText("2.1h")).toBeDefined();
  });
});