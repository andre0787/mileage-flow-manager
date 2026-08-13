/**
 * workflowData.test.ts — Testes da lib de dados da aba Workflow
 * (src/lib/workflowData.ts) — regra-31.
 */

import { describe, it, expect } from "vitest";
import { fallbackWorkflowData } from "@/lib/workflowData";
import {
  DATA_DATE,
  EVENT_TYPES,
  GATE_EFFICIENCY,
  GRADES,
  KPI_STATS,
  RECENT_TIMELINE,
} from "@/lib/workflowDemoData";

describe("fallbackWorkflowData", () => {
  it("usa os dados ilustrativos congelados como fallback", () => {
    const data = fallbackWorkflowData();
    expect(data.dataDate).toBe(DATA_DATE);
    expect(data.kpiStats).toEqual(KPI_STATS);
    expect(data.eventTypes).toEqual(EVENT_TYPES);
    expect(data.grades).toEqual(GRADES);
    expect(data.recentTimeline).toEqual(RECENT_TIMELINE);
    expect(data.gateEfficiency).toEqual(GATE_EFFICIENCY);
    expect(data.lastPrs).toEqual([]);
    expect(data.overview.components).toBe(0);
  });

  it("expõe a estrutura esperada pelo JSON de dados reais", () => {
    const data = fallbackWorkflowData();
    expect(data.generatedAt).toBeTruthy();
    expect(data.overview).toHaveProperty("events");
    expect(data.overview).toHaveProperty("rules");
    expect(data.gateEfficiency.topViolations[0]).toHaveProperty("hint");
  });
});
