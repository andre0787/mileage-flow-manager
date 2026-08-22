/**
 * P12.6-18 — Promotion Deduplication
 *
 * Uma mesma promoção pode aparecer em: site oficial, blog, newsletter,
 * social, community. Não criar cinco promoções.
 *
 * Criar: 1 Promotion + multiple Evidence Sources.
 *
 * Deduplicar por sinais como: program, title similarity, date range,
 * bonus, origin, destination, terms, source.
 */

import type { Promotion, DeduplicationGroup } from "./types";

// ─── Similarity Thresholds ─────────────────────────────────────

export interface DedupConfig {
  titleSimilarityThreshold: number; // 0-1
  dateRangeToleranceDays: number;
  bonusExactMatch: boolean;
  programExactMatch: boolean;
  minMatchScore: number; // 0-1: minimum combined score to consider duplicate
}

const DEFAULT_DEDUP_CONFIG: DedupConfig = {
  titleSimilarityThreshold: 0.7,
  dateRangeToleranceDays: 3,
  bonusExactMatch: true,
  programExactMatch: true,
  minMatchScore: 0.6,
};

// ─── Deduplication Engine ──────────────────────────────────────

export class PromotionDeduplicator {
  private config: DedupConfig;
  private groups: Map<string, DeduplicationGroup> = new Map();

  constructor(config: Partial<DedupConfig> = {}) {
    this.config = { ...DEFAULT_DEDUP_CONFIG, ...config };
  }

  /**
   * Check if a new promotion is a duplicate of an existing one.
   *
   * Returns the group ID if duplicate, null if new.
   */
  checkDuplicate(
    existing: Promotion[],
    candidate: Promotion,
  ): { isDuplicate: boolean; groupId?: string; similarity: number } {
    let bestMatch: { groupId: string; score: number } | null = null;

    for (const promo of existing) {
      if (promo.id === candidate.id) continue;

      const score = this.computeSimilarity(promo, candidate);

      if (score >= this.config.minMatchScore) {
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = {
            groupId: this.getGroupIdForPromotion(promo.id),
            score,
          };
        }
      }
    }

    if (bestMatch) {
      // Add to existing group
      this.addToGroup(bestMatch.groupId, candidate.id, candidate.sourceUrl);
      return {
        isDuplicate: true,
        groupId: bestMatch.groupId,
        similarity: bestMatch.score,
      };
    }

    return { isDuplicate: false, similarity: 0 };
  }

  /**
   * Compute similarity between two promotions.
   */
  computeSimilarity(a: Promotion, b: Promotion): number {
    let score = 0;
    let weight = 0;

    // Program match (high weight)
    if (this.config.programExactMatch) {
      const programMatch = a.program === b.program ? 1 : 0;
      score += programMatch * 3;
      weight += 3;
    }

    // Title similarity (high weight)
    const titleSim = this.computeTitleSimilarity(a.title, b.title);
    score += titleSim * 3;
    weight += 3;

    // Date range overlap
    const dateSim = this.computeDateSimilarity(a, b);
    score += dateSim * 2;
    weight += 2;

    // Bonus match
    if (this.config.bonusExactMatch) {
      const bonusMatch =
        a.bonusPercentage !== undefined &&
        b.bonusPercentage !== undefined &&
        a.bonusPercentage === b.bonusPercentage
          ? 1
          : 0;
      score += bonusMatch * 1.5;
      weight += 1.5;
    }

    // Origin match
    if (a.origin && b.origin) {
      const originMatch = a.origin === b.origin ? 1 : 0;
      score += originMatch * 1;
      weight += 1;
    }

    // Destination match
    if (a.destination && b.destination) {
      const destMatch = a.destination === b.destination ? 1 : 0;
      score += destMatch * 1;
      weight += 1;
    }

    // Terms similarity
    if (a.terms && b.terms) {
      const termsSim = this.computeTextSimilarity(a.terms, b.terms);
      score += termsSim * 0.5;
      weight += 0.5;
    }

    return weight > 0 ? score / weight : 0;
  }

  /**
   * Simple title similarity using word overlap.
   */
  private computeTitleSimilarity(a: string, b: string): number {
    const wordsA = new Set(
      a.toLowerCase().split(/\s+/).filter((w) => w.length > 2),
    );
    const wordsB = new Set(
      b.toLowerCase().split(/\s+/).filter((w) => w.length > 2),
    );

    if (wordsA.size === 0 || wordsB.size === 0) return 0;

    let intersection = 0;
    for (const word of wordsA) {
      if (wordsB.has(word)) intersection++;
    }

    const union = new Set([...wordsA, ...wordsB]).size;
    return union > 0 ? intersection / union : 0;
  }

  /**
   * Date range similarity.
   */
  private computeDateSimilarity(a: Promotion, b: Promotion): number {
    if (!a.startDate && !b.startDate) return 1; // both missing = similar
    if (!a.startDate || !b.startDate) return 0.5; // one missing

    const startA = new Date(a.startDate!).getTime();
    const startB = new Date(b.startDate!).getTime();
    const toleranceMs = this.config.dateRangeToleranceDays * 86400000;

    if (Math.abs(startA - startB) <= toleranceMs) return 1;

    // Partial credit based on proximity
    const maxDiff = 30 * 86400000; // 30 days max
    const diff = Math.abs(startA - startB);
    return Math.max(0, 1 - diff / maxDiff);
  }

  /**
   * Simple text similarity using word overlap.
   */
  private computeTextSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(/\s+/));
    const wordsB = new Set(b.toLowerCase().split(/\s+/));

    let intersection = 0;
    for (const word of wordsA) {
      if (wordsB.has(word)) intersection++;
    }

    const union = new Set([...wordsA, ...wordsB]).size;
    return union > 0 ? intersection / union : 0;
  }

  /**
   * Get group ID for an existing promotion.
   */
  private getGroupIdForPromotion(promotionId: string): string {
    for (const [groupId, group] of this.groups) {
      if (group.sourcePromotionIds.includes(promotionId)) {
        return groupId;
      }
    }
    // Create new group
    const groupId = `dedup-${Date.now()}`;
    this.groups.set(groupId, {
      groupId,
      canonicalPromotionId: promotionId,
      sourcePromotionIds: [promotionId],
      similarity: 1,
      deduplicatedAt: new Date().toISOString(),
      evidence: [],
    });
    return groupId;
  }

  /**
   * Add a duplicate to a group.
   */
  private addToGroup(
    groupId: string,
    promotionId: string,
    sourceUrl: string,
  ): void {
    const group = this.groups.get(groupId);
    if (group && !group.sourcePromotionIds.includes(promotionId)) {
      group.sourcePromotionIds.push(promotionId);
      group.evidence.push(sourceUrl);
    }
  }

  /**
   * Get all deduplication groups.
   */
  getGroups(): DeduplicationGroup[] {
    return Array.from(this.groups.values());
  }

  /**
   * Get group by ID.
   */
  getGroup(groupId: string): DeduplicationGroup | undefined {
    return this.groups.get(groupId);
  }

  /**
   * Calculate duplicate rate.
   */
  getDuplicateRate(totalPromotions: number): number {
    if (totalPromotions === 0) return 0;
    const duplicates = Array.from(this.groups.values()).reduce(
      (sum, g) => sum + Math.max(0, g.sourcePromotionIds.length - 1),
      0,
    );
    return duplicates / totalPromotions;
  }
}
