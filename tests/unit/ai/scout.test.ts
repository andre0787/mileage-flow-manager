import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PromotionScout } from "@/ai/mutation/promotion/scout";
import type { PromotionSource } from "@/ai/mutation/promotion/types";

describe("PromotionScout", () => {
  const mockSource: PromotionSource = {
    sourceId: "source-livelo",
    program: "Livelo",
    type: "official",
    officialUrl: "https://example.com/livelo-promos",
    collectionMethod: "api",
    collectionFrequency: "6h",
    enabled: true,
    reliability: 0.9,
    health: "FRESH",
    priority: 1,
    freshnessTarget: 24,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("scouts source and returns candidates", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("<html>Promo Content</html>", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      })
    );

    const scout = new PromotionScout();
    const run = await scout.scout(mockSource);

    expect(run.status).toBe("success");
    expect(run.candidates).toHaveLength(1);
    expect(run.candidates[0].rawContent).toBe("<html>Promo Content</html>");
  });

  it("caches successful fetch responses within TTL", async () => {
    let fetchCount = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      fetchCount++;
      await new Promise((resolve) => setTimeout(resolve, 10)); // simulate 10ms network delay
      return new Response("<html>Promo Content</html>", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
    });

    const scout = new PromotionScout({ cacheTtlMs: 5000 });

    const start = Date.now();
    // Perform scout 5 times sequentially on the same source
    for (let i = 0; i < 5; i++) {
      await scout.scout(mockSource);
    }
    const duration = Date.now() - start;

    expect(fetchCount).toBe(1);
    expect(duration).toBeLessThan(30);
  });

  it("bypasses cache when TTL expires", async () => {
    let fetchCount = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      fetchCount++;
      return new Response("<html>Promo Content</html>", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
    });

    const scout = new PromotionScout({ cacheTtlMs: 1 }); // 1ms TTL
    await scout.scout(mockSource);
    await new Promise((resolve) => setTimeout(resolve, 5));
    await scout.scout(mockSource);

    expect(fetchCount).toBe(2);
  });
});
