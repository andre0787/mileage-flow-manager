/**
 * aiEngineering.ts — AI Engineering Command Center (P11-08).
 *
 * Agregação PURA (sem React/Supabase) dos envelopes §19 em visões do
 * dashboard. Os agregadores vivem em src/lib/ai-engineering/* (rule-41 —
 * hard limit de 150 linhas por arquivo); este barrel re-exporta tudo e
 * monta o dashboard completo.
 *
 * Consome `TelemetryEnvelope[]` (formato §19) — o mesmo que os scripts
 * persistem em docs/tracking/envelopes.jsonl e na ai_telemetry.
 */

import type { TelemetryEnvelope } from "@/ai/telemetry/envelope";
import type { Neo4jWorkloadMetrics } from "@/ai/graph/readiness";
import { computeExecutiveMetrics, type ExecutiveMetrics } from "./ai-engineering/executive";
import { computePhaseEfficiency, type PhaseEfficiency } from "./ai-engineering/phases";
import {
  computeAgentPerformance,
  computeModelPerformance,
  type AgentPerformanceRow,
  type ModelPerformanceRow,
} from "./ai-engineering/agents";
import { computeBottlenecks, type BottleneckRow } from "./ai-engineering/bottlenecks";
import { computeGraphRoi, computeReadinessUi, type GraphRoi } from "./ai-engineering/graph-roi";

/** Conjunto completo de visões para o dashboard. */
export interface AiEngineeringDashboard {
  executive: ExecutiveMetrics;
  phases: PhaseEfficiency[];
  agents: AgentPerformanceRow[];
  models: ModelPerformanceRow[];
  bottlenecks: BottleneckRow[];
  graphRoi: GraphRoi;
  readiness: ReturnType<typeof computeReadinessUi>;
}

/** Monta o dashboard completo a partir de envelopes + métricas de grafo. */
export function buildAiEngineeringDashboard(
  envelopes: TelemetryEnvelope[],
  graphMetrics?: Partial<Neo4jWorkloadMetrics>,
): AiEngineeringDashboard {
  return {
    executive: computeExecutiveMetrics(envelopes),
    phases: computePhaseEfficiency(envelopes),
    agents: computeAgentPerformance(envelopes),
    models: computeModelPerformance(envelopes),
    bottlenecks: computeBottlenecks(envelopes),
    graphRoi: computeGraphRoi(envelopes),
    readiness: computeReadinessUi({
      nodes: graphMetrics?.nodes ?? 0,
      edges: graphMetrics?.edges ?? 0,
      multiHopRatio: graphMetrics?.multiHopRatio ?? 0,
      queryP95Ms: graphMetrics?.queryP95Ms ?? null,
      concurrency: graphMetrics?.concurrency ?? 1,
      scannedNodes: graphMetrics?.scannedNodes ?? 0,
      growthPct: graphMetrics?.growthPct ?? 0,
    }),
  };
}

// Agregadores — extraídos para src/lib/ai-engineering/ (rule-41).
export { computeExecutiveMetrics, type ExecutiveMetrics } from "./ai-engineering/executive";
export { computePhaseEfficiency, type PhaseEfficiency } from "./ai-engineering/phases";
export {
  computeAgentPerformance,
  computeModelPerformance,
  type AgentPerformanceRow,
  type ModelPerformanceRow,
} from "./ai-engineering/agents";
export { computeBottlenecks, type BottleneckRow } from "./ai-engineering/bottlenecks";
export { computeGraphRoi, computeReadinessUi, type GraphRoi } from "./ai-engineering/graph-roi";
