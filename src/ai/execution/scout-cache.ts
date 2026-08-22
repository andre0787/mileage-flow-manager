/**
 * scout-cache.ts — Scout Result Cache (P13-02 Agent Bottleneck Optimization).
 *
 * Cacheia resultados de scouts (graph, domain, test, history) por target.
 * Reduz chamadas redundantes ao grafo/CRG — principal gargalo (60% do tempo
 * de agent bottleneck no P12). TTL configurável; fail-open: sem cache → roda
 * normalmente.
 */

import type { GraphScoutResult, DomainScoutResult, TestScoutResult, HistoryScoutResult } from "./scouts";

type ScoutResult = GraphScoutResult | DomainScoutResult | TestScoutResult | HistoryScoutResult;

interface CacheEntry {
  result: ScoutResult;
  timestamp: number;
}

/** TTL padrão: 5 minutos (scout results não mudam frequentemente). */
const DEFAULT_TTL_MS = 5 * 60 * 1000;

export class ScoutCache {
  private cache = new Map<string, CacheEntry>();
  private ttlMs: number;

  constructor(ttlMs: number = DEFAULT_TTL_MS) {
    this.ttlMs = ttlMs;
  }

  /** Chave de cache: role + target (normalizado). */
  private key(role: string, target?: string): string {
    return `${role}::${(target ?? "").toLowerCase().trim()}`;
  }

  /** Retorna resultado cacheado ou undefined se ausente/expirado. */
  get(role: string, target?: string): ScoutResult | undefined {
    const entry = this.cache.get(this.key(role, target));
    if (!entry) return undefined;
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(this.key(role, target));
      return undefined;
    }
    return entry.result;
  }

  /** Armazena resultado no cache. */
  set(role: string, target: string | undefined, result: ScoutResult): void {
    this.cache.set(this.key(role, target), {
      result,
      timestamp: Date.now(),
    });
  }

  /** Retorna true se há resultado cacheado válido para role+target. */
  has(role: string, target?: string): boolean {
    return this.get(role, target) !== undefined;
  }

  /** Limpa todo o cache. */
  clear(): void {
    this.cache.clear();
  }

  /** Número de entradas válidas (não expiradas). */
  get size(): number {
    let count = 0;
    const now = Date.now();
    for (const entry of this.cache.values()) {
      if (now - entry.timestamp <= this.ttlMs) count++;
    }
    return count;
  }

  /** Remove entradas expiradas (garbage collection manual). */
  gc(): number {
    const now = Date.now();
    let removed = 0;
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.ttlMs) {
        this.cache.delete(key);
        removed++;
      }
    }
    return removed;
  }
}

/** Instância global singleton do cache de scouts. */
export const globalScoutCache = new ScoutCache();
