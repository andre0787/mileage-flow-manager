/**
 * workflow-roles.ts — Definição de roles e pesos (P12-08).
 *
 * Extraído do workflow-efficiency.ts para respeitar o hard limit de
 * 150 linhas (rule-41). A definição de `role_value_score` é configurável
 * via RoleValueWeights (spec §P12-08).
 */

export const ROLES = [
  "classifier",
  "planner",
  "scouts",
  "architect",
  "implementer",
  "tester",
  "reviewer",
  "validator",
] as const;

export type RoleName = (typeof ROLES)[number];

/** Peso configurável de cada componente do valor (spec §P12-08). */
export interface RoleValueWeights {
  qualityWeight: number;
  reworkWeight: number;
  costWeight: number;
  latencyWeight: number;
  skipUnnecessaryThreshold: number;
}

export const DEFAULT_ROLE_WEIGHTS: RoleValueWeights = {
  qualityWeight: 0.6,
  reworkWeight: 0.4,
  costWeight: 0.7,
  latencyWeight: 0.3,
  skipUnnecessaryThreshold: 0.5,
};
