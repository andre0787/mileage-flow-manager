/**
 * P12.6-15 — Promotion Scout
 *
 * Role especializada que descobre promoções em fontes registradas.
 * Fluxo: Source Registry → Scout → source → detect changes → candidate promotion
 */

import type { PromotionSource } from "./types";

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

export interface ScoutConfig {
  maxRetries: number;
  timeoutMs: number;
  userAgent: string;
  respectRobots: boolean;
  cacheTtlMs: number;
}

const DEFAULT_SCOUT_CONFIG: ScoutConfig = {
  maxRetries: 3,
  timeoutMs: 30000,
  userAgent: "MilesControl-PromotionScout/1.0",
  respectRobots: true,
  cacheTtlMs: 300000,
};

export class PromotionScout {
  private config: ScoutConfig;
  private cache = new Map<string, { content: string; timestamp: number }>();

  constructor(config: Partial<ScoutConfig> = {}) {
    this.config = { ...DEFAULT_SCOUT_CONFIG, ...config };
  }

  async scout(source: PromotionSource): Promise<ScoutRun> {
    const run: ScoutRun = {
      runId: `scout-${source.sourceId}-${Date.now()}`,
      sourceId: source.sourceId,
      startedAt: new Date().toISOString(),
      candidates: [],
      status: "running",
    };

    try {
      if (!this.config.respectRobots) {
        throw new Error("Scout requires respectRobots=true");
      }

      const candidates = await this.collectFromSource(source);
      run.candidates = candidates;
      run.status = "success";
      run.completedAt = new Date().toISOString();
    } catch (error) {
      run.status = "failure";
      run.error = String(error);
      run.completedAt = new Date().toISOString();
    }

    return run;
  }

  private async collectFromSource(source: PromotionSource): Promise<ScoutCandidate[]> {
    switch (source.collectionMethod) {
      case "passageiro_de_primeira":
      case "api":
      case "feed":
        return this.collectCandidate(source);
      default:
        return [];
    }
  }

  private async collectCandidate(source: PromotionSource): Promise<ScoutCandidate[]> {
    const rawContent = await this.fetchContent(source.officialUrl);
    if (!rawContent) return [];

    return [
      {
        candidateId: `candidate-${source.sourceId}-${Date.now()}`,
        sourceId: source.sourceId,
        sourceUrl: source.officialUrl,
        discoveryType: "new_promotion",
        rawContent,
        detectedAt: new Date().toISOString(),
      },
    ];
  }

  private async fetchContent(url: string): Promise<string | null> {
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < this.config.cacheTtlMs) {
      return cached.content;
    }

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

        const content = await response.text();
        this.cache.set(url, { content, timestamp: Date.now() });
        return content;
      } catch (error) {
        lastError = error as Error;
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }

    throw lastError || new Error("Failed to fetch content");
  }
}
