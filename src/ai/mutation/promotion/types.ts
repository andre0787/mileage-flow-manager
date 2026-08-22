/**
 * P12.6-13 — Promotion Intelligence Core Types
 *
 * Tipos fundamentais para a Central de Promoções:
 *   descoberta, normalização, validação, deduplicação, alertas.
 */

// ─── Promotion Source ──────────────────────────────────────────

export type SourceType = "official" | "partner" | "secondary" | "community";
export type SourceHealth = "FRESH" | "STALE" | "DEGRADED" | "OFFLINE";
export type CollectionMethod = "api" | "scrape" | "feed" | "manual" | "passageiro_de_primeira";

export interface PromotionSource {
  sourceId: string;
  program: string;
  type: SourceType;
  officialUrl: string;
  collectionMethod: CollectionMethod;
  collectionFrequency: string; // e.g., "6h", "24h", "7d"
  enabled: boolean;
  reliability: number; // 0-1
  lastSuccessfulRun?: string;
  lastChangedAt?: string;
  nextScheduledRun?: string;
  health: SourceHealth;
  priority: number; // 1=highest
  freshnessTarget: number; // max age in hours before STALE
  lastError?: string;
  retryCount?: number;
}

// ─── Promotion ─────────────────────────────────────────────────

export type PromotionStatus = "candidate" | "active" | "updated" | "expired" | "rejected";

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export type PromotionType =
  "transferencia" | "compra" | "bonus" | "resgate" | "parceria" | "cashback";

export interface Promotion {
  id: string;
  program: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  bonusPercentage?: number;
  minimumPoints?: number;
  eligibility?: string[];
  origin?: string;
  destination?: string;
  promotionType: PromotionType;
  source: PromotionSource;
  sourceUrl: string;
  terms?: string;
  confidence: ConfidenceLevel;
  status: PromotionStatus;
  evidence: PromotionEvidence[];
  lastVerifiedAt?: string;
  sourceUpdatedAt?: string;
  collectedAt?: string;
  expiresAt?: string;
  freshness: SourceHealth;
  deduplicationKey?: string;
}

// ─── Promotion Evidence ────────────────────────────────────────

export interface PromotionEvidence {
  evidenceId: string;
  promotionId: string;
  sourceId: string;
  sourceUrl: string;
  collectionRunId: string;
  scoutRunId: string;
  extractionRunId: string;
  validationRunId?: string;
  timestamp: string;
  screenshot?: string;
  rawContent?: string;
  structuredData?: unknown;
}

// ─── Promotion Alert ───────────────────────────────────────────

export type AlertEventType =
  | "promotion.created"
  | "promotion.updated"
  | "promotion.expiring"
  | "promotion.expired"
  | "promotion.rejected";

export interface PromotionAlert {
  alertId: string;
  promotionId: string;
  eventType: AlertEventType;
  reason: string;
  timestamp: string;
  source: string;
  acknowledged: boolean;
}

// ─── Collection Run ────────────────────────────────────────────

export type CollectionRunStatus = "success" | "partial" | "failure" | "skipped";

export interface CollectionRun {
  runId: string;
  sourceId: string;
  startedAt: string;
  completedAt?: string;
  status: CollectionRunStatus;
  promotionsFound: number;
  promotionsNew: number;
  promotionsUpdated: number;
  promotionsExpired: number;
  error?: string;
  duration?: number;
}

// ─── Deduplication ─────────────────────────────────────────────

export interface DeduplicationGroup {
  groupId: string;
  canonicalPromotionId: string;
  sourcePromotionIds: string[];
  similarity: number;
  deduplicatedAt: string;
  evidence: string[];
}

// ─── Freshness ─────────────────────────────────────────────────

export interface FreshnessReport {
  sourceId: string;
  lastSuccessfulCollection: string;
  nextScheduledCollection: string;
  ageOfCurrentData: number; // hours
  freshnessStatus: SourceHealth;
  dataAgeDescription: string;
}

// ─── Promotion KPI ─────────────────────────────────────────────

export interface PromotionKPI {
  activePromotions: number;
  newPromotionsPerDay: number;
  updatedPromotionsPerDay: number;
  expiredPromotionsPerDay: number;
  sourceSuccessRate: number;
  sourceFreshness: Record<string, SourceHealth>;
  validationAccuracy: number;
  duplicateRate: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  alertDelivery: number;
  averageCollectionLatency: number;
  costPerPromotion: number;
}

// ─── Change Detection ──────────────────────────────────────────

export type ChangeType =
  | "bonus_changed"
  | "dates_changed"
  | "eligibility_changed"
  | "terms_changed"
  | "destination_changed"
  | "minimum_points_changed"
  | "status_changed"
  | "new_promotion"
  | "expired";

export interface PromotionChange {
  changeId: string;
  promotionId: string;
  changeType: ChangeType;
  field: string;
  previousValue?: string;
  newValue?: string;
  detectedAt: string;
  sourceUrl: string;
  evidence?: string;
}

// ─── Source Trust Hierarchy ────────────────────────────────────

export const SOURCE_TRUST_ORDER: SourceType[] = ["official", "partner", "secondary", "community"];

export function getSourceTrustLevel(source: PromotionSource): number {
  return SOURCE_TRUST_ORDER.indexOf(source.type);
}

export function isSourceMoreTrusted(a: PromotionSource, b: PromotionSource): boolean {
  return getSourceTrustLevel(a) < getSourceTrustLevel(b);
}
