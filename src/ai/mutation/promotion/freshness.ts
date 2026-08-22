/**
 * P12.6-14.5 / P12.6-33 — Freshness Tracking & Source Health
 *
 * Cada fonte deve possuir um objetivo de atualização.
 * KPI: Last successful collection, Next scheduled collection,
 *      Age of current data, Freshness status.
 *
 * Estados: FRESH, STALE, DEGRADED, OFFLINE
 *
 * Uma fonte em STALE não deve ser apresentada como se tivesse sido
 * verificada recentemente.
 */

import type {
  PromotionSource,
  SourceHealth,
  FreshnessReport,
  CollectionRun,
} from "./types";

// ─── Freshness Calculator ──────────────────────────────────────

export class FreshnessTracker {
  private reports: Map<string, FreshnessReport> = new Map();

  /**
   * Update freshness based on a collection run.
   */
  updateFromCollectionRun(run: CollectionRun, source: PromotionSource): void {
    const now = Date.now();
    const lastRun = run.completedAt || run.startedAt;
    const ageMs = now - new Date(lastRun).getTime();
    const ageHours = ageMs / 3600000;

    let status: SourceHealth;
    if (run.status === "failure") {
      status = "OFFLINE";
    } else if (ageHours > source.freshnessTarget * 2) {
      status = "DEGRADED";
    } else if (ageHours > source.freshnessTarget) {
      status = "STALE";
    } else {
      status = "FRESH";
    }

    const report: FreshnessReport = {
      sourceId: source.sourceId,
      lastSuccessfulCollection: run.status === "success" ? lastRun : source.lastSuccessfulRun || lastRun,
      nextScheduledCollection: source.nextScheduledRun || new Date(now + source.freshnessTarget * 3600000).toISOString(),
      ageOfCurrentData: ageHours,
      freshnessStatus: status,
      dataAgeDescription: formatAgeDescription(ageHours),
    };

    this.reports.set(source.sourceId, report);
  }

  /**
   * Get freshness report for a source.
   */
  getReport(sourceId: string): FreshnessReport | undefined {
    return this.reports.get(sourceId);
  }

  /**
   * Get all freshness reports.
   */
  getAllReports(): FreshnessReport[] {
    return Array.from(this.reports.values());
  }

  /**
   * Get sources that need refresh.
   */
  getStaleSources(): FreshnessReport[] {
    return this.getAllReports().filter(
      (r) => r.freshnessStatus === "STALE" || r.freshnessStatus === "DEGRADED",
    );
  }

  /**
   * Get offline sources.
   */
  getOfflineSources(): FreshnessReport[] {
    return this.getAllReports().filter(
      (r) => r.freshnessStatus === "OFFLINE",
    );
  }

  /**
   * Calculate overall freshness score (0-1).
   */
  getOverallFreshnessScore(): number {
    const reports = this.getAllReports();
    if (reports.length === 0) return 0;

    const scoreMap: Record<SourceHealth, number> = {
      FRESH: 1,
      STALE: 0.5,
      DEGRADED: 0.2,
      OFFLINE: 0,
    };

    const totalScore = reports.reduce(
      (sum, r) => sum + scoreMap[r.freshnessStatus],
      0,
    );

    return totalScore / reports.length;
  }
}

// ─── Source Health Monitor ─────────────────────────────────────

export interface SourceHealthEvent {
  sourceId: string;
  previousHealth: SourceHealth;
  newHealth: SourceHealth;
  timestamp: string;
  reason: string;
}

export class SourceHealthMonitor {
  private events: SourceHealthEvent[] = [];
  private healthMap: Map<string, SourceHealth> = new Map();

  /**
   * Record a health change.
   */
  recordChange(
    sourceId: string,
    newHealth: SourceHealth,
    reason: string,
  ): SourceHealthEvent | null {
    const previousHealth = this.healthMap.get(sourceId) || "FRESH";

    if (previousHealth === newHealth) return null;

    const event: SourceHealthEvent = {
      sourceId,
      previousHealth,
      newHealth,
      timestamp: new Date().toISOString(),
      reason,
    };

    this.events.push(event);
    this.healthMap.set(sourceId, newHealth);
    return event;
  }

  /**
   * Get current health for a source.
   */
  getHealth(sourceId: string): SourceHealth {
    return this.healthMap.get(sourceId) || "FRESH";
  }

  /**
   * Get all health events.
   */
  getEvents(): SourceHealthEvent[] {
    return [...this.events];
  }

  /**
   * Get health summary for dashboard.
   */
  getHealthDashboard(
    sources: PromotionSource[],
  ): Array<{
    program: string;
    sourceId: string;
    health: SourceHealth;
    lastCollection?: string;
    reliability: number;
  }> {
    return sources.map((s) => ({
      program: s.program,
      sourceId: s.sourceId,
      health: this.healthMap.get(s.sourceId) || s.health,
      lastCollection: s.lastSuccessfulRun,
      reliability: s.reliability,
    }));
  }
}

// ─── Freshness SLA ─────────────────────────────────────────────

export interface FreshnessSLA {
  sourceId: string;
  targetHours: number;
  currentAgeHours: number;
  met: boolean;
}

export function checkFreshnessSLA(
  sources: PromotionSource[],
  freshnessTracker: FreshnessTracker,
): FreshnessSLA[] {
  return sources.map((source) => {
    const report = freshnessTracker.getReport(source.sourceId);
    const age = report?.ageOfCurrentData ?? Infinity;

    return {
      sourceId: source.sourceId,
      targetHours: source.freshnessTarget,
      currentAgeHours: age,
      met: age <= source.freshnessTarget,
    };
  });
}

// ─── Helpers ───────────────────────────────────────────────────

function formatAgeDescription(hours: number): string {
  if (hours < 1) return "Atualizado há menos de 1 hora";
  if (hours < 24) return `Atualizado há ${Math.floor(hours)}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Atualizado há 1 dia";
  return `Atualizado há ${days} dias`;
}
