/**
 * step-executor.ts — Execução de steps com retry (P11-02 Reliability).
 *
 * Extraído do dispatcher (rule-41 — hard limit de 150 linhas): encapsula a
 * execução de um step com reserva atômica de budget, cancelamento
 * propagado (signal → agent.cancelled), retry com backoff e failure
 * taxonomy nos outcomes. O dispatcher orquestra os batches chamando
 * `executeBatch`.
 */

import type { AgentAdapter } from "@/ai/core/agent-contract";
import type { ExecutionPlan, ExecutionStep } from "@/ai/core/execution-plan";
import type { TelemetryEventType } from "@/ai/telemetry/envelope";
import { classifyFailure, type FailureCategory } from "@/ai/execution/failure-taxonomy";
import { shouldRetry, type RetryPolicy } from "@/ai/execution/retry";
import { estimateCost } from "@/lib/aiTelemetry";

export interface StepOutcome {
  stepId: string;
  role: string;
  success: boolean;
  output?: string;
  errorCode?: string | null;
  durationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  toolCalls?: number;
  /** Quantas tentativas foram feitas (1 = sem retry; P11-02). */
  attempts?: number;
  /** Categoria da falha (P11-02 failure taxonomy). */
  failureCategory?: FailureCategory;
}

export type ExecuteStepFn = (
  adapter: AgentAdapter,
  step: ExecutionStep,
  plan: ExecutionPlan,
) => Promise<StepOutcome>;

export const defaultExecute: ExecuteStepFn = async (adapter, step, plan) => {
  const res = await adapter.execute({ taskId: plan.taskId, intent: step.role, model: plan.model });
  return {
    stepId: step.id,
    role: step.role,
    success: res.success,
    output: res.output,
    errorCode: res.errorCode,
    durationMs: res.durationMs,
    inputTokens: res.inputTokens,
    outputTokens: res.outputTokens,
    toolCalls: res.toolCalls,
  };
};

export interface StepRunContext {
  adapter: AgentAdapter;
  plan: ExecutionPlan;
  step: ExecutionStep;
  exec?: ExecuteStepFn;
  retryPolicy?: RetryPolicy;
  signal?: AbortSignal;
  /** Emite um envelope de telemetria (build feito pelo dispatcher). */
  emit: (type: TelemetryEventType, p: object, success?: boolean) => void;
  /** Reserva atômica de budget (agents/turns). */
  reserve: () => Promise<{ ok: boolean; reason?: string }>;
  /** Acumula recursos mensuráveis do outcome no estado do budget. */
  consume: (outcome: StepOutcome) => void;
}

/**
 * Executa um step com retry (quando policy presente) e emite os eventos
 * agent.dispatched / agent.completed|failed / agent.cancelled. Retorna o
 * outcome com attempts e failureCategory sempre presentes.
 */
export async function runStepWithRetry(ctx: StepRunContext): Promise<StepOutcome> {
  const exec = ctx.exec ?? defaultExecute;

  const reserved = await ctx.reserve();
  if (!reserved.ok) {
    return {
      stepId: ctx.step.id,
      role: ctx.step.role,
      success: false,
      errorCode: reserved.reason,
      attempts: 1,
      failureCategory: "budget_failure",
    };
  }
  if (ctx.signal?.aborted) {
    ctx.emit("agent.cancelled", { agentRole: ctx.step.role }, false);
    return {
      stepId: ctx.step.id,
      role: ctx.step.role,
      success: false,
      errorCode: "cancelled",
      attempts: 1,
      failureCategory: "cancellation",
    };
  }
  ctx.emit("agent.dispatched", { agentRole: ctx.step.role, stepId: ctx.step.id });

  let outcome: StepOutcome;
  let attempts = 0;
  do {
    attempts += 1;
    outcome = await exec(ctx.adapter, ctx.step, ctx.plan);
    if (outcome.success) break;
    const category = classifyFailure(outcome.errorCode, "agent");
    outcome = { ...outcome, attempts, failureCategory: category };
    if (!ctx.retryPolicy) break;
    if (!shouldRetry(outcome.errorCode, ctx.retryPolicy, category)) break;
    if (attempts > ctx.retryPolicy.maxRetries) break;
    const delay =
      (ctx.retryPolicy.baseDelayMs ?? 200) * Math.pow(ctx.retryPolicy.factor ?? 2, attempts - 1);
    await new Promise((r) => setTimeout(r, delay));
  } while (attempts <= (ctx.retryPolicy?.maxRetries ?? 0));

  // `attempts` sempre presente (1 = sem retry) — P11-02.
  // A reserva já contou agent/turn; aqui soma-se apenas recursos reais.
  outcome = { ...outcome, attempts, failureCategory: outcome.failureCategory };
  ctx.consume(outcome);
  const failed = !outcome.success;
  ctx.emit(
    failed ? "agent.failed" : "agent.completed",
    {
      agentRole: ctx.step.role,
      stepId: ctx.step.id,
      durationMs: outcome.durationMs,
      inputTokens: outcome.inputTokens,
      outputTokens: outcome.outputTokens,
      toolCalls: outcome.toolCalls,
      cost: estimateCost((outcome.inputTokens ?? 0) + (outcome.outputTokens ?? 0)),
      ...(failed ? { errorCode: outcome.errorCode } : {}),
    },
    !failed,
  );
  return outcome;
}

export interface BatchRunContext extends Omit<StepRunContext, "step"> {
  batch: ExecutionStep[];
}

/**
 * Executa um batch em paralelo (Promise.all). Fail-open: erro de um step
 * não derruba o plano (marca falha e continua até maxFailures).
 */
export async function executeBatch(
  ctx: BatchRunContext,
): Promise<{ outcomes: StepOutcome[]; cancelled: boolean; failures: number }> {
  let cancelled = false;
  let failures = 0;
  const outcomes = await Promise.all(
    ctx.batch.map(async (step) => {
      const outcome = await runStepWithRetry({ ...ctx, step });
      // Cancelamento não conta como falha (semântica original do dispatcher).
      if (outcome.failureCategory === "cancellation") {
        cancelled = true;
      } else if (!outcome.success) {
        failures += 1;
      }
      return outcome;
    }),
  );
  return { outcomes, cancelled, failures };
}
