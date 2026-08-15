/**
 * executive.ts — Visão executiva do AI Engineering (P11-08).
 *
 * Extraído de src/lib/aiEngineering.ts (rule-41 — hard limit de 150 linhas).
 */

import type { TelemetryEnvelope } from "@/ai/telemetry/envelope";
import { estimateCost } from "@/lib/aiTelemetry";
import { attemptsOf, avg, isAgentEvent } from "./shared";

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
  const retried = envelopes.filter((e) => isAgentEvent(e) && attemptsOf(e) > 1).length;
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
