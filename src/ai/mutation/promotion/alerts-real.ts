/**
 * P12.6-13 — Alert Engine with Real Telemetry
 *
 * Eventos: created, updated, expiring, expired, rejected
 * Cada evento gera telemetry real via emitTelemetryEvent.
 */

import type { Promotion } from "./types";
import {
  emitTelemetryEvent,
  type MutationTelemetryEvent,
  type MutationTelemetryEventType,
} from "../telemetry-events";

// ─── Alert Types ───────────────────────────────────────────────

export type AlertEventType =
  | "promotion.created"
  | "promotion.updated"
  | "promotion.expiring"
  | "promotion.expired"
  | "promotion.rejected";

export interface PromotionAlert {
  alertId: string;
  eventId: AlertEventType;
  promotionId: string;
  sourceId: string;
  timestamp: string;
  changedFields?: string[];
  confidence: string;
  message: string;
  read: boolean;
}

// ─── Alert Engine ──────────────────────────────────────────────

export class AlertEngineReal {
  private alerts: PromotionAlert[] = [];
  private emittedEvents: MutationTelemetryEvent[] = [];

  /**
   * Process a promotion and generate alerts if needed.
   */
  processPromotion(promotion: Promotion, previousVersion?: Partial<Promotion>): PromotionAlert[] {
    const newAlerts: PromotionAlert[] = [];

    if (!previousVersion) {
      // New promotion
      const alert = this.createAlert(
        "promotion.created",
        promotion.id,
        promotion.sourceId,
        `New promotion: ${promotion.title}`,
        promotion.confidence,
      );
      newAlerts.push(alert);
    } else {
      // Check for changes
      const changedFields = this.detectChanges(previousVersion, promotion);

      if (changedFields.length > 0) {
        const alert = this.createAlert(
          "promotion.updated",
          promotion.id,
          promotion.sourceId,
          `Promotion updated: ${changedFields.join(", ")}`,
          promotion.confidence,
          changedFields,
        );
        newAlerts.push(alert);
      }

      // Check if expired
      if (promotion.endDate) {
        const endDate = new Date(promotion.endDate);
        const now = new Date();
        const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / 86400000);

        if (daysLeft <= 0 && previousVersion.status !== "expired") {
          const alert = this.createAlert(
            "promotion.expired",
            promotion.id,
            promotion.sourceId,
            `Promotion expired on ${promotion.endDate}`,
            "HIGH",
          );
          newAlerts.push(alert);
        } else if (daysLeft <= 3 && daysLeft > 0) {
          const alert = this.createAlert(
            "promotion.expiring",
            promotion.id,
            promotion.sourceId,
            `Promotion expires in ${daysLeft} days`,
            "MEDIUM",
          );
          newAlerts.push(alert);
        }
      }

      // Check if rejected
      if (promotion.status === "rejected" && previousVersion.status !== "rejected") {
        const alert = this.createAlert(
          "promotion.rejected",
          promotion.id,
          promotion.sourceId,
          `Promotion rejected`,
          "HIGH",
        );
        newAlerts.push(alert);
      }
    }

    this.alerts.push(...newAlerts);
    return newAlerts;
  }

  /**
   * Get all alerts.
   */
  getAlerts(): PromotionAlert[] {
    return [...this.alerts];
  }

  /**
   * Get alerts by event type.
   */
  getAlertsByType(eventType: AlertEventType): PromotionAlert[] {
    return this.alerts.filter((a) => a.eventId === eventType);
  }

  /**
   * Get unread alerts.
   */
  getUnreadAlerts(): PromotionAlert[] {
    return this.alerts.filter((a) => !a.read);
  }

  /**
   * Mark alert as read.
   */
  markRead(alertId: string): void {
    const alert = this.alerts.find((a) => a.alertId === alertId);
    if (alert) alert.read = true;
  }

  /**
   * Get telemetry events emitted by this engine.
   */
  getEmittedEvents(): MutationTelemetryEvent[] {
    return [...this.emittedEvents];
  }

  /**
   * Get alert summary.
   */
  getSummary(): {
    total: number;
    unread: number;
    byType: Record<string, number>;
  } {
    const byType: Record<string, number> = {};
    for (const alert of this.alerts) {
      byType[alert.eventId] = (byType[alert.eventId] || 0) + 1;
    }

    return {
      total: this.alerts.length,
      unread: this.alerts.filter((a) => !a.read).length,
      byType,
    };
  }

  // ─── Private ──────────────────────────────────────────────

  private createAlert(
    eventId: AlertEventType,
    promotionId: string,
    sourceId: string,
    message: string,
    confidence: string,
    changedFields?: string[],
  ): PromotionAlert {
    const alert: PromotionAlert = {
      alertId: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      eventId,
      promotionId,
      sourceId,
      timestamp: new Date().toISOString(),
      changedFields,
      confidence,
      message,
      read: false,
    };

    // Emit telemetry event (P12.6-13)
    const telemetryEvent = emitTelemetryEvent(eventId as MutationTelemetryEventType, {
      promotionId,
      sourceId,
      agent: "alert-engine",
      status: "success",
      metadata: {
        alertId: alert.alertId,
        changedFields,
        confidence,
        message,
      },
    });

    this.emittedEvents.push(telemetryEvent);

    return alert;
  }

  private detectChanges(previous: Partial<Promotion>, current: Promotion): string[] {
    const changes: string[] = [];

    if (previous.title !== current.title) changes.push("title");
    if (previous.bonusPercentage !== current.bonusPercentage) changes.push("bonus");
    if (previous.endDate !== current.endDate) changes.push("endDate");
    if (previous.startDate !== current.startDate) changes.push("startDate");
    if (previous.description !== current.description) changes.push("description");
    if (previous.terms !== current.terms) changes.push("terms");
    if (previous.status !== current.status) changes.push("status");
    if (previous.confidence !== current.confidence) changes.push("confidence");

    return changes;
  }
}
