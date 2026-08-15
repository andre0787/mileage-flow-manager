/**
 * qa-types.ts — Tipos do E2E QA Agent (P12.5-08).
 *
 * Extraído de qa-agent.ts (rule-41). Define capabilities, proibições e os
 * shapes de finding/config/options.
 */

import type { EvidencePack, FindingSeverity } from "./evidence";
import type { Scenario } from "./scenarios";

export type QaAgentCapability =
  | "scenario_execution"
  | "browser_navigation"
  | "assertion"
  | "screenshot"
  | "trace"
  | "console_inspection"
  | "network_inspection"
  | "telemetry_lookup"
  | "failure_classification"
  | "evidence_generation";

export const QA_AGENT_CAPABILITIES: QaAgentCapability[] = [
  "scenario_execution",
  "browser_navigation",
  "assertion",
  "screenshot",
  "trace",
  "console_inspection",
  "network_inspection",
  "telemetry_lookup",
  "failure_classification",
  "evidence_generation",
];

/** Proibições do QA Agent (nunca edit code / commit / deploy / merge). */
export const QA_AGENT_FORBIDDEN: string[] = ["edit code", "git commit", "deploy", "merge"];

export interface QaFinding {
  findingId: string;
  runId: string;
  scenarioId: string;
  severity: FindingSeverity;
  evidence: EvidencePack;
  classification?: string;
  passed: boolean;
}

export interface QaRunConfig {
  runId: string;
  commitSha: string;
  environment: string;
  browser: string;
  scenario: Scenario;
}

export interface QaAgentOptions {
  /** Se true, qualquer assert que falhe vira finding high (T20: com repeat). */
  onFailureSeverity?: FindingSeverity;
}
