/**
 * execution-plan.ts — Execution Plan & Budget (SDD v5.0, seções 16-18).
 *
 * O plano é independente do agente: steps com parallelGroup/dependsOn.
 * O scheduler decide execução paralela quando writeScopes não colidem.
 */

export interface ExecutionStep {
  id: string;
  role: string; // "graph-scout" | "architect" | "implementer" | ...
  parallelGroup?: number;
  dependsOn?: string[];
  /** Marca steps que o adapter não desempenha (degradação §14). */
  skipped?: boolean;
}

export interface ExecutionBudget {
  maxAgents: number;
  maxParallel: number;
  maxTurns: number;
  maxToolCalls: number;
  maxTokens: number;
  maxCost: number;
  maxDurationMs: number;
}

export interface ExecutionPlan {
  planId: string;
  /** Identificador do run (uma execução completa) — P11-03. Default: planId. */
  runId?: string;
  taskId: string;
  agent: string;
  model: string;
  steps: ExecutionStep[];
  budget: ExecutionBudget;
  createdAt: string;
}

/** Budget padrão (SDD seção 18). */
export function defaultBudget(): ExecutionBudget {
  return {
    maxAgents: 8,
    maxParallel: 4,
    maxTurns: 60,
    maxToolCalls: 150,
    maxTokens: 100000,
    maxCost: 2.0,
    maxDurationMs: 900000,
  };
}

/**
 * Agrupa steps por parallelGroup preservando ordem — insumo do scheduler.
 * Steps sem grupo e sem dependências ficam no grupo 1 (default).
 */
export function groupSteps(steps: ExecutionStep[]): ExecutionStep[][] {
  const groups = new Map<number, ExecutionStep[]>();
  for (const step of steps) {
    const g = step.parallelGroup ?? 1;
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(step);
  }
  return [...groups.entries()].sort((a, b) => a[0] - b[0]).map(([, group]) => group);
}

/**
 * Serializa um plano (degradação sem paralelismo): todos os steps
 * sequenciais, sem parallelGroup — SDD seção 14.
 */
export function serializePlan(plan: ExecutionPlan): ExecutionPlan {
  return {
    ...plan,
    steps: plan.steps.map((s, i) => ({
      id: s.id,
      role: s.role,
      parallelGroup: i + 1,
      dependsOn: i > 0 ? [plan.steps[i - 1].id] : undefined,
    })),
  };
}
