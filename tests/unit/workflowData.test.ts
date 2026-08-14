/**
 * workflowData.test.ts — Testes da lib de dados da aba Workflow
 * (src/lib/workflowData.ts) — regra-31.
 */

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
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

describe("loadWorkflowData (resource React 19)", () => {
  const realFetch = globalThis.fetch;

  beforeEach(() => {
    // A promise é cacheada em escopo de módulo — recarregamos o módulo por
    // teste para isolar o cache (vi.resetModules + import dinâmico).
    vi.resetModules();
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
    vi.resetModules();
  });

  it("resolve com os dados reais do JSON quando disponível", async () => {
    const payload = { generatedAt: "2026-08-14T00:00:00Z", dataDate: "hoje" };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => payload,
    }) as unknown as typeof fetch;
    const { loadWorkflowData: load } = await import("@/lib/workflowData");
    await expect(load()).resolves.toMatchObject({ dataDate: "hoje" });
  });

  it("resolve com fallback ilustrativo quando o fetch falha (nunca rejeita)", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("network")) as unknown as typeof fetch;
    const { loadWorkflowData: load } = await import("@/lib/workflowData");
    const data = await load();
    expect(data.dataDate).toBe(DATA_DATE);
    expect(data.overview.components).toBe(0);
  });

  it("resolve com fallback quando a resposta não é ok", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }) as unknown as typeof fetch;
    const { loadWorkflowData: load } = await import("@/lib/workflowData");
    const data = await load();
    expect(data.dataDate).toBe(DATA_DATE);
  });

  it("cacheia a promise entre chamadas (1 fetch apenas)", async () => {
    const payload = { generatedAt: "2026-08-14T00:00:00Z", dataDate: "cache" };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => payload,
    }) as unknown as typeof fetch;
    const { loadWorkflowData: load } = await import("@/lib/workflowData");
    const [a, b] = await Promise.all([load(), load()]);
    expect(a).toMatchObject({ dataDate: "cache" });
    expect(b).toBe(a);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});
