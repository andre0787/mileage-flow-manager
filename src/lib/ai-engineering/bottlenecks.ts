/**
 * bottlenecks.ts — Gargalos do pipeline (P11-08).
 *
 * Extraído de src/lib/aiEngineering.ts (rule-41 — hard limit de 150 linhas).
 */

import type { TelemetryEnvelope } from "@/ai/telemetry/envelope";
import { computeAgentPerformance } from "./agents";

export interface BottleneckRow {
  type: "latency" | "failures" | "retries" | "expensive" | "context-waste";
  role?: string;
  model?: string;
  value: number;
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
