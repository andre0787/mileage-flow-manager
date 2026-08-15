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
 * desnecessários (skip alto + valor baixo).
 */

import type { RunMetrics } from "./types";
import {
  DEFAULT_ROLE_WEIGHTS,
  ROLES,
  type RoleName,
  type RoleValueWeights,
} from "./workflow-roles";

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

/** Mapeia cada role para a fração de runs em que é invocado/skipado. */
function roleInvocation(
  runs: RunMetrics[],
  role: RoleName,
  strategy: string,
): { inv: number; skip: number } {
  if (strategy === "single" && role !== "implementer" && role !== "validator") {
    return { inv: 0, skip: 1 };
  }
  if (strategy === "multi" && (role === "classifier" || role === "scouts")) {
    return { inv: 0, skip: 1 };
  }
  if (strategy === "graph+multi" && role === "classifier") {
    return { inv: 0, skip: 1 };
  }
  return { inv: 1, skip: 0 };
}

export function analyzeWorkflowEfficiency(
  runs: RunMetrics[],
  weights: RoleValueWeights = DEFAULT_ROLE_WEIGHTS,
): WorkflowEfficiencyReport {
  const byStrategy = (s: string) => runs.filter((r) => r.strategy === s);
  const single = byStrategy("single");
  const multi = byStrategy("multi");
  const graphMulti = byStrategy("graph+multi");
  const total = runs.length || 1;

  const roles: RoleStats[] = ROLES.map((role) => {
    let inv = 0;
    let skip = 0;
    let success = 0;
    let failure = 0;
    let latency = 0;
    let tokens = 0;
    let cost = 0;

    for (const s of ["single", "multi", "graph+multi"]) {
      const group = s === "single" ? single : s === "multi" ? multi : graphMulti;
      const { inv: invFrac, skip: skipFrac } = roleInvocation(group, role, s);
      const n = group.length;
      inv += invFrac * n;
      skip += skipFrac * n;
      const ok = group.filter((r) => r.status === "success").length;
      success += invFrac * ok;
      failure += invFrac * (n - ok);
      // Latência/tokens/custo: fração da execução atribuída ao role.
      latency += invFrac * (n ? group.reduce((a, r) => a + r.durationMs, 0) / (n * 3) : 0);
      tokens += invFrac * (n ? group.reduce((a, r) => a + r.totalTokens, 0) / (n * 3) : 0);
      cost += invFrac * (n ? group.reduce((a, r) => a + r.cost, 0) / (n * 3) : 0);
    }

    // Rework prevented: contribuição estimada do role na redução de rework.
    const reworkPrevented =
      role === "reviewer" || role === "tester" || role === "validator"
        ? Math.min(
            1,
            (multi.reduce((a, r) => a + r.rework, 0) - single.reduce((a, r) => a + r.rework, 0)) /
              total +
              0.2,
          )
        : role === "scouts" || role === "architect"
          ? 0.25
          : role === "implementer"
            ? 0.1
            : 0;

    // value_score = (quality + rework improvement) ÷ (cost + latency) — normalizado.
    const qualityContribution =
      role === "implementer" ? 0.5 : role === "reviewer" || role === "tester" ? 0.3 : 0.15;
    const reworkContribution = reworkPrevented * 0.4;
    const numerator =
      qualityContribution * weights.qualityWeight + reworkContribution * weights.reworkWeight;
    const denominator = Math.max(
      0.001,
      cost * weights.costWeight + (latency / 60000) * weights.latencyWeight,
    );
    const valueScore = Math.round((numerator / denominator) * 1000) / 1000;

    const unnecessary =
      skip / Math.max(1, skip + inv) > weights.skipUnnecessaryThreshold && valueScore < 0.05;

    return {
      role,
      invocationCount: Math.round(inv),
      skipCount: Math.round(skip),
      successCount: Math.round(success),
      failureCount: Math.round(failure),
      reworkPrevented: Math.round(reworkPrevented * 100) / 100,
      latencyMs: Math.round(latency),
      tokens: Math.round(tokens),
      cost: Math.round(cost * 100000) / 100000,
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
