/**
 * readiness-config.ts — Neo4j readiness thresholds e bandas (P11-07).
 *
 * Thresholds configuráveis (0-39 local, 40-69 monitor, 70-84 PoC, 85+
 * migração), banda e recomendação textual. Extraído de readiness.ts
 * (rule-41 — hard limit de 150 linhas por arquivo).
 */

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
