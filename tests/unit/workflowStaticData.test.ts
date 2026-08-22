import { describe, expect, it } from "vitest";
import { DATA_DATE, GATE_EFFICIENCY, KPI_STATS } from "@/lib/workflowStaticData";

describe("workflowStaticData", () => {
  it("carrega o fallback estático tipado a partir do JSON público", () => {
    expect(DATA_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(KPI_STATS.length).toBeGreaterThan(0);
    expect(GATE_EFFICIENCY.topViolations.length).toBeGreaterThan(0);
  });
});
