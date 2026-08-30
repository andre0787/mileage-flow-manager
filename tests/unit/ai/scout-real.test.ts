import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PromotionScoutReal } from "@/ai/mutation/promotion/scout-real";
import type { PromotionSource } from "@/ai/mutation/promotion/types";

describe("PromotionScoutReal", () => {
  const mockSources: PromotionSource[] = [
    {
      sourceId: "source-1",
      program: "Livelo",
      type: "official",
      officialUrl: "https://example.com/source1",
      collectionMethod: "api",
      collectionFrequency: "6h",
      enabled: true,
      reliability: 0.9,
      health: "FRESH",
      priority: 1,
      freshnessTarget: 24,
    },
    {
      sourceId: "source-2",
      program: "Esfera",
      type: "official",
      officialUrl: "https://example.com/source2",
      collectionMethod: "api",
      collectionFrequency: "6h",
      enabled: true,
      reliability: 0.9,
      health: "FRESH",
      priority: 1,
      freshnessTarget: 24,
    },
    {
      sourceId: "source-3",
      program: "Smiles",
      type: "official",
      officialUrl: "https://example.com/source3",
      collectionMethod: "api",
      collectionFrequency: "6h",
      enabled: true,
      reliability: 0.9,
      health: "FRESH",
      priority: 1,
      freshnessTarget: 24,
    },
    {
      sourceId: "source-disabled",
      program: "Latam Pass",
      type: "official",
      officialUrl: "https://example.com/disabled",
      collectionMethod: "api",
      collectionFrequency: "6h",
      enabled: false,
      reliability: 0.9,
      health: "FRESH",
      priority: 1,
      freshnessTarget: 24,
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("scoutAll should fetch all enabled sources and ignore disabled ones", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      return new Response(
        JSON.stringify([{ id: "promo-1", title: "Promoção Especial" }]),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    });

    const scout = new PromotionScoutReal(mockSources);
    const results = await scout.scoutAll();

    expect(results).toHaveLength(3);
    expect(results.map((r) => r.sourceId)).toEqual(["source-1", "source-2", "source-3"]);
    expect(results[0].candidates).toHaveLength(1);
    expect(results[0].candidates[0].title).toBe("Promoção Especial");
  });

  it("scoutAll benchmark - compares concurrency behavior", async () => {
    const delayMs = 100;
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return new Response("<html><h2>Bônus de 100% Livelo</h2></html>", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
    });

    const scout = new PromotionScoutReal(mockSources); // 3 enabled sources
    const start = Date.now();
    const results = await scout.scoutAll();
    const duration = Date.now() - start;

    expect(results).toHaveLength(3);
    console.log(`scoutAll duration with 3 sources (${delayMs}ms latent each): ${duration}ms`);
  });
});
