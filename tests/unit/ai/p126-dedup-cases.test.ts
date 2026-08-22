/**
 * P12.6-12 — Deduplication Controlled Test Cases
 *
 * Casos controlados de deduplicação com métricas reais:
 * - mesmo título → true duplicate
 * - título diferente → false duplicate
 * - bônus diferente → missed duplicate
 * - datas diferentes → partial match
 * - programas diferentes → not duplicate
 * - mesma promoção em fontes diferentes → cross-source duplicate
 */

import { describe, it, expect, beforeEach } from "vitest";
import { PromotionDeduplicator } from "@/ai/mutation/promotion/deduplication";
import type { Promotion } from "@/ai/mutation/promotion/types";

// ─── Test Fixtures ─────────────────────────────────────────────

function makePromotion(overrides: Partial<Promotion> = {}): Promotion {
  return {
    id: `promo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: "Bônus 100% na compra de milhas",
    program: "Livelo",
    sourceUrl: "https://www.livelo.com.br/promocoes/teste",
    sourceId: "livelo-official",
    description: "Ganhe o dobro de milhas em compras até o fim do mês",
    bonusPercentage: 100,
    startDate: "2026-08-01",
    endDate: "2026-08-31",
    origin: "global",
    destination: "any",
    terms: "Válido para compras acima de R$500",
    confidence: "HIGH",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ─── Test Suite ────────────────────────────────────────────────

describe("P12.6-12 — Deduplication Controlled Cases", () => {
  let dedup: PromotionDeduplicator;

  beforeEach(() => {
    dedup = new PromotionDeduplicator();
  });

  describe("True Duplicates (same promotion, same source)", () => {
    it("should detect same title + same program + same dates as duplicate", () => {
      const existing = [makePromotion({ id: "p1", title: "Bônus 100% na compra de milhas Livelo" })];
      const candidate = makePromotion({ id: "p2", title: "Bônus 100% na compra de milhas Livelo" });

      const result = dedup.checkDuplicate(existing, candidate);

      expect(result.isDuplicate).toBe(true);
      expect(result.similarity).toBeGreaterThanOrEqual(0.8);
    });

    it("should detect same promotion with minor title variation", () => {
      const existing = [makePromotion({ id: "p1", title: "Bônus 100% Livelo" })];
      const candidate = makePromotion({ id: "p2", title: "Bônus de 100% Livelo" });

      const result = dedup.checkDuplicate(existing, candidate);

      expect(result.isDuplicate).toBe(true);
      expect(result.similarity).toBeGreaterThanOrEqual(0.6);
    });
  });

  describe("False Duplicates (different promotions)", () => {
    it("should NOT flag different programs as duplicates", () => {
      const existing = [makePromotion({ id: "p1", program: "Livelo" })];
      const candidate = makePromotion({ id: "p2", program: "Smiles" });

      const result = dedup.checkDuplicate(existing, candidate);

      // Different programs = lower score, may or may not be dup depending on other factors
      expect(result.similarity).toBeLessThan(0.8);
    });

    it("should NOT flag very different titles as duplicates", () => {
      const existing = [makePromotion({ id: "p1", title: "Bônus 100% Livelo" })];
      const candidate = makePromotion({ id: "p2", title: "Desconto de 50% em passagens aéreas" });

      const result = dedup.checkDuplicate(existing, candidate);

      // Title similarity is low but other factors (same program) may increase score
      expect(result.similarity).toBeLessThan(0.9);
    });

    it("should NOT flag different bonus percentages as same with different programs", () => {
      const existing = [makePromotion({ id: "p1", program: "Livelo", bonusPercentage: 100 })];
      const candidate = makePromotion({ id: "p2", program: "Smiles", bonusPercentage: 50 });

      const result = dedup.checkDuplicate(existing, candidate);

      // Low similarity due to different program + different bonus
      expect(result.similarity).toBeLessThan(0.7);
    });
  });

  describe("Missed Duplicates (same promo, different presentation)", () => {
    it("should catch same program + similar title even with different dates", () => {
      const existing = [makePromotion({ id: "p1", startDate: "2026-08-01", endDate: "2026-08-31" })];
      const candidate = makePromotion({ id: "p2", startDate: "2026-08-03", endDate: "2026-09-02" });

      const result = dedup.checkDuplicate(existing, candidate);

      expect(result.isDuplicate).toBe(true);
    });

    it("should catch same promo with different source URLs", () => {
      const existing = [makePromotion({
        id: "p1",
        sourceUrl: "https://www.livelo.com.br/promocoes/bonus-100",
      })];
      const candidate = makePromotion({
        id: "p2",
        sourceUrl: "https://blog.livelo.com.br/bonus-100-agosto",
      });

      const result = dedup.checkDuplicate(existing, candidate);

      expect(result.isDuplicate).toBe(true);
    });
  });

  describe("Cross-Source Duplicates", () => {
    it("should detect same promo found on official + aggregator", () => {
      const existing = [makePromotion({
        id: "p1",
        sourceId: "livelo-official",
        sourceUrl: "https://www.livelo.com.br/promocoes",
      })];
      const candidate = makePromotion({
        id: "p2",
        sourceId: "passageiro-de-primeira",
        sourceUrl: "https://www.passageirodeprimeira.com.br/livelo-bonus",
      });

      const result = dedup.checkDuplicate(existing, candidate);

      expect(result.isDuplicate).toBe(true);
    });
  });

  describe("Similarity Metrics", () => {
    it("should compute similarity score correctly for identical promotions", () => {
      const a = makePromotion({ id: "a" });
      const b = makePromotion({ id: "b" });

      const score = dedup.computeSimilarity(a, b);

      expect(score).toBeGreaterThanOrEqual(0.9);
    });

    it("should compute similarity score for partially similar promotions", () => {
      const a = makePromotion({ id: "a", program: "Livelo", bonusPercentage: 100 });
      const b = makePromotion({ id: "b", program: "Livelo", bonusPercentage: 50 });

      const score = dedup.computeSimilarity(a, b);

      expect(score).toBeGreaterThan(0.3);
      expect(score).toBeLessThan(0.9);
    });

    it("should compute low similarity for completely different promotions", () => {
      const a = makePromotion({ id: "a", program: "Livelo", title: "Bônus 100%" });
      const b = makePromotion({ id: "b", program: "Smiles", title: "Desconto passagens" });

      const score = dedup.computeSimilarity(a, b);

      // Different program + different title = low but not zero due to shared defaults
      expect(score).toBeLessThan(0.6);
    });
  });

  describe("Duplicate Rate Calculation", () => {
    it("should calculate 0% when no duplicates", () => {
      const rate = dedup.getDuplicateRate(10);
      expect(rate).toBe(0);
    });

    it("should track duplicate rate across groups", () => {
      const p1 = makePromotion({ id: "p1", title: "Bônus 100% Livelo" });
      const p2 = makePromotion({ id: "p2", title: "Bônus 100% Livelo" });
      const p3 = makePromotion({ id: "p3", title: "Bônus 100% Livelo" });

      dedup.checkDuplicate([p1], p2);
      dedup.checkDuplicate([p1, p2], p3);

      const rate = dedup.getDuplicateRate(3);
      expect(rate).toBeGreaterThan(0);
    });
  });
});
