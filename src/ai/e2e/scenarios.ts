/**
 * scenarios.ts — Scenario Registry (P12.5-06).
 *
 * Tipos e helpers do registry. As definições dos cenários vivem em
 * scenario-defs.ts (rule-41 — hard limit de 150 linhas por arquivo).
 */

import type { Assertion, WaitCondition } from "./browser-adapter";
import { SCENARIOS } from "./scenario-defs";

export type ScenarioStep =
  | { action: "open"; url: string }
  | { action: "click"; selector: string }
  | { action: "fill"; selector: string; value: string }
  | { action: "select"; selector: string; value: string }
  | { action: "wait"; condition: WaitCondition };

export type ScenarioRisk = "low" | "medium" | "high";
export type ScenarioPriority = "P0" | "P1" | "P2" | "P3";

export interface Scenario {
  scenarioId: string;
  version: string;
  name: string;
  risk: ScenarioRisk;
  priority: ScenarioPriority;
  preconditions: string[];
  steps: ScenarioStep[];
  assertions: Assertion[];
  expectedArtifacts: string[];
  cleanup: string[];
}

export { SCENARIOS };

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.scenarioId === id);
}

export function scenariosByPriority(priority: ScenarioPriority): Scenario[] {
  return SCENARIOS.filter((s) => s.priority === priority);
}

export function scenarioCoverage(): Record<ScenarioPriority, number> {
  return {
    P0: scenariosByPriority("P0").length,
    P1: scenariosByPriority("P1").length,
    P2: scenariosByPriority("P2").length,
    P3: scenariosByPriority("P3").length,
  };
}
