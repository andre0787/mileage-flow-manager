/**
 * aiEngineering.ts — AI Engineering Command Center (P11-08).
 *
 * Agregação PURA (sem React/Supabase) dos envelopes §19 em visões do
 * dashboard: visão executiva, workflow efficiency, agent performance,
 * model performance, bottlenecks, Graph ROI e Neo4j readiness.
 *
 * Consome `TelemetryEnvelope[]` (formato §19) — o mesmo que os scripts
 * persistem em docs/tracking/envelopes.jsonl e na ai_telemetry.
 */

import type { TelemetryEnvelope } from "@/ai/telemetry/envelope";
import { estimateCost } from "./aiTelemetry";
import {
  computeNeedScore,
  readinessBand,
  recommendationFor,
  type Neo4jWorkloadMetrics,
} from "@/ai/graph/readiness";

/** Fase → papel associado (workflow efficiency). */
const PHASE_ROLES: Record<string, string[]> = {
  planning: ["architect", "intent"],
  discovery: ["graph-scout", "domain-scout", "test-scout", "history-scout"],
  implementation: ["implementer"],
  testing: ["tester", "test-scout"],
  review: ["reviewer", "security-reviewer", "performance-reviewer"],
  validation: ["final-validator"],
};

export interface ExecutiveMetrics {
  tasks: number;
  successRate: number; // 0..1
  cost: number;
  tokens: number;
  tokensSaved: number;
  reworkCount: number;
  avgLatencyMs: number;
  graphRoiPct: number;
  agentEfficiency: number; // quality-equivalente: sucesso / custo
  totalDurationMs: number;
}

export interface PhaseEfficiency {
  phase: string;
  durationMs: number;
  /** Percentual do tempo total (0..100). */
  pct: number;
}

export interface AgentPerformanceRow {
  role: string;
  executions: number;
  successRate: number;
  avgLatencyMs: number;
  tokens: number;
  cost: number;
  rework: number;
  retries: number;
}

export interface ModelPerformanceRow {
  model: string;
  role: string;
  executions: number;
  successRate: number;
  avgLatencyMs: number;
  tokens: number;
  cost: number;
  failures: number;
}

export interface BottleneckRow {
  type: "latency" | "failures" | "retries" | "expensive" | "context-waste";
  role?: string;
  model?: string;
  value: number;
}

export interface GraphRoi {
  graphQueries: number;
  tokensSaved: number;
  contextReuseTokens: number;
  cacheHitRate: number;
  /** Rework evitado (falhas reduzidas vs baseline sem graph). */
  reworkDifference: number;
}

