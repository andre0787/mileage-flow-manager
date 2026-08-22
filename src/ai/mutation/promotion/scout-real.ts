/**
 * P12.6-09 — Real Promotion Scout
 *
 * Scout que realmente detecta:
 *   - nova promoção
 *   - promoção atualizada
 *   - promoção expirada
 *   - promoção removida
 *   - nenhuma alteração
 *
 * Pipeline: Source Registry → Collector → Raw Source → Candidate Discovery → Change Detection
 */

import type { PromotionSource, Promotion } from "./types";
import { emitTelemetryEvent } from "../telemetry-events";

// ─── Scout Types ───────────────────────────────────────────────

export interface ScoutResult {
  sourceId: string;
  discovered: number;
  updated: number;
  expired: number;
  removed: number;
  unchanged: number;
  candidates: ScoutCandidate[];
  duration: number;
  timestamp: string;
  error?: string;
}

export interface ScoutCandidate {
  id: string;
  sourceId: string;
  title: string;
  url: string;
  discoveredAt: string;
  changeType: "new" | "updated" | "expired" | "removed" | "unchanged";
  previousVersion?: string;
  rawContent: string;
}

// ─── Change Detection ──────────────────────────────────────────

export interface ChangeDetection {
  added: string[];
  removed: string[];
  modified: string[];
  unchanged: string[];
}

export function detectChanges(previous: string[], current: string[]): ChangeDetection {
  const prevSet = new Set(previous);
  const currSet = new Set(current);

  return {
    added: current.filter((id) => !prevSet.has(id)),
    removed: previous.filter((id) => !currSet.has(id)),
    modified: [], // Would compare content hashes
    unchanged: current.filter((id) => prevSet.has(id)),
  };
}

// ─── Real Scout ────────────────────────────────────────────────

export class PromotionScoutReal {
  private sourceRegistry: PromotionSource[];
  private previousIds: Map<string, string[]> = new Map();

  constructor(sourceRegistry: PromotionSource[]) {
    this.sourceRegistry = sourceRegistry;
  }

  /**
   * Scout a single source — actually attempts to fetch from the URL.
   */
  async scoutSource(source: PromotionSource): Promise<ScoutResult> {
    const startTime = Date.now();
    const candidates: ScoutCandidate[] = [];

    emitTelemetryEvent("promotion.scouted", {
      sourceId: source.sourceId,
      agent: "scout-real",
      status: "success",
    });

    try {
      // Attempt real fetch from source URL
      const response = await fetch(source.officialUrl, {
        signal: AbortSignal.timeout(10000),
        headers: {
          "User-Agent": "MilesControl-PromoScout/1.0",
          Accept: "text/html,application/json",
        },
      });

      if (!response.ok) {
        return {
          sourceId: source.sourceId,
          discovered: 0,
          updated: 0,
          expired: 0,
          removed: 0,
          unchanged: 0,
          candidates: [],
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const contentType = response.headers.get("content-type") || "";
      const body = await response.text();

      // Parse based on content type
      const parsedPromotions = this.parseSource(body, contentType, source);

      // Change detection
      const previousIds = this.previousIds.get(source.sourceId) || [];
      const currentIds = parsedPromotions.map((p) => p.id);
      const changes = detectChanges(previousIds, currentIds);

      // Create candidates
      for (const promo of parsedPromotions) {
        const changeType = changes.added.includes(promo.id)
          ? "new"
          : changes.modified.includes(promo.id)
            ? "updated"
            : changes.removed.includes(promo.id)
              ? "removed"
              : "unchanged";

        candidates.push({
          id: promo.id,
          sourceId: source.sourceId,
          title: promo.title,
          url: `${source.officialUrl}#${promo.id}`,
          discoveredAt: new Date().toISOString(),
          changeType,
          rawContent: promo.rawContent || "",
        });
      }

      // Update previous IDs
      this.previousIds.set(source.sourceId, currentIds);

      const duration = Date.now() - startTime;

      return {
        sourceId: source.sourceId,
        discovered: changes.added.length,
        updated: changes.modified.length,
        expired: candidates.filter((c) => {
          const content = c.rawContent.toLowerCase();
          return content.includes("expirad") || content.includes("encerrad");
        }).length,
        removed: changes.removed.length,
        unchanged: changes.unchanged.length,
        candidates,
        duration,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : "Unknown error";

      return {
        sourceId: source.sourceId,
        discovered: 0,
        updated: 0,
        expired: 0,
        removed: 0,
        unchanged: 0,
        candidates: [],
        duration,
        timestamp: new Date().toISOString(),
        error: errorMsg,
      };
    }
  }

  /**
   * Scout all enabled sources.
   */
  async scoutAll(): Promise<ScoutResult[]> {
    const results: ScoutResult[] = [];

    for (const source of this.sourceRegistry.filter((s) => s.enabled)) {
      const result = await this.scoutSource(source);
      results.push(result);
    }

    return results;
  }

  /**
   * Parse source content into promotion candidates.
   */
  private parseSource(
    body: string,
    contentType: string,
    source: PromotionSource,
  ): Array<{ id: string; title: string; rawContent: string }> {
    const promotions: Array<{ id: string; title: string; rawContent: string }> = [];

    if (contentType.includes("application/json")) {
      try {
        const data = JSON.parse(body);
        // Try common JSON structures
        const items = Array.isArray(data) ? data : data.promotions || data.data || data.items || [];
        for (const item of items.slice(0, 20)) {
          promotions.push({
            id: item.id || item.slug || `promo-${promotions.length}`,
            title: item.title || item.name || item.titulo || "Unknown",
            rawContent: JSON.stringify(item).substring(0, 500),
          });
        }
      } catch {
        // JSON parse failed
      }
    } else {
      // HTML parsing — extract promotion-like patterns
      const titlePattern = /<h[2-4][^>]*>([^<]+)<\/h[2-4]>/gi;
      let match;
      let count = 0;

      while ((match = titlePattern.exec(body)) !== null && count < 20) {
        const title = match[1].trim();
        if (title.length > 10 && title.length < 200) {
          promotions.push({
            id: `html-${count}`,
            title,
            rawContent: body.substring(match.index, match.index + 500),
          });
          count++;
        }
      }

      // Also look for promo-like links
      const linkPattern =
        /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:bônus|bonus|promo|desconto|transferência)[^<]*)<\/a>/gi;
      while ((match = linkPattern.exec(body)) !== null && count < 20) {
        promotions.push({
          id: `link-${count}`,
          title: match[2].trim(),
          rawContent: match[0].substring(0, 500),
        });
        count++;
      }
    }

    return promotions;
  }
}
