/**
 * metrics.ts — Graph Query Metrics (P11-04 Graph & Context Intelligence).
 *
 * Coleta métricas de query do grafo: contagem, duração (p50/p95/p99),
 * nós/arestas varridos, multi-hop, cache hit e reuse de contexto.
 * Funções puras e determinísticas — insumo do readiness (P11-07) e do
 * comparativo Graph Value (P11-04).
 */

export interface GraphQueryMetric {
  queryId: string;
  /** Alvo da query (arquivo/símbolo) ou "global". */
  target: string;
  durationMs: number;
  nodesScanned: number;
  edgesScanned: number;
  /** Quantos hops foram percorridos (1 = query direta). */
  hopCount: number;
  resultSize: number;
  /** Cache hit? (reuso de resultado dentro do run). */
  cacheHit: boolean;
  /** Contexto reutilizado (tokens) desta query para o packet. */
  contextReuseTokens: number;
  timestamp: string;
}

/** Agrega durções em percentil p (0..100) — lista vazia → null. */
export function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

export interface GraphMetricsSummary {
  queryCount: number;
  totalDurationMs: number;
  p50Ms: number | null;
  p95Ms: number | null;
  p99Ms: number | null;
  avgNodesScanned: number;
  totalEdgesScanned: number;
  avgHopCount: number;
  /** % de queries multi-hop (hopCount > 1). */
  multiHopRatio: number;
  cacheHitRate: number;
  /** Tokens de contexto reutilizados no total. */
  contextReuseTokens: number;
}

/** Resumo agregado de uma lista de métricas (P11-04). */
export function summarizeGraphMetrics(metrics: GraphQueryMetric[]): GraphMetricsSummary {
  if (metrics.length === 0) {
    return {
      queryCount: 0,
      totalDurationMs: 0,
      p50Ms: null,
      p95Ms: null,
      p99Ms: null,
      avgNodesScanned: 0,
      totalEdgesScanned: 0,
      avgHopCount: 0,
      multiHopRatio: 0,
      cacheHitRate: 0,
      contextReuseTokens: 0,
    };
  }
  const durations = metrics.map((m) => m.durationMs);
  const multiHop = metrics.filter((m) => m.hopCount > 1).length;
  const cacheHits = metrics.filter((m) => m.cacheHit).length;
  return {
    queryCount: metrics.length,
    totalDurationMs: durations.reduce((a, b) => a + b, 0),
    p50Ms: percentile(durations, 50),
    p95Ms: percentile(durations, 95),
    p99Ms: percentile(durations, 99),
    avgNodesScanned:
      Math.round((metrics.reduce((a, m) => a + m.nodesScanned, 0) / metrics.length) * 10) / 10,
    totalEdgesScanned: metrics.reduce((a, m) => a + m.edgesScanned, 0),
    avgHopCount:
      Math.round((metrics.reduce((a, m) => a + m.hopCount, 0) / metrics.length) * 10) / 10,
    multiHopRatio: Math.round((multiHop / metrics.length) * 100) / 100,
    cacheHitRate: Math.round((cacheHits / metrics.length) * 100) / 100,
    contextReuseTokens: metrics.reduce((a, m) => a + m.contextReuseTokens, 0),
  };
}

/** Cache simples de queries por alvo (context reuse dentro do run). */
export class GraphQueryCache {
  private cache = new Map<string, { result: unknown; timestamp: string }>();

  get(key: string): { result: unknown; timestamp: string } | undefined {
    return this.cache.get(key);
  }

  set(key: string, result: unknown): void {
    this.cache.set(key, { result, timestamp: new Date().toISOString() });
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  get size(): number {
    return this.cache.size;
  }

  clear(): void {
    this.cache.clear();
  }
}
