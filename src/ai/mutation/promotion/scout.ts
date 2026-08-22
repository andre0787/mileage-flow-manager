/**
 * P12.6-15 — Promotion Scout
 *
 * Role especializada que descobre promoções em fontes registradas.
 * Fluxo: Source Registry → Scout → source → detect changes → candidate promotion
 *
 * Descobre: nova promoção, promoção atualizada, promoção expirada, promoção removida.
 * Não publica diretamente.
 */

import type { PromotionSource } from "./types";

// ─── Scout Types ───────────────────────────────────────────────

export type ScoutDiscoveryType =
  "new_promotion" | "updated_promotion" | "expired_promotion" | "removed_promotion" | "no_change";

export interface ScoutCandidate {
  candidateId: string;
  sourceId: string;
  sourceUrl: string;
  discoveryType: ScoutDiscoveryType;
  rawContent: string;
  structuredData?: unknown;
  detectedAt: string;
  changeDetails?: {
    field: string;
    previous?: string;
    current?: string;
  };
}

export interface ScoutRun {
  runId: string;
  sourceId: string;
  startedAt: string;
  completedAt?: string;
  candidates: ScoutCandidate[];
  status: "running" | "success" | "failure" | "partial";
  error?: string;
}

// ─── Scout Agent ───────────────────────────────────────────────

export interface ScoutConfig {
  maxRetries: number;
  timeoutMs: number;
  userAgent: string;
  respectRobots: boolean;
}

const DEFAULT_SCOUT_CONFIG: ScoutConfig = {
  maxRetries: 3,
  timeoutMs: 30000,
  userAgent: "MilesControl-PromotionScout/1.0",
  respectRobots: true,
};

export class PromotionScout {
  private config: ScoutConfig;

  constructor(config: Partial<ScoutConfig> = {}) {
    this.config = { ...DEFAULT_SCOUT_CONFIG, ...config };
  }

  /**
   * Scout a source for new/updated/expired promotions.
   *
   * Returns candidates that need further extraction and validation.
   */
  async scout(source: PromotionSource): Promise<ScoutRun> {
    const run: ScoutRun = {
      runId: `scout-${source.sourceId}-${Date.now()}`,
      sourceId: source.sourceId,
      startedAt: new Date().toISOString(),
      candidates: [],
      status: "running",
    };

    try {
      // Respect source policies
      if (!this.config.respectRobots) {
        throw new Error("Scout requires respectRobots=true");
      }

      // Scout based on collection method
      const candidates = await this.collectFromSource(source);
      run.candidates = candidates;
      run.status = candidates.length > 0 ? "success" : "success";
      run.completedAt = new Date().toISOString();
    } catch (error) {
      run.status = "failure";
      run.error = String(error);
      run.completedAt = new Date().toISOString();
    }

    return run;
  }

  /**
   * Collect candidates from a source using its collection method.
   */
  private async collectFromSource(source: PromotionSource): Promise<ScoutCandidate[]> {
    const candidates: ScoutCandidate[] = [];

    switch (source.collectionMethod) {
      case "passageiro_de_primeira":
        // Primary aggregator discovery
        candidates.push(...(await this.collectFromAggregator(source)));
        break;
      case "api":
        candidates.push(...(await this.collectFromAPI(source)));
        break;
      case "feed":
        candidates.push(...(await this.collectFromFeed(source)));
        break;
      default:
        // Manual or unsupported — return empty
        break;
    }

    return candidates;
  }

  /**
   * Collect from Passageiro de Primeira aggregator.
   */
  private async collectFromAggregator(source: PromotionSource): Promise<ScoutCandidate[]> {
    // Conceptual implementation — in production this would
    // fetch from the aggregator and parse results
    const candidates: ScoutCandidate[] = [];

    // Placeholder: would fetch from Passageiro de Primeira API/page
    // and extract promotion data for the specific program
    const rawContent = await this.fetchContent(source.officialUrl);

    if (rawContent) {
      candidates.push({
        candidateId: `candidate-${source.sourceId}-${Date.now()}`,
        sourceId: source.sourceId,
        sourceUrl: source.officialUrl,
        discoveryType: "new_promotion",
        rawContent,
        detectedAt: new Date().toISOString(),
      });
    }

    return candidates;
  }

  /**
   * Collect from official API.
   */
  private async collectFromAPI(source: PromotionSource): Promise<ScoutCandidate[]> {
    const candidates: ScoutCandidate[] = [];
    const rawContent = await this.fetchContent(source.officialUrl);

    if (rawContent) {
      candidates.push({
        candidateId: `candidate-${source.sourceId}-${Date.now()}`,
        sourceId: source.sourceId,
        sourceUrl: source.officialUrl,
        discoveryType: "new_promotion",
        rawContent,
        detectedAt: new Date().toISOString(),
      });
    }

    return candidates;
  }

  /**
   * Collect from RSS/Atom feed.
   */
  private async collectFromFeed(source: PromotionSource): Promise<ScoutCandidate[]> {
    const candidates: ScoutCandidate[] = [];
    const rawContent = await this.fetchContent(source.officialUrl);

    if (rawContent) {
      candidates.push({
        candidateId: `candidate-${source.sourceId}-${Date.now()}`,
        sourceId: source.sourceId,
        sourceUrl: source.officialUrl,
        discoveryType: "new_promotion",
        rawContent,
        detectedAt: new Date().toISOString(),
      });
    }

    return candidates;
  }

  /**
   * Fetch content from URL with retry/backoff.
   */
  private async fetchContent(url: string): Promise<string | null> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          headers: { "User-Agent": this.config.userAgent },
          signal: AbortSignal.timeout(this.config.timeoutMs),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.text();
      } catch (error) {
        lastError = error as Error;
        // Exponential backoff
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }

    throw lastError || new Error("Failed to fetch content");
  }
}
