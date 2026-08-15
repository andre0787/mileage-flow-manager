/**
 * task-contract.ts — Task Contract (SDD v5.0, seção 11).
 *
 * Cada task declara o que precisa (capabilities), o risco, se é
 * paralelizável e o escopo de escrita — insumo do planner/orchestrator.
 */

export type TaskRisk = "low" | "medium" | "high";

export interface TaskContract {
  taskId: string;
  intent: string;
  requiredCapabilities: string[];
  risk: TaskRisk;
  parallelizable: boolean;
  /** Escopo de escrita (arquivos/dirs/migrations/config) — base do paralelismo seguro. */
  writeScope: string[];
  expectedArtifacts: string[];
}

/** Conflito de escrita: duas tasks não podem tocar o mesmo recurso em paralelo. */
export function conflictsWith(a: TaskContract, b: TaskContract): boolean {
  const scopeA = new Set(a.writeScope);
  return b.writeScope.some((item) => scopeA.has(item));
}

/**
 * Normaliza uma task parcial (ex.: vinda de um card) em TaskContract válido.
 * Fail-open: campos ausentes ganham defaults seguros.
 */
export function normalizeTask(partial: Partial<TaskContract>): TaskContract {
  return {
    taskId: partial.taskId ?? "TASK-UNNAMED",
    intent: partial.intent ?? "",
    requiredCapabilities: partial.requiredCapabilities ?? [],
    risk: partial.risk ?? "medium",
    parallelizable: partial.parallelizable ?? false,
    writeScope: partial.writeScope ?? [],
    expectedArtifacts: partial.expectedArtifacts ?? [],
  };
}
