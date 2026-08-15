/**
 * role-stats.ts — Agregação de estatísticas por role (P12-08).
 *
 * Extraído do workflow-efficiency.ts para respeitar o hard limit de
 * 150 linhas (rule-41). `roleInvocation` mapeia quando cada role é
 * invocado/skipado por estratégia; `aggregateRoleRuns` soma métricas.
 */

import type { RunMetrics } from "./types";
import type { RoleName } from "./workflow-roles";

/** Mapeia cada role para a fração de runs em que é invocado/skipado. */
export function roleInvocation(
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

export interface RoleTotals {
  inv: number;
  skip: number;
  success: number;
  failure: number;
  latency: number;
  tokens: number;
  cost: number;
}

/** Soma invocação/sucesso/latência/tokens/custo de um role em todas as estratégias. */
export function aggregateRoleRuns(
  groups: Record<string, RunMetrics[]>,
  role: RoleName,
): RoleTotals {
  const totals: RoleTotals = {
    inv: 0,
    skip: 0,
    success: 0,
    failure: 0,
    latency: 0,
    tokens: 0,
    cost: 0,
  };
  for (const s of ["single", "multi", "graph+multi"]) {
    const group = groups[s];
    if (!group) continue;
    const { inv: invFrac, skip: skipFrac } = roleInvocation(group, role, s);
    const n = group.length;
    totals.inv += invFrac * n;
    totals.skip += skipFrac * n;
    const ok = group.filter((r) => r.status === "success").length;
    totals.success += invFrac * ok;
    totals.failure += invFrac * (n - ok);
    // Latência/tokens/custo: fração da execução atribuída ao role.
    totals.latency += invFrac * (n ? group.reduce((a, r) => a + r.durationMs, 0) / (n * 3) : 0);
    totals.tokens += invFrac * (n ? group.reduce((a, r) => a + r.totalTokens, 0) / (n * 3) : 0);
    totals.cost += invFrac * (n ? group.reduce((a, r) => a + r.cost, 0) / (n * 3) : 0);
  }
  return totals;
}

/** Contribuição estimada do role na redução de rework. */
export function reworkPreventedFor(
  role: RoleName,
  singleRework: number,
  multiRework: number,
  total: number,
): number {
  if (role === "reviewer" || role === "tester" || role === "validator") {
    return Math.min(1, (multiRework - singleRework) / total + 0.2);
  }
  if (role === "scouts" || role === "architect") return 0.25;
  if (role === "implementer") return 0.1;
  return 0;
}
