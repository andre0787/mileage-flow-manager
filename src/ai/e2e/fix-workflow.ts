/**
 * fix-workflow.ts — Controlled Fix Workflow (P12.5-10).
 *
 * Fluxo: Finding → Triage → Bug confirmado → Fix Agent → Unit tests → E2E
 * regression → Reviewer → PR.
 *
 * Autonomia CAPPED no Level 3: o Fix Agent pode editar código, criar testes e
 * rodar testes, mas NUNCA merge/deploy/alterar secrets/bypassar gates.
 */

import type { EvidencePack } from "./evidence";
import type { TriageResult } from "./triage";

export interface FixInput {
  finding: EvidencePack;
  triage: TriageResult;
  relevantFiles: string[];
  graphContext: string[];
  domainContext: string[];
  testContext: string[];
}

export interface FixProposal {
  findingId: string;
  fixDescription: string;
  smallestSafeFix: string;
  filesToChange: string[];
  newTests: string[];
  regressionScenarios: string[];
  createdAt: string;
}

export interface FixExecution {
  proposal: FixProposal;
  unitTestsPassed: boolean;
  e2eRegressionPassed: boolean;
  reviewerApproved: boolean;
  prCreated: boolean;
  prUrl?: string;
  merged: boolean;
  deployed: boolean;
}

export const AUTONOMY_LEVELS = [0, 1, 2, 3, 4] as const;
export type AutonomyLevel = (typeof AUTONOMY_LEVELS)[number];

/** P12.5 está CAPPED no Level 3 (nunca auto-merge). */
export const MAX_AUTONOMY: AutonomyLevel = 3;

export function autonomyLabel(level: AutonomyLevel): string {
  switch (level) {
    case 0:
      return "detect";
    case 1:
      return "detect + evidence + classification";
    case 2:
      return "+ fix proposal";
    case 3:
      return "+ fix + tests + E2E regression + PR";
    case 4:
      return "+ auto-merge";
  }
}

/** Autonomia permitida: máx. Level 3 (T22 — sem auto-merge). */
export function isAutonomyAllowed(level: AutonomyLevel): boolean {
  return level <= MAX_AUTONOMY;
}

/** Gera a proposta de fix (smallest safe fix, sem refactor amplo). */
export function proposeFix(input: FixInput): FixProposal {
  const { finding, triage, relevantFiles } = input;
  const area = triage.affectedArea;
  const regressionScenarios = ["create-mileage-entry", "dashboard-totals", "demo-reset"];
  return {
    findingId: finding.findingId,
    fixDescription: `Fix ${triage.classification} in ${area}: ${triage.rootCauseHypothesis}`,
    smallestSafeFix: `targeted change in ${area} handler/component addressing the failing path`,
    filesToChange: relevantFiles,
    newTests: [`unit: ${area} regression for ${finding.findingId}`],
    regressionScenarios,
    createdAt: new Date().toISOString(),
  };
}

/** Executa o workflow controlado — retorna o nível máximo alcançado (≤ 3). */
export function executeFixWorkflow(
  input: FixInput,
  gates: {
    unitTestsPassed: boolean;
    e2eRegressionPassed: boolean;
    reviewerApproved: boolean;
    prCreated: boolean;
  },
): { execution: FixExecution; levelReached: AutonomyLevel } {
  const proposal = proposeFix(input);
  const merged = false;
  const deployed = false;
  return {
    execution: {
      proposal,
      ...gates,
      merged,
      deployed,
    },
    levelReached: MAX_AUTONOMY,
  };
}

/** Hard safety: nunca auto-merge/deploy, mesmo que gates passem (T22). */
export function assertNoAutoMerge(execution: FixExecution): boolean {
  return !execution.merged && !execution.deployed;
}
