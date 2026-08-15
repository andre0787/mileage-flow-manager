/**
 * dispatcher.ts — Dispatcher (SDD v5.0, §12/§18/§19; P11-02 Reliability).
 *
 * Executa os batches do scheduler chamando o `execute` do adapter,
 * respeitando o budget e emitindo telemetry envelope (§19). `executeStep`
 * é injetável — permite testar sem agente real. Fail-open: erro de um
 * step não derruba o plano (marca falha e continua até maxFailures).
 *
 * P11-02: retry com backoff (retryable/conditional), cancelamento
 * propagado (signal → agent.cancelled) e failure taxonomy nos outcomes.
 */

import type { AgentAdapter } from "@/ai/core/agent-contract";
import type { ExecutionPlan, ExecutionStep } from "@/ai/core/execution-plan";
import { createTelemetryEnvelope, type TelemetryEnvelope } from "@/ai/telemetry/envelope";
import {
  checkBudget,
  consumeBudget,
  consumeResources,
  initialBudgetState,
  type BudgetState,
} from "./budget";
import { schedulePlan } from "./scheduler";
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

export interface DispatchOptions {
  executeStep?: (
    adapter: AgentAdapter,
    step: ExecutionStep,
    plan: ExecutionPlan,
  ) => Promise<StepOutcome>;
  onTelemetry?: (env: TelemetryEnvelope) => void;
  supportsParallel?: boolean;
  maxFailures?: number;
  /** Retry policy (P11-02). Default: sem retry (maxRetries 0). */
  retryPolicy?: RetryPolicy;
  /** Sinal de cancelamento — propaga para os steps (agent.cancelled). */
  signal?: AbortSignal;
}

export interface DispatchResult {
  outcomes: StepOutcome[];
  state: BudgetState;
  ok: boolean;
  cancelled: boolean;
}

const defaultExecute = async (
  adapter: AgentAdapter,
  step: ExecutionStep,
  plan: ExecutionPlan,
): Promise<StepOutcome> => {
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

export async function dispatchPlan(
  plan: ExecutionPlan,
  adapter: AgentAdapter,
  opts: DispatchOptions = {},
): Promise<DispatchResult> {
  const exec = opts.executeStep ?? defaultExecute;
  const onTelemetry = opts.onTelemetry ?? (() => {});
  const supportsParallel = opts.supportsParallel ?? adapter.capabilities().parallelAgents;
  const maxFailures = opts.maxFailures ?? 0;
  const retryPolicy = opts.retryPolicy;
  const signal = opts.signal;

  const { batches } = schedulePlan(plan, { supportsParallel });
  const outcomes: StepOutcome[] = [];
  let state = initialBudgetState();
  let failures = 0;
  let cancelled = false;

  const runId = plan.runId ?? plan.planId;
  const emit = (type: Parameters<typeof createTelemetryEnvelope>[0], p: object, success = true) =>
    onTelemetry(
      createTelemetryEnvelope(
        type,
        {
          taskId: plan.taskId,
          runId,
          planId: plan.planId,
          executionId: plan.planId,
          agentAdapter: adapter.id,
          model: plan.model,
          ...p,
        },
        success,
      ),
    );

  emit("execution.started", { phase: "dispatch" });

  // P11-02: gate de budget serializado — check+reserve atômicos mesmo com
  // Promise.all no batch (agents/turns reservados antes da execução).
  let budgetGate: Promise<void> = Promise.resolve();
  const reserveBudget = (): Promise<{ ok: boolean; reason?: string }> => {
    const p = budgetGate.then(() => {
      const check = checkBudget(plan.budget, state, {});
      if (!check.ok) return { ok: false, reason: check.reason };
      state = consumeBudget(state, {});
      return { ok: true };
    });
    // Encadeia sem referenciar p (evita ciclo de promise).
    budgetGate = p.then(
      () => undefined,
      () => undefined,
    );
    return p;
  };

  for (const batch of batches) {
    if (failures > maxFailures) break;
    if (signal?.aborted) {
      cancelled = true;
      emit("agent.cancelled", { agentRole: batch.map((s) => s.role).join("+") }, false);
      break;
    }
    emit("parallel.batch.started", { agentRole: batch.map((s) => s.role).join("+") });

    const batchOutcomes = await Promise.all(
      batch.map(async (step) => {
        // P11-02: reserva atômica de budget (agents/turns) — correta sob
        // concorrência (um step reserva, o outro vê o limite excedido).
        const reserved = await reserveBudget();
        if (!reserved.ok) {
          const outcome: StepOutcome = {
            stepId: step.id,
            role: step.role,
            success: false,
            errorCode: reserved.reason,
            attempts: 1,
            failureCategory: "budget_failure",
          };
          failures += 1;
          return outcome;
        }
        if (signal?.aborted) {
          emit("agent.cancelled", { agentRole: step.role }, false);
          cancelled = true;
          return {
            stepId: step.id,
            role: step.role,
            success: false,
            errorCode: "cancelled",
            attempts: 1,
            failureCategory: "cancellation",
          } satisfies StepOutcome;
        }
        emit("agent.dispatched", { agentRole: step.role, stepId: step.id });

        // P11-02: execução com retry (quando policy presente).
        let outcome: StepOutcome;
        let attempts = 0;
        do {
          attempts += 1;
          outcome = await exec(adapter, step, plan);
          if (outcome.success) break;
          const category = classifyFailure(outcome.errorCode, "agent");
          outcome = { ...outcome, attempts, failureCategory: category };
          if (!retryPolicy) break;
          if (!shouldRetry(outcome.errorCode, retryPolicy, category)) break;
          if (attempts > retryPolicy.maxRetries) break;
          const delay =
            (retryPolicy.baseDelayMs ?? 200) * Math.pow(retryPolicy.factor ?? 2, attempts - 1);
          await new Promise((r) => setTimeout(r, delay));
        } while (attempts <= (retryPolicy?.maxRetries ?? 0));

        // `attempts` sempre presente (1 = sem retry) — P11-02.
        // A reserva já contou agent/turn; aqui soma-se apenas recursos reais.
        outcome = { ...outcome, attempts, failureCategory: outcome.failureCategory };
        state = consumeResources(state, outcome);
        const failed = !outcome.success;
        emit(
          failed ? "agent.failed" : "agent.completed",
          {
            agentRole: step.role,
            stepId: step.id,
            durationMs: outcome.durationMs,
            inputTokens: outcome.inputTokens,
            outputTokens: outcome.outputTokens,
            toolCalls: outcome.toolCalls,
            cost: estimateCost((outcome.inputTokens ?? 0) + (outcome.outputTokens ?? 0)),
            ...(failed ? { errorCode: outcome.errorCode } : {}),
          },
          !failed,
        );
        if (failed) failures += 1;
        return outcome;
      }),
    );

    outcomes.push(...batchOutcomes);
    emit("parallel.batch.completed", {});
  }

  emit(
    cancelled ? "agent.cancelled" : failures > 0 ? "execution.failed" : "execution.completed",
    {},
    failures === 0 && !cancelled,
  );
  return { outcomes, state, ok: failures === 0 && !cancelled, cancelled };
}