/** Envelope de conclusão de agente (para agregar execuções). */
function isAgentEvent(env: TelemetryEnvelope): boolean {
  return env.eventType === "agent.completed" || env.eventType === "agent.failed";
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

/** Visão executiva (spec §P11-08). */
export function computeExecutiveMetrics(envelopes: TelemetryEnvelope[]): ExecutiveMetrics {
  const agentEvents = envelopes.filter(isAgentEvent);
  const tasks = new Set(
    envelopes.filter((e) => e.taskId).map((e) => `${e.runId ?? ""}:${e.taskId}`),
  ).size;
  const completed = agentEvents.filter((e) => e.eventType === "agent.completed").length;
  const failed = agentEvents.filter((e) => e.eventType === "agent.failed").length;
  const total = completed + failed;
  const successRate = total === 0 ? 0 : completed / total;

  const tokens = agentEvents.reduce((a, e) => a + (e.inputTokens ?? 0) + (e.outputTokens ?? 0), 0);
  const tokensSaved = envelopes.reduce((a, e) => a + (e.tokensSaved ?? 0), 0);
  const cost = agentEvents.reduce(
    (a, e) => a + (e.cost ?? estimateCost((e.inputTokens ?? 0) + (e.outputTokens ?? 0))),
    0,
  );
  const latencies = agentEvents.filter((e) => e.durationMs !== undefined).map((e) => e.durationMs!);
  const totalDurationMs = envelopes.reduce((a, e) => a + (e.durationMs ?? 0), 0);
  // Rework = agentes que falharam (tiveram de ser repetidos) + retries > 1.
  const retried = envelopes.filter(
    (e) =>
      (e as TelemetryEnvelope & { attempts?: number }).attempts !== undefined &&
      (e as TelemetryEnvelope & { attempts?: number }).attempts! > 1,
  ).length;
  const reworkCount = failed + retried;

  const graphQueries = envelopes.filter((e) => e.eventType.startsWith("graph.query.")).length;
  const graphRoiPct = tokens === 0 ? 0 : Math.round((tokensSaved / tokens) * 1000) / 10;

  return {
    tasks,
    successRate: Math.round(successRate * 1000) / 1000,
    cost: Math.round(cost * 100000) / 100000,
    tokens,
    tokensSaved,
    reworkCount: retried,
    avgLatencyMs: Math.round(avg(latencies) * 10) / 10,
    graphRoiPct,
    agentEfficiency: cost === 0 ? 0 : Math.round((successRate / cost) * 100) / 100,
    totalDurationMs,
  };
}

/** Workflow efficiency: tempo por fase em % (spec §P11-08). */
export function computePhaseEfficiency(envelopes: TelemetryEnvelope[]): PhaseEfficiency[] {
  const byPhase = new Map<string, number>();
  for (const env of envelopes) {
    if (env.durationMs === undefined) continue;
    const role = env.agentRole ?? "";
    for (const [phase, roles] of Object.entries(PHASE_ROLES)) {
      if (roles.includes(role)) {
        byPhase.set(phase, (byPhase.get(phase) ?? 0) + env.durationMs);
        break;
      }
    }
  }
  const total = [...byPhase.values()].reduce((a, b) => a + b, 0);
  return [...byPhase.entries()]
    .map(([phase, durationMs]) => ({
      phase,
      durationMs,
      pct: total === 0 ? 0 : Math.round((durationMs / total) * 1000) / 10,
    }))
    .sort((a, b) => b.durationMs - a.durationMs);
}

/** Agent performance: Role × Success/Latency/Tokens/Cost/Rework/Retries. */
export function computeAgentPerformance(envelopes: TelemetryEnvelope[]): AgentPerformanceRow[] {
  const byRole = new Map<string, TelemetryEnvelope[]>();
  for (const env of envelopes)
    if (isAgentEvent(env) && env.agentRole) {
      const list = byRole.get(env.agentRole) ?? [];
      list.push(env);
      byRole.set(env.agentRole, list);
    }
  const rows: AgentPerformanceRow[] = [];
  for (const [role, list] of byRole) {
    const ok = list.filter((e) => e.eventType === "agent.completed").length;
    const retries = list.filter(
      (e) => (e as TelemetryEnvelope & { attempts?: number }).attempts! > 1,
    ).length;
    rows.push({
      role,
      executions: list.length,
      successRate: Math.round((ok / list.length) * 1000) / 1000,
      avgLatencyMs: Math.round(avg(list.map((e) => e.durationMs ?? 0)) * 10) / 10,
      tokens: list.reduce((a, e) => a + (e.inputTokens ?? 0) + (e.outputTokens ?? 0), 0),
      cost: Math.round(list.reduce((a, e) => a + (e.cost ?? 0), 0) * 100000) / 100000,
      rework: list.length - ok,
      retries,
    });
  }
  return rows.sort((a, b) => b.cost - a.cost);
}

/** Model performance: Model × Role (spec §P11-08). */
export function computeModelPerformance(envelopes: TelemetryEnvelope[]): ModelPerformanceRow[] {
  const byKey = new Map<string, TelemetryEnvelope[]>();
  for (const env of envelopes) {
    if (!isAgentEvent(env) || !env.model) continue;
    const key = `${env.model}|${env.agentRole ?? "unknown"}`;
    const list = byKey.get(key) ?? [];
    list.push(env);
    byKey.set(key, list);
  }
  const rows: ModelPerformanceRow[] = [];
  for (const [key, list] of byKey) {
    const [model, role] = key.split("|");
    const ok = list.filter((e) => e.eventType === "agent.completed").length;
    rows.push({
      model,
      role,
      executions: list.length,
      successRate: Math.round((ok / list.length) * 1000) / 1000,
      avgLatencyMs: Math.round(avg(list.map((e) => e.durationMs ?? 0)) * 10) / 10,
      tokens: list.reduce((a, e) => a + (e.inputTokens ?? 0) + (e.outputTokens ?? 0), 0),
      cost: Math.round(list.reduce((a, e) => a + (e.cost ?? 0), 0) * 100000) / 100000,
      failures: list.length - ok,
    });
  }
  return rows.sort((a, b) => b.tokens - a.tokens);
}

/** Bottlenecks: top latency/failures/retries/expensive/context-waste. */
export function computeBottlenecks(envelopes: TelemetryEnvelope[]): BottleneckRow[] {
  const agents = computeAgentPerformance(envelopes);
  const rows: BottleneckRow[] = [];
  const byLatency = [...agents].sort((a, b) => b.avgLatencyMs - a.avgLatencyMs)[0];
  if (byLatency && byLatency.avgLatencyMs > 0) {
    rows.push({ type: "latency", role: byLatency.role, value: byLatency.avgLatencyMs });
  }
  const byFailures = [...agents].sort((a, b) => b.rework - a.rework)[0];
  if (byFailures && byFailures.rework > 0) {
    rows.push({ type: "failures", role: byFailures.role, value: byFailures.rework });
  }
  const byRetries = [...agents].sort((a, b) => b.retries - a.retries)[0];
  if (byRetries && byRetries.retries > 0) {
    rows.push({ type: "retries", role: byRetries.role, value: byRetries.retries });
  }
  const byCost = [...agents].sort((a, b) => b.cost - a.cost)[0];
  if (byCost && byCost.cost > 0) {
    rows.push({ type: "expensive", role: byCost.role, value: byCost.cost });
  }
  return rows;
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
