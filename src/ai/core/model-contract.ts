/**
 * model-contract.ts — Model Capability Profile (SDD v5.0, seção 10).
 *
 * Separa agente de modelo: o router trabalha com
 *   task → required capabilities → agent capability + model capability
 *   → execution plan.
 */

export type ModelSpeed = "fast" | "medium" | "slow";
export type ModelTier = "low" | "medium" | "high";

export interface ModelCapabilities {
  model: string;
  contextWindow: number; // tokens
  toolCalling: boolean;
  structuredOutput: boolean;
  reasoning: "low" | "medium" | "high";
  coding: "low" | "medium" | "high";
  speed: ModelSpeed;
  costTier: ModelTier;
}

/** Verifica se um modelo atende capacidades requeridas (tool-calling, structured-output, reasoning >= X, coding >= X). */
export function modelSatisfies(
  model: ModelCapabilities,
  required: {
    toolCalling?: boolean;
    structuredOutput?: boolean;
    minReasoning?: "low" | "medium" | "high";
    minCoding?: "low" | "medium" | "high";
  },
): boolean {
  if (required.toolCalling && !model.toolCalling) return false;
  if (required.structuredOutput && !model.structuredOutput) return false;
  const rank: Record<string, number> = { low: 1, medium: 2, high: 3 };
  if (required.minReasoning && rank[model.reasoning] < rank[required.minReasoning]) return false;
  if (required.minCoding && rank[model.coding] < rank[required.minCoding]) return false;
  return true;
}

/**
 * Ordena modelos candidatos por custo (barato primeiro) e velocidade,
 * preservando o contract de capacidades. Usado para fallback (SDD seção 23).
 */
export function rankModels(
  candidates: ModelCapabilities[],
  required: Parameters<typeof modelSatisfies>[1],
): ModelCapabilities[] {
  const compatible = candidates.filter((m) => modelSatisfies(m, required));
  const tierRank: Record<ModelTier, number> = { low: 1, medium: 2, high: 3 };
  const speedRank: Record<ModelSpeed, number> = { fast: 1, medium: 2, slow: 3 };
  return [...compatible].sort(
    (a, b) =>
      tierRank[a.costTier] - tierRank[b.costTier] || speedRank[a.speed] - speedRank[b.speed],
  );
}
