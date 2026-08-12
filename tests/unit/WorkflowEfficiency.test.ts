import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { WorkflowEfficiency } from "@/components/workflow/WorkflowEfficiency";
import { GATE_EFFICIENCY } from "@/lib/workflowDemoData";

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
