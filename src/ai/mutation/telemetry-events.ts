/**
 * P12.6-23/24 — Telemetry Events & Schema
 *
 * Eventos obrigatórios e schema mínimo para toda execução AI.
 * Reutiliza infraestrutura existente (src/lib/aiTelemetry.ts).
 *
 * Nomes prefixados com 'Mutation' para evitar conflito com
 * src/ai/telemetry/envelope.ts (TelemetryEvent/TelemetryEventType).
 */

// ─── Event Types ───────────────────────────────────────────────

export type AgentEvent = "agent.started" | "agent.completed" | "agent.failed";

export type MutationEvent =
  | "mutation.created"
  | "mutation.activated"
  | "mutation.detected"
  | "mutation.missed"
  | "mutation.triaged"
  | "mutation.fixed"
  | "mutation.regression";

export type ExperimentEvent = "experiment.started" | "experiment.completed" | "experiment.failed";

export type ContextEvent =
  "context_mode.started" | "context_mode.completed" | "caveman.started" | "caveman.completed";

export type PromotionEvent =
  | "promotion.scouted"
  | "promotion.extracted"
  | "promotion.validated"
  | "promotion.rejected"
  | "promotion.deduplicated"
  | "promotion.updated"
  | "promotion.expired"
  | "promotion.alerted";

export type GraphEvent =
  "graph.experiment.started" | "graph.experiment.completed" | "graph.recommendation.generated";

export type MutationTelemetryEventType =
  AgentEvent | MutationEvent | ExperimentEvent | ContextEvent | PromotionEvent | GraphEvent;

// ─── Schema Mínimo (P12.6-24) ─────────────────────────────────

export interface MutationTelemetryEvent {
  eventId: string;
  timestamp: string;
  event: MutationTelemetryEventType;
  experimentId?: string;
  runId?: string;
  agent?: string;
  role?: string;
  model?: string;
  strategy?: string;
  mutationId?: string;
  promotionId?: string;
  sourceId?: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  latencyMs: number;
  toolCalls: number;
  status: "success" | "failure" | "skipped";
  evidenceId?: string;
  error?: string | null;
  metadata?: Record<string, unknown>;
}

// ─── Event Buffer (in-memory para sessão) ──────────────────────

const eventBuffer: MutationTelemetryEvent[] = [];

let eventCounter = 0;

export function emitTelemetryEvent(
  event: MutationTelemetryEventType,
  data: Partial<MutationTelemetryEvent> = {},
): MutationTelemetryEvent {
  eventCounter++;
  const telemetryEvent: MutationTelemetryEvent = {
    eventId: `evt-${Date.now()}-${eventCounter}`,
    timestamp: new Date().toISOString(),
    event,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    cost: 0,
    latencyMs: 0,
    toolCalls: 0,
    status: "success",
    ...data,
  };

  eventBuffer.push(telemetryEvent);

  return telemetryEvent;
}

export function getEventBuffer(): readonly MutationTelemetryEvent[] {
  return eventBuffer;
}

export function clearEventBuffer(): void {
  eventBuffer.length = 0;
  eventCounter = 0;
}

export function getEventsByType(type: MutationTelemetryEventType): MutationTelemetryEvent[] {
  return eventBuffer.filter((e) => e.event === type);
}

export function getEventsByExperiment(experimentId: string): MutationTelemetryEvent[] {
  return eventBuffer.filter((e) => e.experimentId === experimentId);
}

export function getEventsByMutation(mutationId: string): MutationTelemetryEvent[] {
  return eventBuffer.filter((e) => e.mutationId === mutationId);
}

// ─── Aggregations ──────────────────────────────────────────────

export interface MutationTelemetrySummary {
  totalEvents: number;
  totalTokens: number;
  totalCost: number;
  avgLatency: number;
  successRate: number;
  errorRate: number;
  byType: Record<string, number>;
  byAgent: Record<string, number>;
  byModel: Record<string, number>;
  byStatus: Record<string, number>;
}

export function summarizeEvents(events?: MutationTelemetryEvent[]): MutationTelemetrySummary {
  const data = events || eventBuffer;
  const total = data.length;
  if (total === 0) {
    return {
      totalEvents: 0,
      totalTokens: 0,
      totalCost: 0,
      avgLatency: 0,
      successRate: 0,
      errorRate: 0,
      byType: {},
      byAgent: {},
      byModel: {},
      byStatus: {},
    };
  }

  const totalTokens = data.reduce((s, e) => s + e.totalTokens, 0);
  const totalCost = data.reduce((s, e) => s + e.cost, 0);
  const avgLatency = data.reduce((s, e) => s + e.latencyMs, 0) / total;
  const successCount = data.filter((e) => e.status === "success").length;
  const errorCount = data.filter((e) => e.status === "failure").length;

  const byType: Record<string, number> = {};
  const byAgent: Record<string, number> = {};
  const byModel: Record<string, number> = {};
  const byStatus: Record<string, number> = {};

  for (const e of data) {
    byType[e.event] = (byType[e.event] || 0) + 1;
    if (e.agent) byAgent[e.agent] = (byAgent[e.agent] || 0) + 1;
    if (e.model) byModel[e.model] = (byModel[e.model] || 0) + 1;
    byStatus[e.status] = (byStatus[e.status] || 0) + 1;
  }

  return {
    totalEvents: total,
    totalTokens,
    totalCost,
    avgLatency,
    successRate: successCount / total,
    errorRate: errorCount / total,
    byType,
    byAgent,
    byModel,
    byStatus,
  };
}
