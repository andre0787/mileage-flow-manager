/**
 * runner-constants.ts — Constantes do modelo de simulação P12.
 *
 * Extraídas do runner-model.ts para respeitar o hard limit de 150 linhas
 * (rule-41). Os valores são calibrados para refletir honestamente quando
 * cada estratégia é melhor (spec P12).
 */

import type { RealTask, ValidationConfig, ValidationStrategy, ValidationTaskClass } from "./types";

/** Configuração padrão da P12 (triggers da spec §P12-05). */
export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  repeatImportant: 3,
  model: "gpt-4o-mini",
  triggers: {
    failureRate: 0.05,
    reworkRate: 0.1,
    telemetryCompleteness: 0.995,
    budgetViolation: 0.02,
    timeoutRate: 0.03,
    contextStaleRate: 0.02,
  },
};

export const CLASS_FACTOR: Record<ValidationTaskClass, number> = {
  tiny: 0.4,
  small: 0.7,
  medium: 1,
  large: 1.6,
  architectural: 2.2,
};

/** Custo por 1K tokens (USD) — default modelo barato. */
export const COST_PER_1K = 0.003;

/** Qualidade base (0..10) por classe — quanto maior a classe, maior a dificuldade. */
export const BASE_QUALITY: Record<ValidationTaskClass, number> = {
  tiny: 8.2,
  small: 7.6,
  medium: 7.0,
  large: 6.3,
  architectural: 5.8,
};

/** Taxa de falha base por classe com agente único (execução crua). */
export const BASE_FAILURE: Record<ValidationTaskClass, number> = {
  tiny: 0.03,
  small: 0.1,
  medium: 0.25,
  large: 0.42,
  architectural: 0.55,
};

/** Retrabalho base por classe com agente único. */
export const BASE_REWORK: Record<ValidationTaskClass, number> = {
  tiny: 0.03,
  small: 0.1,
  medium: 0.22,
  large: 0.35,
  architectural: 0.42,
};

/** Seed determinístico por task+estratégia+repeat (0..99). */
export function seeded(taskId: string, strategy: ValidationStrategy, repeat: number): number {
  let h = 0;
  const s = `${taskId}|${strategy}|${repeat}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 100;
}

/** Converte risco em penalidade de qualidade (0..0.6). */
export function riskPenalty(risk: RealTask["risk"]): number {
  switch (risk) {
    case "low":
      return 0;
    case "medium":
      return 0.15;
    case "high":
      return 0.35;
    case "critical":
      return 0.6;
  }
}
