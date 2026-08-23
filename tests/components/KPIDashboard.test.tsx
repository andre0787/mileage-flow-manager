import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import KPIDashboard from "../../src/components/KPIDashboard";
import type { KpiData } from "../../src/types/kpi";

vi.mock("../../src/contexts/DataContext", () => ({
  useData: () => ({
    owners: [],
    accounts: [],
    programs: [],
    sales: [],
    entries: [],
    origemTypes: [],
    isLoading: true,
  }),
}));

// AiCostSection busca ai_telemetry no Supabase — mock retorna vazio (sem rede)
vi.mock("../../src/lib/supabase", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => ({
          limit: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    }),
  },
}));

const mockData: KpiData = {
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
      healedByRule: { "rule-14": 1 },
      gateBlockedByRule: { "rule-27": 1 },
      avgCycleTimeHours: 1.5,
      branchesMerged: 4,
      violationsCaught: 5,
      healedRate: 20,
      frictionPerPass: 0.83,

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
      healedByRule: {},
      gateBlockedByRule: {},
      avgCycleTimeHours: 2.1,
      branchesMerged: 5,
      violationsCaught: 0,
      healedRate: null,
      frictionPerPass: null,
    },
  ],
  daily: [
    {
      day: "2026-07-29",
      label: "29/07",
      prePrTotal: 7,
      prePrPass: 6,
      prePrFail: 1,
      prePrPassRate: 85.7,
      ruleFails: 3,
      healed: 1,
      sessions: 2,
      merges: 1,
      friction: 0.5,
    },
  ],
  prs: [
    {
      number: 370,
      title: "feat(process): otimização do workflow",
      type: "feat",
      date: "2026-07-29",
      tokens: 700,
      benefit: "Nova capacidade entregue e validada",
      impact: "Nova alavanca de uso/negócio",
    },
  ],
  repo: {
    components: 82,
    pages: 16,
    libs: 17,
    scripts: 103,
    testFiles: 179,
    skills: 26,
    rules: 41,
    events: 1203,
    qualityNotes: 460,
  },
  summary: {
    merges: 5,
    prs: 2,
    sessions: 8,
    violations: 12,
    healed: 4,
    prePrPassRate: 85.7,
  },
};

describe("KPIDashboard", () => {
  it("renders page title (Datadog interno)", () => {
    render(<KPIDashboard data={mockData} />);
    expect(screen.getByText(/Datadog interno/i)).toBeDefined();
  });

  it("shows generated timestamp", () => {
    render(<KPIDashboard data={mockData} />);
    expect(screen.getByText(/atualizado em.*2026/)).toBeDefined();
  });

  it("renders month selector", () => {
    render(<KPIDashboard data={mockData} />);
    expect(screen.getByRole("combobox")).toBeDefined();
  });

  it("renders KPI cards with monthly values", () => {
    render(<KPIDashboard data={mockData} />);
    expect(screen.getAllByText("85.7%").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("90%").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("80%").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("92.5%").length).toBeGreaterThanOrEqual(1);
  });

  it("renders tables with data", () => {
    render(<KPIDashboard data={mockData} />);
    expect(screen.getAllByText("2026-07").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("2026-06").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("1.5h")).toBeDefined();
    expect(screen.getByText("2.1h")).toBeDefined();
  });

  it("renders entregas recentes (PrsPanel)", () => {
    render(<KPIDashboard data={mockData} />);
    expect(screen.getByText("O que foi entregue")).toBeDefined();
    expect(screen.getByText("#370")).toBeDefined();
  });

  it("renders radar diário (ProcessDailySection)", () => {
    render(<KPIDashboard data={mockData} />);
    expect(screen.getByText("Radar do workflow")).toBeDefined();
    expect(screen.getAllByText(/hoje: 7 pre-pr · 1 merges/).length).toBeGreaterThanOrEqual(1);
  });
});
