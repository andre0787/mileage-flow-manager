/**
 * architect.ts — Architect (Agent Execution Spec §18).
 *
 * Transforma findings dos scouts em um ExecutionPlan: define o write-set
 * a partir do alvo/task, decide serial/paralelo (writeScope sem colisão)
 * e a validação esperada. Não implementa — apenas planeja.
 */

import type { SubagentResult } from "./subagent-result";
import type { GraphScoutResult, TestScoutResult } from "./scouts";
import { DEFAULT_ROLES, planExecution, type PlannerInput } from "@/ai/orchestration/planner";
import type { AgentAdapter } from "@/ai/core/agent-contract";
import { defaultBudget, type ExecutionPlan } from "@/ai/core/execution-plan";
import { normalizeTask } from "@/ai/core/task-contract";

export interface ArchitectInput {
  target: string;
  intent: string;
  scouts: {
    graph?: GraphScoutResult;
    domain?: SubagentResult;
    test?: TestScoutResult;
  };
  adapters: AgentAdapter[];
  taskId?: string;
}

export interface ArchitectOutput {
  plan?: ExecutionPlan;
  writeScope: string[];
  risks: string[];
  recommendedValidation: string[];
  error?: string;
}

/**
 * Monta o write-set: arquivos recomendados pelos scouts + testes alvo.
 * Esses são os recursos que NÃO podem ser tocados por outro agente em
 * paralelo (spec §8).
 */
export function deriveWriteScope(input: ArchitectInput): string[] {
  const fromGraph = input.scouts.graph?.recommendedFiles ?? [];
  const fromTest =
    input.scouts.test?.neededTests?.map((t) => t.split("→").pop()?.trim() ?? t) ?? [];
  const fromDomain = input.scouts.domain?.files ?? [];
  return [...new Set([input.target, ...fromGraph, ...fromTest, ...fromDomain])].filter(Boolean);
}

export function architectFromScouts(input: ArchitectInput): ArchitectOutput {
  const task = normalizeTask({
    taskId: input.taskId ?? `TASK-${input.target.replace(/[^a-zA-Z0-9-]/g, "-")}`,
    intent: input.intent,
    requiredCapabilities: ["toolCalling", "structuredOutput"],
    risk:
      input.scouts.graph?.impactScore && input.scouts.graph.impactScore > 0.5 ? "high" : "medium",
    parallelizable: true,
    writeScope: deriveWriteScope(input),
    expectedArtifacts: input.scouts.test?.neededTests ?? [],
  });

  const plannerInput: PlannerInput = {
    task,
    adapters: input.adapters,
    roles: DEFAULT_ROLES,
    budget: defaultBudget(),
  };

  const out = planExecution(plannerInput);
  const risks = [...(input.scouts.graph?.risks ?? [])];
  if (!input.scouts.graph?.available) {
    risks.push("grafo indisponível — impacto não validado");
  }

  return {
    plan: out.plan,
    writeScope: task.writeScope,
    risks,
    recommendedValidation: [
      "npm run typecheck",
      "npm test",
      "npm run pre-pr",
      ...(input.scouts.test?.neededTests.length
        ? ["cobrir gaps de teste apontados pelo Test Scout"]
        : []),
    ],
    error: out.error,
  };
}
