/**
 * P12.6-19 — Alert Engine
 *
 * Eventos:
 *   promotion.created, promotion.updated, promotion.expiring,
 *   promotion.expired, promotion.rejected
 *
 * Alertas acionados para: nova promoção, alteração material, expiração.
 * Evitar alertas duplicados.
 */

import type { Promotion, PromotionAlert, AlertEventType } from "./types";

// ─── Alert Engine ──────────────────────────────────────────────

export interface AlertConfig {
  deduplicateWindowMs: number; // prevent duplicate alerts within this window
  expiringThresholdDays: number; // days before expiry to trigger "expiring" alert
}

const DEFAULT_ALERT_CONFIG: AlertConfig = {
  deduplicateWindowMs: 3600000, // 1 hour
  expiringThresholdDays: 3,
};

export class AlertEngine {
  private alerts: PromotionAlert[] = [];
  private config: AlertConfig;

  constructor(config: Partial<AlertConfig> = {}) {
    this.config = { ...DEFAULT_ALERT_CONFIG, ...config };
  }

  /**
   * Generate alert for a new promotion.
   */
  onPromotionCreated(promotion: Promotion): PromotionAlert | null {
    return this.createAlert({
      promotionId: promotion.id,
      eventType: "promotion.created",
      reason: `Nova promoção: ${promotion.title} (${promotion.program})`,
      source: promotion.source.sourceId,
    });
  }

  /**
   * Generate alert for an updated promotion.
   */
  onPromotionUpdated(promotion: Promotion, changes: string[]): PromotionAlert | null {
    const reason = `Promoção atualizada: ${promotion.title}. Alterações: ${changes.join(", ")}`;
    return this.createAlert({
      promotionId: promotion.id,
      eventType: "promotion.updated",
      reason,
      source: promotion.source.sourceId,
    });
  }

  /**
   * Generate alert for a promotion expiring soon.
   */
  onPromotionExpiring(promotion: Promotion): PromotionAlert | null {
    const daysLeft = promotion.endDate
      ? Math.ceil((new Date(promotion.endDate).getTime() - Date.now()) / 86400000)
      : -1;

    return this.createAlert({
      promotionId: promotion.id,
      eventType: "promotion.expiring",
      reason: `Promoção "${promotion.title}" expira em ${daysLeft} dias`,
      source: promotion.source.sourceId,
    });
  }

  /**
   * Generate alert for an expired promotion.
   */
  onPromotionExpired(promotion: Promotion): PromotionAlert | null {
    return this.createAlert({
      promotionId: promotion.id,
      eventType: "promotion.expired",
      reason: `Promoção "${promotion.title}" expirou`,
      source: promotion.source.sourceId,
    });
  }

  /**
   * Generate alert for a rejected promotion.
   */
  onPromotionRejected(promotion: Promotion, reason: string): PromotionAlert | null {
    return this.createAlert({
      promotionId: promotion.id,
      eventType: "promotion.rejected",
      reason: `Promoção rejeitada: ${promotion.title}. Motivo: ${reason}`,
      source: promotion.source.sourceId,
    });
  }

  /**
   * Check for promotions that are expiring.
   */
  checkExpiringPromotions(promotions: Promotion[]): PromotionAlert[] {
    const now = Date.now();
    const thresholdMs = this.config.expiringThresholdDays * 86400000;
    const alerts: PromotionAlert[] = [];

    for (const promo of promotions) {
      if (!promo.endDate || promo.status !== "active") continue;

      const endDate = new Date(promo.endDate).getTime();
      const daysLeft = (endDate - now) / 86400000;

      if (daysLeft > 0 && daysLeft <= this.config.expiringThresholdDays) {
        const alert = this.onPromotionExpiring(promo);
        if (alert) alerts.push(alert);
      }
    }

    return alerts;
  }

  /**
   * Create an alert with deduplication.
   */
  private createAlert(params: {
    promotionId: string;
    eventType: AlertEventType;
    reason: string;
    source: string;
  }): PromotionAlert | null {
    // Check for duplicate
    const recentDuplicate = this.alerts.find(
      (a) =>
        a.promotionId === params.promotionId &&
        a.eventType === params.eventType &&
        Date.now() - new Date(a.timestamp).getTime() < this.config.deduplicateWindowMs,
    );

    if (recentDuplicate) return null;

    const alert: PromotionAlert = {
      alertId: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      promotionId: params.promotionId,
      eventType: params.eventType,
      reason: params.reason,
      timestamp: new Date().toISOString(),
      source: params.source,
      acknowledged: false,
    };

    this.alerts.push(alert);
    return alert;
  }

  /**
   * Get all alerts.
   */
  getAllAlerts(): PromotionAlert[] {
    return [...this.alerts];
  }

  /**
   * Get unacknowledged alerts.
   */
  getUnacknowledgedAlerts(): PromotionAlert[] {
    return this.alerts.filter((a) => !a.acknowledged);
  }

  /**
   * Get alerts by promotion ID.
   */
  getAlertsByPromotion(promotionId: string): PromotionAlert[] {
    return this.alerts.filter((a) => a.promotionId === promotionId);
  }

  /**
   * Acknowledge an alert.
   */
  acknowledge(alertId: string): void {
    const alert = this.alerts.find((a) => a.alertId === alertId);
    if (alert) alert.acknowledged = true;
  }

  /**
   * Get alert statistics.
   */
  getStats(): {
    total: number;
    unacknowledged: number;
    byType: Record<AlertEventType, number>;
  } {
    const byType = {} as Record<AlertEventType, number>;
    for (const alert of this.alerts) {
      byType[alert.eventType] = (byType[alert.eventType] || 0) + 1;
    }

    return {
      total: this.alerts.length,
      unacknowledged: this.alerts.filter((a) => !a.acknowledged).length,
      byType,
    };
  }
}
