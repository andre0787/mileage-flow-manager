/**
 * agent-model-role.ts — P12-06 Agent / Model / Role Analysis.
 *
 * Matrizes agent × role, model × role, task class × role e model × agent
 * com métricas (success, quality, latency, tokens, cost, rework, retry,
 * tool calls). Toda célula registra sample_count e confidence — nunca
 * declara superioridade com amostra insuficiente (spec §13/§P12-06).
 */

import type { RunMetrics } from "./types";

export interface MatrixCell {
  sampleCount: number;
  successRate: number;
  quality: number;
  meanDurationMs: number;
  meanTokens: number;
  meanCost: number;
  meanRework: number;
  meanRetry: number;
  meanToolCalls: number;
  confidence: number; // 0..1 — min(1, sample/10)
}

export type AgentModelRoleMatrix = Record<string, Record<string, MatrixCell>>;

function aggregateRuns(runs: RunMetrics[]): MatrixCell {
  const n = runs.length || 1;
  const confidence = Math.min(1, n / 10);
  return {
    sampleCount: runs.length,
    successRate: Math.round((runs.filter((r) => r.status === "success").length / n) * 100) / 100,
    quality: Math.round((runs.reduce((a, r) => a + r.quality, 0) / n) * 10) / 10,
    meanDurationMs: Math.round(runs.reduce((a, r) => a + r.durationMs, 0) / n),
    meanTokens: Math.round(runs.reduce((a, r) => a + r.totalTokens, 0) / n),
    meanCost: Math.round((runs.reduce((a, r) => a + r.cost, 0) / n) * 100000) / 100000,
    meanRework: Math.round((runs.reduce((a, r) => a + r.rework, 0) / n) * 100) / 100,
    meanRetry: Math.round((runs.reduce((a, r) => a + r.retryCount, 0) / n) * 10) / 10,
    meanToolCalls: Math.round(runs.reduce((a, r) => a + r.toolCalls, 0) / n),
    confidence,
  };
}

function groupBy(runs: RunMetrics[], key: (r: RunMetrics) => string): Record<string, RunMetrics[]> {
  const out: Record<string, RunMetrics[]> = {};
  for (const r of runs) {
    const k = key(r);
    (out[k] ??= []).push(r);
  }
  return out;
}

/** Matriz bidimensional (linha → coluna → agregado). */
function matrix(
  runs: RunMetrics[],
  row: (r: RunMetrics) => string,
  col: (r: RunMetrics) => string,
): AgentModelRoleMatrix {
  const out: AgentModelRoleMatrix = {};
  for (const [rk, rs] of Object.entries(groupBy(runs, row))) {
    out[rk] = {};
    for (const [ck, cs] of Object.entries(groupBy(rs, col))) {
      out[rk][ck] = aggregateRuns(cs);
    }
  }
  return out;
}

export interface AgentModelRoleReport {
  agentByRole: AgentModelRoleMatrix;
  modelByRole: AgentModelRoleMatrix;
  taskClassByRole: AgentModelRoleMatrix;
  modelByAgent: AgentModelRoleMatrix;
  insufficientEvidence: string[]; // células com confidence < 0.3
}

export function analyzeAgentModelRole(runs: RunMetrics[]): AgentModelRoleReport {
  const agentByRole = matrix(
    runs,
    (r) => r.agent,
    (r) => r.role,
  );
  const modelByRole = matrix(
    runs,
    (r) => r.model,
    (r) => r.role,
  );
  const taskClassByRole = matrix(
    runs,
    (r) => r.taskId,
    (r) => r.role,
  );
  const modelByAgent = matrix(
    runs,
    (r) => r.model,
    (r) => r.agent,
  );

  const insufficient: string[] = [];
  for (const [row, cols] of Object.entries(modelByRole)) {
    for (const [col, cell] of Object.entries(cols)) {
      if (cell.confidence < 0.3) insufficient.push(`${row} × ${col} (n=${cell.sampleCount})`);
    }
  }

  return {
    agentByRole,
    modelByRole,
    taskClassByRole,
    modelByAgent,
    insufficientEvidence: insufficient,
  };
}
