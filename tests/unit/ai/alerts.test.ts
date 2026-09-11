import { describe, it, expect } from "vitest";
import { AlertEngine } from "../../../src/ai/mutation/promotion/alerts";
import type { Promotion, PromotionSource } from "../../../src/ai/mutation/promotion/types";

describe("AlertEngine", () => {
  const dummySource: PromotionSource = {
    sourceId: "source-1",
    program: "TudoAzul",
    type: "official",
    officialUrl: "https://example.com",
    collectionMethod: "scrape",
    collectionFrequency: "6h",
    enabled: true,
    reliability: 0.95,
    health: "FRESH",
    priority: 1,
    freshnessTarget: 6,
  };

  const mockPromotion: Promotion = {
    id: "promo-100",
    program: "TudoAzul",
    title: "100% Bônus de Transferência",
    promotionType: "transferencia",
    source: dummySource,
    sourceUrl: "https://example.com/promo-100",
    confidence: "HIGH",
    status: "active",
    evidence: [],
    freshness: "FRESH",
    endDate: new Date(Date.now() + 2 * 86400000).toISOString(), // 2 days from now
  };

  it("generates alert with valid UUID format for alertId", () => {
    const engine = new AlertEngine();
    const alert = engine.onPromotionCreated(mockPromotion);

    expect(alert).not.toBeNull();
    expect(alert?.alertId).toMatch(/^alert-\d+-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(alert?.promotionId).toBe("promo-100");
    expect(alert?.eventType).toBe("promotion.created");
    expect(alert?.acknowledged).toBe(false);
  });

  it("handles alert deduplication within the window", () => {
    const engine = new AlertEngine({ deduplicateWindowMs: 3600000 });
    const alert1 = engine.onPromotionCreated(mockPromotion);
    const alert2 = engine.onPromotionCreated(mockPromotion);

    expect(alert1).not.toBeNull();
    expect(alert2).toBeNull();
    expect(engine.getAllAlerts()).toHaveLength(1);
  });

  it("allows acknowledging alerts and updates statistics", () => {
    const engine = new AlertEngine();
    const alert = engine.onPromotionCreated(mockPromotion);
    expect(alert).not.toBeNull();

    expect(engine.getUnacknowledgedAlerts()).toHaveLength(1);
    expect(engine.getStats().unacknowledged).toBe(1);

    engine.acknowledge(alert!.alertId);

    expect(engine.getUnacknowledgedAlerts()).toHaveLength(0);
    expect(engine.getStats().unacknowledged).toBe(0);
  });

  it("detects expiring promotions and triggers alert", () => {
    const engine = new AlertEngine({ expiringThresholdDays: 3 });
    const alerts = engine.checkExpiringPromotions([mockPromotion]);

    expect(alerts).toHaveLength(1);
    expect(alerts[0].eventType).toBe("promotion.expiring");
  });
});
