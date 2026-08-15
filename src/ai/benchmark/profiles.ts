/**
 * profiles.ts — Benchmark strategy profiles (P11-06).
 *
 * Perfis determinísticos das 3 estratégias (A/B/C) usados na simulação
 * de benchmark. Extraído de runner.ts (rule-41 — hard limit de 150
 * linhas por arquivo).
 */

import type { TaskClass } from "@/ai/orchestration/classifier";

export type BenchmarkStrategy = "A-single-agent" | "B-multi-agent" | "C-graph-multi-agent";

export interface StrategyProfiles {
  /** Multiplicadores por classe de task para cada estratégia (simulação determinística). */
  [strategy: string]: {
    agentCount: number;
    parallelism: number;
    baseTokens: number;
    baseDurationMs: number;
    qualityBoost: number; // 0..2 somado à base 5.5
    reworkReduction: number; // 0..0.4 (fração do rework base)
    failureReduction: number; // 0..0.3
  };
}

export const DEFAULT_STRATEGY_PROFILES: StrategyProfiles = {
  // A: 1 agente, sem exploração prévia — barato mas arriscado em complexas.
  "A-single-agent": {
    agentCount: 1,
    parallelism: 1,
    baseTokens: 4000,
    baseDurationMs: 25_000,
    qualityBoost: 0,
    reworkReduction: 0,
    failureReduction: 0,
  },
  // B: mais agentes, mais contexto total (mais caro) mas melhor qualidade.
  "B-multi-agent": {
    agentCount: 5,
    parallelism: 2,
    baseTokens: 9000,
    baseDurationMs: 40_000,
    qualityBoost: 1.2,
    reworkReduction: 0.25,
    failureReduction: 0.15,
  },
  // C: graph direciona a exploração → MENOS tokens que B (context reuse,
  // P11-04) e menos rework/falha — compensa em tarefas complexas.
  "C-graph-multi-agent": {
    agentCount: 6,
    parallelism: 3,
    baseTokens: 7000,
    baseDurationMs: 45_000,
    qualityBoost: 2.0,
    reworkReduction: 0.4,
    failureReduction: 0.28,
  },
};

/** Fator de complexidade por classe de task (afeta tokens/duração/falhas). */
export const CLASS_FACTOR: Record<TaskClass, number> = {
  tiny: 0.5,
  small: 0.8,
  medium: 1.0,
  large: 1.6,
};
