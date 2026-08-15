/**
 * agents.ts — Agent e Model performance (P11-08).
 *
 * Extraído de src/lib/aiEngineering.ts (rule-41 — hard limit de 150 linhas).
 */

import type { TelemetryEnvelope } from "@/ai/telemetry/envelope";
import { attemptsOf, avg, isAgentEvent } from "./shared";

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
    const retries = list.filter((e) => attemptsOf(e) > 1).length;
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
