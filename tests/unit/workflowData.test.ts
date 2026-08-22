/**
 * workflowData.test.ts — Testes da lib de dados da aba Workflow
 * (src/lib/workflowData.ts) — regra-31.
 */

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { fallbackWorkflowData } from "@/lib/workflowData";
import { GATE_EFFICIENCY } from "@/lib/workflowStaticData";

describe("fallbackWorkflowData", () => {
  it("retorna uma estrutura vazia segura", () => {
    const data = fallbackWorkflowData();
    expect(data.dataDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.kpiStats).toEqual([]);
    expect(data.eventTypes).toEqual([]);
    expect(data.grades).toEqual([]);
    expect(data.recentTimeline).toEqual([]);
    expect(data.gateEfficiency).toEqual({
      ruleFails: 0,
      healed: 0,
      healedRate: 0,
      prePrTotal: 0,
      prePrPass: 0,
      prePrPassRate: 0,
      gateBlocked: 0,
      topViolations: [],
    });
    expect(data.lastPrs).toEqual([]);
    expect(data.overview.components).toBe(0);
  });

  it("expõe a estrutura esperada pelo JSON de dados reais", () => {
    const data = fallbackWorkflowData();
    expect(data.generatedAt).toBeTruthy();
    expect(data.overview).toHaveProperty("events");
    expect(data.overview).toHaveProperty("rules");
    expect(data.gateEfficiency.topViolations).toEqual([]);
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
    expect(data.dataDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.overview.components).toBe(0);
  });

  it("resolve com fallback quando a resposta não é ok", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }) as unknown as typeof fetch;
    const { loadWorkflowData: load } = await import("@/lib/workflowData");
    const data = await load();
    expect(data.dataDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
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
