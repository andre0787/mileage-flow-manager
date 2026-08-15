/**
 * graph-value.ts — Graph Value comparator (P11-04).
 *
 * Compara estratégias com e sem Graph Intelligence (mesma task, mesmo seed)
 * em: tokens, latência, qualidade, falhas e rework — provando quando o
 * Graph realmente gera valor. Estrutura pura/determinística.
 */

export interface RunOutcome {
  strategy: "graph-assisted" | "non-graph";
  taskId: string;
  tokensUsed: number;
  durationMs: number;
  qualityScore: number; // 0..10
  failures: number;
  /** Retrabalho: quantas iterações adicionais foram necessárias. */
  reworkCount: number;
}

export interface GraphValueReport {
  taskId: string;
  tokensSaved: number;
  tokensSavedPct: number;
  latencyImpactMs: number;
  qualityDelta: number;
  failureDelta: number;
  reworkSaved: number;
  /** O Graph ajudou (tokens/latência/quality/rework melhores ou iguais). */
  beneficial: boolean;
}

/** Percentual de redução (positivo = economia). */
export function reductionPct(baseline: number, variant: number): number {
  if (baseline <= 0) return 0;
  return Math.round(((baseline - variant) / baseline) * 1000) / 10;
}

/**
 * Compara um run graph-assisted contra a baseline non-graph.
 * Vantagem é medida em: tokens, latência, rework e falhas (menos é melhor)
 * + qualidade (mais é melhor).
 */
export function compareGraphValue(
  nonGraph: RunOutcome,
  graphAssisted: RunOutcome,
): GraphValueReport {
  const tokensSavedPct = reductionPct(nonGraph.tokensUsed, graphAssisted.tokensUsed);
  return {
    taskId: nonGraph.taskId,
    tokensSaved: Math.max(0, nonGraph.tokensUsed - graphAssisted.tokensUsed),
    tokensSavedPct,
    latencyImpactMs: graphAssisted.durationMs - nonGraph.durationMs,
    qualityDelta: Math.round((graphAssisted.qualityScore - nonGraph.qualityScore) * 10) / 10,
    failureDelta: graphAssisted.failures - nonGraph.failures,
    reworkSaved: Math.max(0, nonGraph.reworkCount - graphAssisted.reworkCount),
    beneficial:
      graphAssisted.qualityScore >= nonGraph.qualityScore &&
      graphAssisted.reworkCount <= nonGraph.reworkCount &&
      (tokensSavedPct >= 0 || graphAssisted.failures <= nonGraph.failures),
  };
}
