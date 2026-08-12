import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import GateEfficiencySection from "@/components/GateEfficiencySection";

const PROPS = {
  violationsCaught: 395,
  healedRate: 14.9,
  frictionPerPass: 1.27,
  topViolations: [
    { rule: "rule-10-clean", count: 186 },
    { rule: "rule-26-session-started", count: 40 },
  ],
  healedByRule: { "rule-26": 40, "rule-17-new-docs-valid": 18 },
  gateBlockedByRule: { "rule-27-council-veredict": 1 },
};

describe("GateEfficiencySection (rule-32)", () => {
  it("renderiza os cards de eficiência de gates", () => {
    render(createElement(GateEfficiencySection, PROPS));

    expect(screen.getByText("🛡️ Eficiência dos Gates")).toBeTruthy();
    expect(screen.getByText("395")).toBeTruthy();
    expect(screen.getByText("14.9%")).toBeTruthy();
    expect(screen.getByText("Violações pegas")).toBeTruthy();
    expect(screen.getByText("Auto-correção")).toBeTruthy();
  });

  it("lista top violações e auto-correções por regra", () => {
    render(createElement(GateEfficiencySection, PROPS));

    expect(screen.getAllByText("rule-10-clean").length).toBeGreaterThan(0);
    expect(screen.getAllByText("rule-26-session-started").length).toBeGreaterThan(0);
    expect(screen.getAllByText("186").length).toBeGreaterThan(0);
    expect(screen.getAllByText("40").length).toBeGreaterThan(0);
  });

  it("conta gates bloqueados a partir do gateBlockedByRule", () => {
    render(createElement(GateEfficiencySection, PROPS));

    expect(screen.getByText("1")).toBeTruthy();
  });
});
