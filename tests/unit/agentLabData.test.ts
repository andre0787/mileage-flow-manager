import { describe, expect, it } from "vitest";
import {
  formatExperimentDate,
  getExperiments,
  getLatestExperiment,
  getReadinessGrade,
} from "@/lib/agentLabData";

describe("agentLabData", () => {
  it("carrega experimentos versionados e retorna o mais recente", () => {
    const experiments = getExperiments();
    const latest = getLatestExperiment();

    expect(experiments.length).toBeGreaterThan(0);
    expect(latest?.experimentId).toBe(experiments[0].experimentId);
  });

  it("calcula readiness grade a partir de recall/precision/fnr", () => {
    const latest = getLatestExperiment();
    const grade = getReadinessGrade(latest);

    expect(grade.grade).toMatch(/[A-F—]/);
    expect(grade.score).toBeGreaterThanOrEqual(0);
  });

  it("formata data de experimento e fallback", () => {
    expect(formatExperimentDate()).toBe("Nunca");
    expect(formatExperimentDate("2026-08-22T11:17:02.108Z")).toContain("22/08/2026");
  });
});
