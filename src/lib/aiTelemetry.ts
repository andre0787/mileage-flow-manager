/**
 * Telemetria de eficiência da IA (Blueprint v9.0 — rule-48).
 *
 * Funções puras (sem React/Supabase) para estimar custo e agregar a tabela
 * `ai_telemetry` por área do sistema (KPI "Custo por Funcionalidade").
 *
 * Áreas: Contas, Vendas, Milhas/Entradas, etc. — convenção livre de string
 * registrada em `area` no momento do insert.
 */

export { recordTelemetry } from "@/lib/telemetryQueue";

export interface AiTelemetryRecord {
  id: string;
  user_id: string;
  session_id: string;
  area?: string | null;
  tokens_used: number;
  prompt_tokens_saved_by_pruning: number;
  total_execution_time_ms: number;
  cost_estimate: number;
  success_rate: number;
  created_at: string;
}

export interface AreaCost {
  area: string;
  cost: number;
  executions: number;
  avgExecutionMs: number;
}

/** Custo estimado em USD: tokens / 1000 * preço por 1K tokens (default 0.003 = ~GPT-4o-mini). */
export function estimateCost(tokensUsed: number, costPer1kTokens = 0.003): number {
  const raw = (tokensUsed / 1000) * costPer1kTokens;
  // Arredonda para 5 casas decimais (DECIMAL(10,5) do schema)
  return Math.round(raw * 100000) / 100000;
}

/** Taxa de sucesso 0.0..1.0; sem execuções → 1 (nada a reportar como falha). */
export function computeSuccessRate(successCount: number, totalCount: number): number {
  if (totalCount <= 0) return 1;
  const ratio = successCount / totalCount;
  if (Number.isNaN(ratio)) return 0;
  return Math.min(1, Math.max(0, Math.round(ratio * 100) / 100));
}

/** Monta o registro com defaults (pruning 0, sucesso 1, timestamp now). */
export function buildAiTelemetryRecord(input: {
  userId: string;
  sessionId: string;
  area?: string | null;
  tokensUsed: number;
  promptTokensSavedByPruning?: number;
  totalExecutionTimeMs: number;
  successRate?: number;
  costPer1kTokens?: number;
}): Omit<AiTelemetryRecord, "id" | "created_at"> {
  return {
    user_id: input.userId,
    session_id: input.sessionId,
    area: input.area ?? null,
    tokens_used: input.tokensUsed,
    prompt_tokens_saved_by_pruning: input.promptTokensSavedByPruning ?? 0,
    total_execution_time_ms: input.totalExecutionTimeMs,
    cost_estimate: estimateCost(input.tokensUsed, input.costPer1kTokens),
    success_rate:
      input.successRate == null || Number.isNaN(input.successRate)
        ? 1
        : Math.min(1, Math.max(0, input.successRate)),
  };
}

/** Agrega registros por área: custo total, execuções e tempo médio. */
export function costPerArea(
  records: Pick<AiTelemetryRecord, "area" | "cost_estimate" | "total_execution_time_ms">[],
): AreaCost[] {
  const byArea = new Map<string, { cost: number; executions: number; totalMs: number }>();
  for (const r of records) {
    const area = r.area?.trim() || "geral";
    const prev = byArea.get(area) ?? { cost: 0, executions: 0, totalMs: 0 };
    prev.cost += r.cost_estimate;
    prev.executions += 1;
    prev.totalMs += r.total_execution_time_ms;
    byArea.set(area, prev);
  }
  return Array.from(byArea.entries())
    .map(([area, v]) => ({
      area,
      cost: Math.round(v.cost * 100000) / 100000,
      executions: v.executions,
      avgExecutionMs: v.executions > 0 ? Math.round(v.totalMs / v.executions) : 0,
    }))
    .sort((a, b) => b.cost - a.cost);
}
