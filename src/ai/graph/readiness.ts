/**
 * readiness.ts — Neo4j Readiness Evolution (P11-07).
 *
 * Transforma readiness em decisão baseada em workload REAL: métricas
 * (nodes, edges, query p95, multi-hop, concurrency, complexidade), score
 * 0-100 com thresholds configuráveis, histórico persistido (snapshots) e
 * trend — sem nunca instalar/migrar para Neo4j automaticamente. O
 * validator mede, calcula, explica e recomenda.
 */

/** Métricas de workload observadas (P11-07). */
export interface Neo4jWorkloadMetrics {
  nodes: number;
  edges: number;
  /** Percentual de queries multi-hop (0..1). */
  multiHopRatio: number;
  queryP95Ms: number | null;
  concurrency: number;
  /** Nós médios varridos por query. */
  scannedNodes: number;
  /** Crescimento de nós entre snapshots (%). */
  growthPct: number;
}

/** Snapshot persistido do estado de readiness (spec §P11-07 — histórico). */
export interface Neo4jReadinessSnapshot {
  timestamp: string;
  nodeCount: number;
  edgeCount: number;
  queryP95Ms: number | null;
  multiHopRatio: number;
  concurrency: number;
  needScore: number; // 0..100
}

export interface Neo4jReadinessThresholds {
  /** Score 0-39: local suficiente. */
  localMax: number;
  /** 40-69: monitorar. */
  monitorMax: number;
  /** 70-84: preparar PoC. */
  preparePocMax: number;
  /** 85+: migração justificada. */
  migrationMin: number;
}

export const DEFAULT_READINESS_THRESHOLDS: Neo4jReadinessThresholds = {
  localMax: 39,
  monitorMax: 69,
  preparePocMax: 84,
  migrationMin: 85,
};

export type ReadinessBand = "local" | "monitor" | "prepare-poc" | "migration-justified";

export interface Neo4jReadinessResult {
  score: number; // 0..100
  band: ReadinessBand;
  metrics: Neo4jWorkloadMetrics;
  recommendation: string;
  /** Trend vs último snapshot (maior/menor/estável). */
  trend: "up" | "down" | "stable" | "no-history";
  history: Neo4jReadinessSnapshot[];
}

/** Score composto 0..100 a partir das métricas de workload (P11-07). */
export function computeNeedScore(metrics: Neo4jWorkloadMetrics): number {
  if (metrics.nodes === 0) return 0;
  // Densidade de arestas (0..50 pts)
  const density = Math.min(1, metrics.edges / Math.max(1, metrics.nodes * 2));
  const densityScore = density * 50;
  // Multi-hop (0..25 pts)
  const multiHopScore = Math.min(1, metrics.multiHopRatio) * 25;
  // Complexidade (0..25 pts): nós varridos + concurrency + p95
  const scannedScore = Math.min(1, metrics.scannedNodes / 500) * 10;
  const concurrencyScore = Math.min(1, metrics.concurrency / 10) * 8;
  const p95Score = metrics.queryP95Ms === null ? 0 : Math.min(1, metrics.queryP95Ms / 500) * 7;
  const complexityScore = scannedScore + concurrencyScore + p95Score;
  return Math.round(densityScore + multiHopScore + complexityScore);
}

/** Classifica o score em banda com thresholds configuráveis. */
export function readinessBand(
  score: number,
  thresholds: Neo4jReadinessThresholds = DEFAULT_READINESS_THRESHOLDS,
): ReadinessBand {
  if (score <= thresholds.localMax) return "local";
  if (score <= thresholds.monitorMax) return "monitor";
  if (score <= thresholds.preparePocMax) return "prepare-poc";
  return "migration-justified";
}

/** Recomendação textual por banda (spec §P11-07 — nunca migra sozinho). */
export function recommendationFor(band: ReadinessBand, score: number): string {
  switch (band) {
    case "local":
      return `Score ${score}/100 — grafo pequeno: Postgres/Supabase é suficiente. Sem ação de migração.`;
    case "monitor":
      return `Score ${score}/100 — monitorar: colete mais snapshots de workload antes de decidir.`;
    case "prepare-poc":
      return `Score ${score}/100 — preparar PoC: avalie Neo4j em ambiente isolado, sem migração de produção.`;
    case "migration-justified":
      return `Score ${score}/100 — migração justificada: avalie formalmente com PoC validado antes de qualquer mudança.`;
  }
}

/** Calcula o trend comparando o score atual com o último snapshot. */
export function computeTrend(
  currentScore: number,
  history: Neo4jReadinessSnapshot[],
): Neo4jReadinessResult["trend"] {
  if (history.length === 0) return "no-history";
  const last = history[history.length - 1].needScore;
  if (currentScore > last + 2) return "up";
  if (currentScore < last - 2) return "down";
  return "stable";
}

/**
 * Avalia readiness completo: score + banda + trend + histórico + recomendação.
 * Fail-open: sem métricas → score 0 (local), trend no-history.
 */
export function evaluateNeo4jReadiness(
  metrics: Neo4jWorkloadMetrics,
  opts?: {
    history?: Neo4jReadinessSnapshot[];
    thresholds?: Neo4jReadinessThresholds;
  },
): Neo4jReadinessResult {
  const thresholds = opts?.thresholds ?? DEFAULT_READINESS_THRESHOLDS;
  const history = opts?.history ?? [];
  const score = computeNeedScore(metrics);
  const band = readinessBand(score, thresholds);
  return {
    score,
    band,
    metrics,
    recommendation: recommendationFor(band, score),
    trend: computeTrend(score, history),
    history,
  };
}

/** Cria um snapshot a partir de métricas (para persistência). */
export function snapshotFromMetrics(
  metrics: Neo4jWorkloadMetrics,
  timestamp = new Date().toISOString(),
): Neo4jReadinessSnapshot {
  return {
    timestamp,
    nodeCount: metrics.nodes,
    edgeCount: metrics.edges,
    queryP95Ms: metrics.queryP95Ms,
    multiHopRatio: metrics.multiHopRatio,
    concurrency: metrics.concurrency,
    needScore: computeNeedScore(metrics),
  };
}
