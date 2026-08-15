/**
 * scheduler.ts — Scheduler (SDD v5.0, §17).
 *
 * Converte steps em lotes: `parallelGroup` define o que roda em paralelo;
 * `dependsOn` define ordem. Degrada para execução serial quando o
 * adapter não suporta paralelismo (§14) via `serializePlan`.
 */

import {
  groupSteps,
  serializePlan,
  type ExecutionPlan,
  type ExecutionStep,
} from "@/ai/core/execution-plan";
import { resolveOrder } from "./dependency-resolver";

export interface ScheduleResult {
  /** Lotes de steps que podem rodar em paralelo entre si. */
  batches: ExecutionStep[][];
  serial: boolean;
  error?: string;
}

/**
 * Agenda os steps do plano. `serial: true` quando o adapter não suporta
 * paralelismo (cada step vira seu próprio lote).
 */
export function schedulePlan(
  plan: ExecutionPlan,
  opts?: { supportsParallel?: boolean },
): ScheduleResult {
  const supportsParallel = opts?.supportsParallel ?? true;
  const active = plan.steps.filter((s) => !s.skipped);
  if (active.length === 0) {
    return { batches: [], serial: false, error: "plano sem steps ativos (todos skipped)" };
  }

  const { order, cycle } = resolveOrder(active);
  if (cycle) {
    // Degradação: ciclo → serial na ordem original
    return {
      batches: order.map((s) => [s]),
      serial: true,
      error: `ciclo detectado: ${cycle.join(" -> ")}`,
    };
  }

  if (!supportsParallel) {
    const serial = serializePlan({ ...plan, steps: order });
    return {
      batches: serial.steps.filter((s) => !s.skipped).map((s) => [s]),
      serial: true,
    };
  }

  // Agrupa pela ordem topológica preservando parallelGroup
  const byGroup = new Map<number, ExecutionStep[]>();
  for (const step of order) {
    const g = step.parallelGroup ?? 1;
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g)!.push(step);
  }
  const batches = [...byGroup.entries()].sort((a, b) => a[0] - b[0]).map(([, group]) => group);
  return { batches, serial: false };
}

export { groupSteps };
