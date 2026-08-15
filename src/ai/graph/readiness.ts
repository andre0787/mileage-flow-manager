/**
 * readiness.ts — Neo4j Readiness Evolution (P11-07).
 *
 * Transforma readiness em decisão baseada em workload REAL: métricas
 * (nodes, edges, query p95, multi-hop, concurrency, complexidade), score
 * 0-100 com thresholds configuráveis, histórico persistido (snapshots) e
 * trend — sem nunca instalar/migrar para Neo4j automaticamente. O
 * validator mede, calcula, explica e recomenda.
 *
 * Thresholds/bandas/recomendação vivem em readiness-config.ts (rule-41 —
 * hard limit de 150 linhas por arquivo).
 */

import {
  DEFAULT_READINESS_THRESHOLDS,
  readinessBand,
  recommendationFor,
  type Neo4jReadinessThresholds,
  type ReadinessBand,
} from "./readiness-config";

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

// Config (thresholds/bandas/recomendação) — extraído (rule-41).
export {
  DEFAULT_READINESS_THRESHOLDS,
  readinessBand,
  recommendationFor,
  type Neo4jReadinessThresholds,
  type ReadinessBand,
} from "./readiness-config";
