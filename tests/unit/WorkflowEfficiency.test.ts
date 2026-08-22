import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { WorkflowEfficiency } from "@/components/workflow/WorkflowEfficiency";
import { GATE_EFFICIENCY, DATA_DATE } from "@/lib/workflowStaticData";

vi.mock("@/hooks/useWorkflowMetrics", () => ({
  useWorkflowMetrics: vi.fn(),
}));

import { useWorkflowMetrics } from "@/hooks/useWorkflowMetrics";

const mockUseWorkflowMetrics = vi.mocked(useWorkflowMetrics);

beforeEach(() => {
  vi.clearAllMocks();
  mockUseWorkflowMetrics.mockReturnValue({
    workflow: {
      generatedAt: new Date().toISOString(),
      dataDate: DATA_DATE,
      kpiStats: [],
      eventTypes: [],
      grades: [],
      recentTimeline: [],
      gateEfficiency: GATE_EFFICIENCY,
      lastPrs: [],
      overview: {
        components: 0,
        pages: 0,
        libs: 0,
        scripts: 0,
        testFiles: 0,
        skills: 0,
        rules: 0,
        events: 0,
        qualityNotes: 0,
      },
    },
    kpis: null,
    isLoading: false,
    isRefreshing: false,
    error: null,
    refreshedAt: new Date().toISOString(),
    refresh: vi.fn(),
  });
});

describe("WorkflowEfficiency (rule-32)", () => {
  it("renderiza a seção com dados reais de eficiência", () => {
    render(createElement(WorkflowEfficiency));

    expect(screen.getByText("Os gates estão pegando bugs?")).toBeTruthy();
    expect(screen.getByText(String(GATE_EFFICIENCY.ruleFails))).toBeTruthy();
    expect(screen.getByText(String(GATE_EFFICIENCY.healed))).toBeTruthy();
    expect(screen.getByText("violações bloqueadas")).toBeTruthy();
    expect(screen.getByText("auto-correções (healed)")).toBeTruthy();
  });

  it("lista as 5 regras que mais pegaram problemas", () => {
    render(createElement(WorkflowEfficiency));

    GATE_EFFICIENCY.topViolations.forEach((v) => {
      expect(screen.getAllByText(v.rule).length).toBeGreaterThan(0);
    });
    expect(screen.getByText(/domina: artefatos gerados/)).toBeTruthy();
  });
});
