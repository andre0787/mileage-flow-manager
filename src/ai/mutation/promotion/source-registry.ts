/**
 * P12.6-14 — Source Registry
 *
 * Não codificar fontes diretamente em dezenas de collectors independentes.
 * Criar um registro central de fontes com saúde, confiabilidade e agendamento.
 *
 * Fontes iniciais: Livelo, Smiles, LATAM Pass, Azul Fidelidade.
 * Passageiro de Primeira como fonte agregadora primária de descoberta.
 */

import type { PromotionSource, SourceHealth, SourceType, CollectionMethod } from "./types";

// ─── Default Sources ───────────────────────────────────────────

export const DEFAULT_SOURCES: PromotionSource[] = [
  {
    sourceId: "livelo-official",
    program: "Livelo",
    type: "official",
    officialUrl: "https://www.livelo.com.br/promocoes",
    collectionMethod: "passageiro_de_primeira",
    collectionFrequency: "6h",
    enabled: true,
    reliability: 0.95,
    health: "FRESH",
    priority: 1,
    freshnessTarget: 24,
  },
  {
    sourceId: "smiles-official",
    program: "Smiles",
    type: "official",
    officialUrl: "https://www.smiles.com.br/promocoes",
    collectionMethod: "passageiro_de_primeira",
    collectionFrequency: "6h",
    enabled: true,
    reliability: 0.95,
    health: "FRESH",
    priority: 1,
    freshnessTarget: 24,
  },
  {
    sourceId: "latam-pass-official",
    program: "LATAM Pass",
    type: "official",
    officialUrl: "https://www.latamairlines.com/br/pt/latam-pass/promocoes",
    collectionMethod: "passageiro_de_primeira",
    collectionFrequency: "12h",
    enabled: true,
    reliability: 0.9,
    health: "FRESH",
    priority: 2,
    freshnessTarget: 48,
  },
  {
    sourceId: "azul-fidelidade-official",
    program: "Azul Fidelidade",
    type: "official",
    officialUrl: "https://www.voegol.com.br/azulfidelidade",
    collectionMethod: "passageiro_de_primeira",
    collectionFrequency: "12h",
    enabled: true,
    reliability: 0.85,
    health: "FRESH",
    priority: 2,
    freshnessTarget: 48,
  },
  {
    sourceId: "passageiro-de-primeira",
    program: "Agregator",
    type: "partner",
    officialUrl: "https://www.passageirodeprimeira.com.br",
    collectionMethod: "passageiro_de_primeira",
    collectionFrequency: "4h",
    enabled: true,
    reliability: 0.88,
    health: "FRESH",
    priority: 0,
    freshnessTarget: 12,
  },
];

// ─── Source Registry Manager ───────────────────────────────────

export class SourceRegistry {
  private sources: Map<string, PromotionSource> = new Map();

  constructor(initialSources: PromotionSource[] = DEFAULT_SOURCES) {
    for (const source of initialSources) {
      this.sources.set(source.sourceId, source);
    }
  }

  /**
   * Register a new source.
   */
  register(source: PromotionSource): void {
    this.sources.set(source.sourceId, source);
  }

  /**
   * Update source health after a collection run.
   */
  updateHealth(sourceId: string, health: SourceHealth, error?: string): void {
    const source = this.sources.get(sourceId);
    if (!source) return;

    source.health = health;
    source.lastError = error;

    if (health === "FRESH" || health === "STALE") {
      source.lastSuccessfulRun = new Date().toISOString();
      source.retryCount = 0;
    } else if (health === "DEGRADED" || health === "OFFLINE") {
      source.retryCount = (source.retryCount || 0) + 1;
    }
  }

  /**
   * Get all enabled sources.
   */
  getEnabledSources(): PromotionSource[] {
    return Array.from(this.sources.values()).filter((s) => s.enabled);
  }

  /**
   * Get source by ID.
   */
  getSource(sourceId: string): PromotionSource | undefined {
    return this.sources.get(sourceId);
  }

  /**
   * Get all sources.
   */
  getAllSources(): PromotionSource[] {
    return Array.from(this.sources.values());
  }

  /**
   * Get sources by program.
   */
  getSourcesByProgram(program: string): PromotionSource[] {
    return Array.from(this.sources.values()).filter((s) => s.program === program);
  }

  /**
   * Disable a source.
   */
  disable(sourceId: string): void {
    const source = this.sources.get(sourceId);
    if (source) source.enabled = false;
  }

  /**
   * Enable a source.
   */
  enable(sourceId: string): void {
    const source = this.sources.get(sourceId);
    if (source) source.enabled = true;
  }

  /**
   * Calculate next scheduled run based on frequency.
   */
  calculateNextRun(source: PromotionSource): string {
    const freq = source.collectionFrequency;
    const match = freq.match(/^(\d+)(h|d)$/);
    if (!match) return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const amount = parseInt(match[1], 10);
    const unit = match[2];
    const ms = unit === "h" ? amount * 3600000 : amount * 86400000;

    return new Date(Date.now() + ms).toISOString();
  }

  /**
   * Get source health summary.
   */
  getHealthSummary(): Array<{
    sourceId: string;
    program: string;
    health: SourceHealth;
    reliability: number;
    lastRun?: string;
  }> {
    return Array.from(this.sources.values()).map((s) => ({
      sourceId: s.sourceId,
      program: s.program,
      health: s.health,
      reliability: s.reliability,
      lastRun: s.lastSuccessfulRun,
    }));
  }
}
