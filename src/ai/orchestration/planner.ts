/**
 * planner.ts — Planner (SDD v5.0, §16).
 *
 * Converte TaskContract + registry de adapters + modelos em um
 * ExecutionPlan com steps por papel (graph-scout → architect →
 * implementer → tester → reviewer). Capability-driven (P3): escolhe o
 * adapter que satisfaz as capacidades requeridas da task e o modelo
 * compatível (rankModels).
 */

import { randomUUID } from "node:crypto";
import type { AgentAdapter } from "@/ai/core/agent-contract";
import { satisfiesCapabilities } from "@/ai/core/agent-contract";
import { rankModels, type ModelCapabilities } from "@/ai/core/model-contract";
import type { TaskContract } from "@/ai/core/task-contract";
import { defaultBudget, type ExecutionPlan, type ExecutionStep } from "@/ai/core/execution-plan";

/** Papéis padrão do fluxo (§12) com dependências em cadeia. */
export const DEFAULT_ROLES: ExecutionStep[] = [
  { id: "graph-scout", role: "graph-scout", parallelGroup: 1 },
  { id: "test-scout", role: "test-scout", parallelGroup: 1 },
  {
    id: "architect",
    role: "architect",
    parallelGroup: 2,
    dependsOn: ["graph-scout", "test-scout"],
  },
  { id: "implementer", role: "implementer", parallelGroup: 3, dependsOn: ["architect"] },
  { id: "tester", role: "tester", parallelGroup: 4, dependsOn: ["implementer"] },
  { id: "reviewer", role: "reviewer", parallelGroup: 5, dependsOn: ["tester"] },
];

export interface PlannerInput {
  task: TaskContract;
  adapters: AgentAdapter[];
  models?: ModelCapabilities[];
  /** Papéis a incluir no plano (default: DEFAULT_ROLES). */
  roles?: ExecutionStep[];
  budget?: ExecutionPlan["budget"];
}

export interface PlannerOutput {
  plan?: ExecutionPlan;
  error?: string;
}

/**
 * Escolhe o primeiro adapter que atende as capacidades requeridas.
 * Retorna undefined se nenhum atende (o caller degrada).
 */
export function pickAdapter(
  adapters: AgentAdapter[],
  required: string[],
): AgentAdapter | undefined {
  return adapters.find((a) => satisfiesCapabilities(a.capabilities(), required));
}

/** Cria o plano. Fail-open: sem adapter compatível → erro descritivo. */
export function planExecution(input: PlannerInput): PlannerOutput {
  const { task, adapters, models, roles, budget } = input;
  const adapter = pickAdapter(adapters, task.requiredCapabilities);
  if (!adapter) {
    return {
      error: `Nenhum adapter satisfaz as capacidades requeridas: ${task.requiredCapabilities.join(", ")}`,
    };
  }

  const model =
    models && models.length > 0
      ? rankModels(models, { toolCalling: true, structuredOutput: true })[0]
      : undefined;

  const steps = (roles ?? DEFAULT_ROLES).map((s) => ({
    ...s,
    // Filtra papéis que o adapter não desempenha (degradação §14)
    ...(!adapter.capabilities().roles.includes(s.role) ? { skipped: true as const } : {}),
  }));

  return {
    plan: {
      planId: randomUUID(),
      taskId: task.taskId,
      agent: adapter.id,
      model: model?.model ?? "unset",
      steps,
      budget: budget ?? defaultBudget(),
      createdAt: new Date().toISOString(),
    },
  };
}
