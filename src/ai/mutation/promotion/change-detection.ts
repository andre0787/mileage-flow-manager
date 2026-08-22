/**
 * P12.6-07 / P12.6-34 — Promotion Change Detection
 *
 * Detectar mudanças em: bonus, dates, eligibility, terms,
 * destination, minimum points, status.
 *
 * Uma alteração material deve gerar promotion.updated com diff/evidence.
 */

import type { Promotion, PromotionChange, ChangeType } from "./types";

// ─── Change Detector ───────────────────────────────────────────

export interface ChangeDetectorConfig {
  materialChangeThreshold: number;
  trackAllChanges: boolean;
}

const DEFAULT_CONFIG: ChangeDetectorConfig = {
  materialChangeThreshold: 0.01,
  trackAllChanges: true,
};

export class ChangeDetector {
  private previousSnapshots: Map<string, Promotion> = new Map();
  private changes: PromotionChange[] = [];
  private config: ChangeDetectorConfig;

  constructor(config: Partial<ChangeDetectorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Detect changes between previous and current state of a promotion.
   */
  detectChanges(promotionId: string, current: Promotion): PromotionChange[] {
    const previous = this.previousSnapshots.get(promotionId);
    const detectedChanges: PromotionChange[] = [];

    if (!previous) {
      // First time seeing this promotion
      detectedChanges.push(
        this.createChange(promotionId, "new_promotion", "all", undefined, "new", current.sourceUrl),
      );
    } else {
      // Compare each field
      const fieldChanges = [
        ...this.compareField(previous, current, "bonusPercentage", "bonus_changed"),
        ...this.compareField(previous, current, "startDate", "dates_changed"),
        ...this.compareField(previous, current, "endDate", "dates_changed"),
        ...this.compareField(previous, current, "eligibility", "eligibility_changed"),
        ...this.compareField(previous, current, "terms", "terms_changed"),
        ...this.compareField(previous, current, "destination", "destination_changed"),
        ...this.compareField(previous, current, "minimumPoints", "minimum_points_changed"),
        ...this.compareField(previous, current, "status", "status_changed"),
      ];

      detectedChanges.push(...fieldChanges);

      // Check for expiry
      if (previous.status === "active" && current.status === "expired") {
        detectedChanges.push(
          this.createChange(
            promotionId,
            "expired",
            "status",
            "active",
            "expired",
            current.sourceUrl,
          ),
        );
      }
    }

    // Update snapshot
    this.previousSnapshots.set(promotionId, { ...current });
    this.changes.push(...detectedChanges);

    return detectedChanges;
  }

  /**
   * Compare a single field between two promotions.
   */
  private compareField(
    previous: Promotion,
    current: Promotion,
    field: keyof Promotion,
    changeType: ChangeType,
  ): PromotionChange[] {
    const prevValue = previous[field];
    const currValue = current[field];

    // Skip if both are undefined/null
    if (prevValue === undefined && currValue === undefined) return [];
    if (prevValue === null && currValue === null) return [];

    // Compare
    const prevStr = JSON.stringify(prevValue);
    const currStr = JSON.stringify(currValue);

    if (prevStr !== currStr) {
      return [
        this.createChange(
          current.id,
          changeType,
          field as string,
          prevStr,
          currStr,
          current.sourceUrl,
        ),
      ];
    }

    return [];
  }

  /**
   * Create a change record.
   */
  private createChange(
    promotionId: string,
    changeType: ChangeType,
    field: string,
    previousValue: string | undefined,
    newValue: string | undefined,
    sourceUrl: string,
  ): PromotionChange {
    return {
      changeId: `change-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      promotionId,
      changeType,
      field,
      previousValue,
      newValue,
      detectedAt: new Date().toISOString(),
      sourceUrl,
    };
  }

  /**
   * Get all detected changes.
   */
  getAllChanges(): PromotionChange[] {
    return [...this.changes];
  }

  /**
   * Get changes for a specific promotion.
   */
  getChangesForPromotion(promotionId: string): PromotionChange[] {
    return this.changes.filter((c) => c.promotionId === promotionId);
  }

  /**
   * Get material changes (bonus, dates, eligibility, terms).
   */
  getMaterialChanges(): PromotionChange[] {
    const materialTypes: ChangeType[] = [
      "bonus_changed",
      "dates_changed",
      "eligibility_changed",
      "terms_changed",
    ];
    return this.changes.filter((c) => materialTypes.includes(c.changeType));
  }

  /**
   * Get change statistics.
   */
  getStats(): {
    total: number;
    byType: Record<ChangeType, number>;
    materialChanges: number;
  } {
    const byType = {} as Record<ChangeType, number>;
    for (const change of this.changes) {
      byType[change.changeType] = (byType[change.changeType] || 0) + 1;
    }

    return {
      total: this.changes.length,
      byType,
      materialChanges: this.getMaterialChanges().length,
    };
  }

  /**
   * Export snapshots for persistence.
   */
  exportSnapshots(): Record<string, Promotion> {
    return Object.fromEntries(this.previousSnapshots);
  }

  /**
   * Import snapshots.
   */
  importSnapshots(snapshots: Record<string, Promotion>): void {
    for (const [id, promo] of Object.entries(snapshots)) {
      this.previousSnapshots.set(id, promo);
    }
  }
}
