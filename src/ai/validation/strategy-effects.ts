/**
 * strategy-effects.ts — Interação estratégia × classe × graphRisk (P12).
 *
 * Extraído do runner-model.ts para respeitar o hard limit de 150 linhas
 * (rule-41). Centraliza a calibração honesta: quando cada estratégia ajuda
 * ou atrapalha.
 */

import type { ValidationStrategy, ValidationTaskClass } from "./types";

export interface BaseOutcome {
  quality: number;
  failure: number;
  rework: number;
}

/** Aplica a interação estratégia × classe × graphRisk na qualidade/falha/rework. */
export function applyStrategy(
  strategy: ValidationStrategy,
  taskClass: ValidationTaskClass,
  graphBenefit: boolean,
  base: BaseOutcome,
): BaseOutcome {
  const out = { ...base };
  if (strategy === "single") return out;
  if (strategy === "multi") {
    if (taskClass === "tiny") {
      out.quality -= 0.4; // over-orchestration: overhead sem ganho
      out.failure += 0.02;
      out.rework += 0.02;
    } else if (taskClass === "small") {
      out.quality += 0.1;
      out.failure *= 0.85;
      out.rework *= 0.8;
    } else {
      out.quality += 0.5; // medium+
      out.failure *= 0.55;
      out.rework *= 0.5;
    }
    return out;
  }
  // graph+multi
  if (taskClass === "tiny" || taskClass === "small") {
    out.quality -= 0.6; // graph custa contexto sem ganho em tasks pequenas
    out.failure += 0.03;
    out.rework += 0.04;
  } else if (graphBenefit) {
    out.quality += 0.9; // graph ajuda em graphRisk alto
    out.failure *= 0.35;
    out.rework *= 0.3;
  } else {
    out.quality += 0.2; // graph neutro em medium sem graphRisk
    out.failure *= 0.7;
    out.rework *= 0.6;
  }
  return out;
}
