/**
 * scout-cache.test.ts — P13-02 Scout Result Cache + P13-01 Deterministic Fallback.
 */

import { describe, expect, it, beforeEach } from "vitest";
import { ScoutCache, globalScoutCache } from "@/ai/execution/scout-cache";
import type { GraphScoutResult } from "@/ai/execution/scouts";

function mockGraphResult(target: string): GraphScoutResult {
  return {
    target,
    impactScore: 0.5,
    directDependencies: ["a.ts"],
    directDependents: ["b.ts"],
    tests: ["a.test.ts"],
    features: ["feature-x"],
    risks: [],
    recommendedFiles: ["a.ts", "a.test.ts"],
    available: true,
  };
}

describe("ScoutCache (P13-02)", () => {
  let cache: ScoutCache;

  beforeEach(() => {
    cache = new ScoutCache(60_000); // 60s TTL para testes
  });

  it("armazena e recupera resultado por role+target", () => {
    const result = mockGraphResult("src/foo.ts");
    cache.set("graph-scout", "src/foo.ts", result);
    expect(cache.get("graph-scout", "src/foo.ts")).toEqual(result);
  });

  it("retorna undefined para target não cacheado", () => {
    expect(cache.get("graph-scout", "nonexistent")).toBeUndefined();
  });

  it("normaliza target (case-insensitive, trim)", () => {
    const result = mockGraphResult("src/Foo.ts");
    cache.set("graph-scout", "src/Foo.ts", result);
    expect(cache.get("graph-scout", "src/foo.ts")).toEqual(result);
    expect(cache.get("graph-scout", "  SRC/FOO.TS  ")).toEqual(result);
  });

  it("diferencia roles (graph-scout vs domain-scout)", () => {
    const graphResult = mockGraphResult("x.ts");
    const domainResult = { entities: ["E"], relations: [], tables: ["t"], businessRules: [], dataImpacts: [], available: true };
    cache.set("graph-scout", "x.ts", graphResult);
    cache.set("domain-scout", "x.ts", domainResult);
    expect(cache.get("graph-scout", "x.ts")).toEqual(graphResult);
    expect(cache.get("domain-scout", "x.ts")).toEqual(domainResult);
  });

  it("has retorna true/false corretamente", () => {
    cache.set("test-scout", "y.ts", { existingTests: [], gaps: [], suites: [], neededTests: [], available: false });
    expect(cache.has("test-scout", "y.ts")).toBe(true);
    expect(cache.has("test-scout", "z.ts")).toBe(false);
  });

  it("clear limpa todo o cache", () => {
    cache.set("graph-scout", "a.ts", mockGraphResult("a.ts"));
    cache.set("domain-scout", "b.ts", { entities: [], relations: [], tables: [], businessRules: [], dataImpacts: [], available: false });
    cache.clear();
    expect(cache.has("graph-scout", "a.ts")).toBe(false);
    expect(cache.has("domain-scout", "b.ts")).toBe(false);
  });

  it("size conta apenas entradas válidas", () => {
    cache.set("graph-scout", "a.ts", mockGraphResult("a.ts"));
    cache.set("graph-scout", "b.ts", mockGraphResult("b.ts"));
    expect(cache.size).toBe(2);
  });

  it("cache com TTL curto expira", async () => {
    const shortCache = new ScoutCache(1); // 1ms
    shortCache.set("graph-scout", "x.ts", mockGraphResult("x.ts"));
    // Esperar o TTL expirar
    await new Promise((r) => setTimeout(r, 5));
    expect(shortCache.get("graph-scout", "x.ts")).toBeUndefined();
  });

  it("gc remove entradas expiradas", async () => {
    const shortCache = new ScoutCache(1);
    shortCache.set("graph-scout", "a.ts", mockGraphResult("a.ts"));
    shortCache.set("graph-scout", "b.ts", mockGraphResult("b.ts"));
    // Force expire
    await new Promise((r) => setTimeout(r, 5));
    const removed = shortCache.gc();
    expect(removed).toBe(2);
    expect(shortCache.size).toBe(0);
  });

  it("globalScoutCache é instância singleton", () => {
    expect(globalScoutCache).toBeInstanceOf(ScoutCache);
  });

  it("target undefined é tratado como string vazia", () => {
    const result = mockGraphResult("no-target");
    cache.set("graph-scout", undefined, result);
    expect(cache.get("graph-scout", undefined)).toEqual(result);
    expect(cache.get("graph-scout", "")).toEqual(result);
  });
});

describe("adaptive planner graphEnabled (P13-03)", () => {
  it("tiny e small não habilitam graph", async () => {
    const { buildAdaptivePlan } = await import("@/ai/orchestration/adaptive-planner");
    const tiny = buildAdaptivePlan("T1", "tiny");
    const small = buildAdaptivePlan("T2", "small");
    expect(tiny.graphEnabled).toBe(false);
    expect(small.graphEnabled).toBe(false);
  });

  it("medium e large habilitam graph", async () => {
    const { buildAdaptivePlan } = await import("@/ai/orchestration/adaptive-planner");
    const medium = buildAdaptivePlan("T3", "medium");
    const large = buildAdaptivePlan("T4", "large");
    expect(medium.graphEnabled).toBe(true);
    expect(large.graphEnabled).toBe(true);
  });
});
