/**
 * model-fallback.ts — Deterministic Model Fallback (P13-01).
 *
 * Quando o modelo primário falha com model_failure/agent_failure e retry
 * esgotou, tenta a cadeia de fallback models em ordem. Cada tentativa
 * cria um novo plano com o modelo alternativo e chama o exec original.
 *
 * Fail-open: sem fallbackModels → retorna o outcome original sem mudança.
 */

import type { AgentAdapter } from "@/ai/core/agent-contract";
import type { ExecutionPlan, ExecutionStep } from "@/ai/core/execution-plan";
import type { TelemetryEventType } from "@/ai/telemetry/envelope";
import type { ExecuteStepFn, StepOutcome } from "./step-executor";
import { classifyFailure, type FailureCategory } from "./failure-taxonomy";

export interface FallbackContext {
  adapter: AgentAdapter;
  step: ExecutionStep;
  plan: ExecutionPlan;
  exec: ExecuteStepFn;
  fallbackModels: string[];
  emit: (type: TelemetryEventType, p: object, success?: boolean) => void;
}

/**
 * Tenta fallback determinístico quando retry esgotou e há modelos alternativos.
 * Retorna o outcome final (sucesso em algum fallback ou último falho).
 */
export async function tryModelFallback(
  outcome: StepOutcome,
  attempts: number,
  ctx: FallbackContext,
): Promise<{ outcome: StepOutcome; attempts: number }> {
  const category = classifyFailure(outcome.errorCode, "agent");
  if (category !== "model_failure" && category !== "agent_failure") {
    return { outcome, attempts };
  }

  for (const fallbackModel of ctx.fallbackModels) {
    ctx.emit("agent.dispatched", {
      agentRole: ctx.step.role,
      stepId: ctx.step.id,
      fallbackModel,
      reason: "deterministic-fallback",
    });

    const fallbackPlan = { ...ctx.plan, model: fallbackModel };
    const fallbackOutcome = await ctx.exec(ctx.adapter, ctx.step, fallbackPlan);
    attempts += 1;

    if (fallbackOutcome.success) {
      ctx.emit(
        "agent.completed",
        {
          agentRole: ctx.step.role,
          stepId: ctx.step.id,
          durationMs: fallbackOutcome.durationMs,
          fallbackModel,
          reason: "deterministic-fallback-resolved",
        },
        true,
      );
      return {
        outcome: { ...fallbackOutcome, attempts, failureCategory: category },
        attempts,
      };
    }

    outcome = { ...fallbackOutcome, attempts, failureCategory: category };
  }

  return { outcome, attempts };
}
