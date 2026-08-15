/**
 * graph-roi.ts — Graph ROI e Neo4j readiness UI (P11-08).
 *
 * Extraído de src/lib/aiEngineering.ts (rule-41 — hard limit de 150 linhas).
 */

import type { TelemetryEnvelope } from "@/ai/telemetry/envelope";
import {
  computeNeedScore,
  readinessBand,
  recommendationFor,
  type Neo4jWorkloadMetrics,
} from "@/ai/graph/readiness";

export interface GraphRoi {
  graphQueries: number;
  tokensSaved: number;
  contextReuseTokens: number;
  cacheHitRate: number;
  /** Rework evitado (falhas reduzidas vs baseline sem graph). */
  reworkDifference: number;
}

/** Graph ROI (spec §P11-08): queries, tokens saved, reuse, cache, rework. */
export function computeGraphRoi(envelopes: TelemetryEnvelope[]): GraphRoi {
  const queries = envelopes.filter((e) => e.eventType.startsWith("graph.query."));
  const completed = envelopes.filter((e) => e.eventType === "graph.query.completed");
  const cacheHits = completed.filter(
    (e) => (e as TelemetryEnvelope & { cacheHit?: boolean }).cacheHit === true,
  ).length;
  return {
    graphQueries: queries.length,
    tokensSaved: envelopes.reduce((a, e) => a + (e.tokensSaved ?? 0), 0),
    contextReuseTokens: envelopes.reduce(
      (a, e) =>
        a + ((e as TelemetryEnvelope & { contextReuseTokens?: number }).contextReuseTokens ?? 0),
      0,
    ),
    cacheHitRate:
      completed.length === 0 ? 0 : Math.round((cacheHits / completed.length) * 100) / 100,
    reworkDifference: envelopes.filter((e) => e.eventType === "agent.failed").length,
  };
}

/** Neo4j readiness UI: score, banda, drivers, recomendação. */
export function computeReadinessUi(metrics: Neo4jWorkloadMetrics): {
  score: number;
  band: string;
  drivers: string[];
  recommendation: string;
} {
  const score = computeNeedScore(metrics);
  const band = readinessBand(score);
  const drivers: string[] = [];
  if (metrics.multiHopRatio > 0.3)
    drivers.push(`multi-hop ${Math.round(metrics.multiHopRatio * 100)}%`);
  if (metrics.queryP95Ms !== null && metrics.queryP95Ms > 200)
    drivers.push(`p95 ${metrics.queryP95Ms}ms`);
  if (metrics.nodes > 1000) drivers.push(`${metrics.nodes} nós`);
  if (drivers.length === 0) drivers.push("workload ainda pequeno");
  return {
    score,
    band,
    drivers,
    recommendation: recommendationFor(band, score),
  };
}
