/**
 * adaptive-planner.ts — Adaptive Planner (P11-05 Adaptive Orchestration).
 *
 * O workflow NÃO é fixo: a task class decide os papéis (Tiny→implement+validate,
 * Large→scouts+architect+implement+test+review+validator). Anti-over-
 * orchestration: papéis com custo esperado > valor são skipped, com
 * explainability (why_run/why_skip/why_parallel/why_serial) registrada.
 */

import type { ExecutionStep } from "@/ai/core/execution-plan";
import type { TaskClass } from "./classifier";

/** Por que um papel roda ou é pulado (P11-05 explainability). */
export interface StepDecision {
  stepId: string;
  role: string;
  decision: "run" | "skip";
  why: string;
  /** Overhead estimado (tokens) que o papel adicionaria ao workflow. */
  estimatedOverheadTokens?: number;
}

export interface AdaptivePlan {
  steps: ExecutionStep[];
  decisions: StepDecision[];
  taskClass: TaskClass;
  /** Se graph-scout está habilitado (P13-03). */
  graphEnabled: boolean;
}

/** Workflow padrão por classe (spec §P11-05). */
/**
 * Workflow padrão por classe (spec §P11-05 + P13-03 evidence-driven).
 * P13-03: graph+multi é prejudicial em tiny/small (custo de contexto > ganho).
 * Graph-scout só roda em medium/large.
 */
const CLASS_WORKFLOWS: Record<TaskClass, string[]> = {
  tiny: ["implementer", "final-validator"],
  small: ["implementer", "tester"],
  medium: ["graph-scout", "domain-scout", "architect", "implementer", "tester", "reviewer"],
  large: [
    "graph-scout",
    "domain-scout",
    "test-scout",
    "history-scout",
    "architect",
    "implementer",
    "tester",
    "reviewer",
    "final-validator",
  ],
};

/**
 * Determina se graph-scout deve rodar para a classe da task.
 * P13-03: graph é prejudicial para tiny/small (custo > benefício).
 */
export function shouldUseGraph(taskClass: TaskClass): boolean {
  return taskClass === "medium" || taskClass === "large";
}

/** Custo médio estimado (tokens) por papel — base do anti-over-orchestration. */
export const ROLE_OVERHEAD_TOKENS: Record<string, number> = {
  "graph-scout": 800,
  "domain-scout": 600,
  "test-scout": 500,
  "history-scout": 400,
  architect: 1200,
  implementer: 3000,
  tester: 900,
  reviewer: 1000,
  "final-validator": 500,
};

export interface AdaptivePlannerOptions {
  /** Papéis que podem ser pulados quando o valor esperado é baixo. */
  skipWhen?: (role: string) => boolean;
  /** Limite de overhead aceitável (tokens) antes de pular scouts. */
  overheadBudgetTokens?: number;
}

const DEFAULTS: Required<Pick<AdaptivePlannerOptions, "overheadBudgetTokens">> = {
  overheadBudgetTokens: 2500,
};

/**
 * Monta o plano adaptativo para uma classe. Anti-over-orchestration:
 * scouts opcionais são pulados quando o overhead total estimado excede o
 * orçamento (salvo requirements de segurança/qualidade sinalizadas).
 */
export function buildAdaptivePlan(
  taskId: string,
  taskClass: TaskClass,
  opts: AdaptivePlannerOptions = {},
): AdaptivePlan {
  const roles = CLASS_WORKFLOWS[taskClass];
  const skipWhen = opts.skipWhen ?? (() => false);
  const overheadBudget = opts.overheadBudgetTokens ?? DEFAULTS.overheadBudgetTokens;

  const decisions: StepDecision[] = [];
  const steps: ExecutionStep[] = [];
  let totalOverhead = 0;

  roles.forEach((role, idx) => {
    const stepId = `${role}-${idx}`;
    const overhead = ROLE_OVERHEAD_TOKENS[role] ?? 500;
    const isScout = role.endsWith("-scout");

    if (isScout && skipWhen(role) && totalOverhead + overhead > overheadBudget) {
      decisions.push({
        stepId,
        role,
        decision: "skip",
        why: `overhead estimado (${totalOverhead + overhead} tokens) excede o orçamento ${overheadBudget} — scout sem valor esperado suficiente`,
        estimatedOverheadTokens: overhead,
      });
      return;
    }
    totalOverhead += overhead;
    decisions.push({
      stepId,
      role,
      decision: "run",
      why: `papel obrigatório do workflow ${taskClass}: ${role}`,
      estimatedOverheadTokens: overhead,
    });
    steps.push({
      id: stepId,
      role,
      parallelGroup: idx + 1,
      dependsOn: idx > 0 ? [`${roles[idx - 1]}-${idx - 1}`] : undefined,
    });
  });

  return { steps, decisions, taskClass, graphEnabled: shouldUseGraph(taskClass) };
}
