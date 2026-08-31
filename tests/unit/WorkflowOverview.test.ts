import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { WorkflowOverview } from "@/components/workflow/WorkflowOverview";
import type { WorkflowData } from "@/types/kpi";

vi.mock("@/lib/workflowData", () => ({
  useWorkflowData: vi.fn(),
}));

vi.mock("@/components/AnimatedNumber", () => ({
  AnimatedNumber: ({ value }: { value: number }) => String(value),
}));

import { useWorkflowData } from "@/lib/workflowData";

const mockUseWorkflowData = vi.mocked(useWorkflowData);

function makeData(overrides: Partial<WorkflowData> = {}): WorkflowData {
  return {
    generatedAt: new Date().toISOString(),
    dataDate: "2026-08-13",
    kpiStats: [],
    eventTypes: [],
    grades: [],
    recentTimeline: [],
    gateEfficiency: {
      ruleFails: 0,
      healed: 0,
      healedRate: null,
      prePrTotal: 0,
      prePrPass: 0,
      prePrPassRate: null,
      gateBlocked: 0,
      topViolations: [],
    },
    lastPrs: [],
    overview: {
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
    ...overrides,
  };
}

describe("WorkflowOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWorkflowData.mockReturnValue(makeData());
  });

  it("mostra os fatos do repositório", () => {
    render(createElement(WorkflowOverview));

    expect(screen.getByText("MilesControl em números")).toBeTruthy();
    expect(screen.getByText("82")).toBeTruthy();
    expect(screen.getByText("Componentes")).toBeTruthy();
    expect(screen.getByText("41")).toBeTruthy();
    expect(screen.getByText("Regras")).toBeTruthy();
  });

  it("lista as últimas entregas em produção", () => {
    mockUseWorkflowData.mockReturnValue(
      makeData({
        lastPrs: [
          {
            number: 370,
            title: "feat(process): otimização do workflow",
            type: "feat",
            date: "2026-08-13",
            tokens: 767,
            benefit: "b",
            impact: "i",
          },
        ],
      }),
    );
    render(createElement(WorkflowOverview));

    expect(screen.getByText("🚀 Últimas entregas em produção")).toBeTruthy();
    expect(screen.getByText("#370")).toBeTruthy();
  });

  it("mostra mensagem quando não há fatos (fallback ilustrativo)", () => {
    mockUseWorkflowData.mockReturnValue(
      makeData({ overview: { ...makeData().overview, components: 0 } }),
    );
    render(createElement(WorkflowOverview));

    expect(screen.getByText(/npm run data:refresh/)).toBeTruthy();
  });
});
