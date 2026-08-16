import { describe, expect, it } from "vitest";
import { SCENARIOS, getScenario, scenarioCoverage } from "@/ai/e2e";

describe("P12.5 Scenario defs", () => {
  it("registry contém os 8 cenários com metadata completa", () => {
    expect(SCENARIOS.length).toBe(8);
    for (const s of SCENARIOS) {
      expect(s.scenarioId).toBeTruthy();
      expect(s.version).toBeTruthy();
      expect(s.risk).toMatch(/^(low|medium|high)$/);
      expect(s.priority).toMatch(/^P[0-3]$/);
      expect(s.steps.length).toBeGreaterThan(0);
      expect(s.assertions.length).toBeGreaterThan(0);
      expect(Array.isArray(s.expectedArtifacts)).toBe(true);
    }
  });

  it("getScenario encontra por id e scenarioCoverage soma 8", () => {
    expect(getScenario("create-mileage-entry")?.risk).toBe("medium");
    expect(getScenario("nao-existe")).toBeUndefined();
    const cov = scenarioCoverage();
    expect(cov.P0 + cov.P1 + cov.P2 + cov.P3).toBe(8);
  });

  it("cenário create-mileage-entry alinhado ao demo real (42.900)", () => {
    const s = getScenario("create-mileage-entry")!;
    const totalAssertion = s.assertions.find((a) => a.type === "text" && a.selector === "#dashboard-total");
    expect(totalAssertion && "expected" in totalAssertion ? totalAssertion.expected : null).toBe("42.900");
  });
});
