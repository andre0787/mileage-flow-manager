/**
 * workflow-efficiency.ts — P12-08 Workflow Efficiency Analysis.
 *
 * Para cada role (classifier, planner, scouts, architect, implementer,
 * tester, reviewer, validator): invocation_count, skip_count, success_count,
 * failure_count, rework_prevented, latency, tokens, cost e o
 * role_value_score (spec §P12-08):
 *
 *   role_value = (quality/rework improvement) / (cost + latency)
 *
 * A definição é configurável. Identifica também roles frequentemente
 * desnecessários (skip alto + valor baixo). A agregação por role vive em
 * role-stats.ts (rule-41 — hard limit de 150 linhas).
 */

import type { RunMetrics } from "./types";
import {
  DEFAULT_ROLE_WEIGHTS,
  ROLES,
  type RoleName,
  type RoleValueWeights,
} from "./workflow-roles";
import { aggregateRoleRuns, reworkPreventedFor } from "./role-stats";

export {
  DEFAULT_ROLE_WEIGHTS,
  ROLES,
  type RoleName,
  type RoleValueWeights,
} from "./workflow-roles";

export interface RoleStats {
  role: RoleName;
  invocationCount: number;
  skipCount: number;
  successCount: number;
  failureCount: number;
  reworkPrevented: number; // 0..1
  latencyMs: number;
  tokens: number;
  cost: number;
  valueScore: number; // quality/rework improvement ÷ (cost + latency)
  unnecessary: boolean; // skip alto + valor baixo
}

export interface WorkflowEfficiencyReport {
  roles: RoleStats[];
  unnecessaryRoles: RoleName[];
  overOrchestrated: boolean;
  orchestrationOverhead: number; // média §7
}

export function analyzeWorkflowEfficiency(
  runs: RunMetrics[],
  weights: RoleValueWeights = DEFAULT_ROLE_WEIGHTS,
): WorkflowEfficiencyReport {
  const groups: Record<string, RunMetrics[]> = {
    single: runs.filter((r) => r.strategy === "single"),
    multi: runs.filter((r) => r.strategy === "multi"),
    "graph+multi": runs.filter((r) => r.strategy === "graph+multi"),
  };
  const total = runs.length || 1;

  const singleRework = groups.single.reduce((a, r) => a + r.rework, 0);
  const multiRework = groups.multi.reduce((a, r) => a + r.rework, 0);

  const roles: RoleStats[] = ROLES.map((role) => {
    const t = aggregateRoleRuns(groups, role);
    const reworkPrevented = reworkPreventedFor(role, singleRework, multiRework, total);

    // value_score = (quality + rework improvement) ÷ (cost + latency) — normalizado.
    const qualityContribution =
      role === "implementer" ? 0.5 : role === "reviewer" || role === "tester" ? 0.3 : 0.15;
    const reworkContribution = reworkPrevented * 0.4;
    const numerator =
      qualityContribution * weights.qualityWeight + reworkContribution * weights.reworkWeight;
    const denominator = Math.max(
      0.001,
      t.cost * weights.costWeight + (t.latency / 60000) * weights.latencyWeight,
    );
    const valueScore = Math.round((numerator / denominator) * 1000) / 1000;

    const unnecessary =
      t.skip / Math.max(1, t.skip + t.inv) > weights.skipUnnecessaryThreshold && valueScore < 0.05;

    return {
      role,
      invocationCount: Math.round(t.inv),
      skipCount: Math.round(t.skip),
      successCount: Math.round(t.success),
      failureCount: Math.round(t.failure),
      reworkPrevented: Math.round(reworkPrevented * 100) / 100,
      latencyMs: Math.round(t.latency),
      tokens: Math.round(t.tokens),
      cost: Math.round(t.cost * 100000) / 100000,
      valueScore,
      unnecessary,
    };
  });

  const unnecessaryRoles = roles.filter((r) => r.unnecessary).map((r) => r.role);
  const orchestrationOverhead =
    Math.round((runs.reduce((a, r) => a + r.orchestrationOverhead, 0) / total) * 100) / 100;

  return {
    roles,
    unnecessaryRoles,
    overOrchestrated: unnecessaryRoles.length >= 2,
    orchestrationOverhead,
  };
}
