/**
 * dispatcher.ts — Dispatcher (SDD v5.0, §12/§18/§19; P11-02 Reliability).
 *
 * Executa os batches do scheduler chamando o `execute` do adapter,
 * respeitando o budget e emitindo telemetry envelope (§19). `executeStep`
 * é injetável — permite testar sem agente real. Fail-open: erro de um
 * step não derruba o plano (marca falha e continua até maxFailures).
 *
 * A execução por step (retry/backoff/cancel/failure taxonomy) vive em
 * step-executor.ts; o portão de budget serializado em budget.ts
 * (rule-41 — hard limit de 150 linhas por arquivo).
 */

import type { AgentAdapter } from "@/ai/core/agent-contract";
import type { ExecutionPlan, ExecutionStep } from "@/ai/core/execution-plan";
import { createTelemetryEnvelope, type TelemetryEnvelope } from "@/ai/telemetry/envelope";
import { consumeResources, createBudgetGate, initialBudgetState, type BudgetState } from "./budget";
import { schedulePlan } from "./scheduler";
import { executeBatch, type ExecuteStepFn, type StepOutcome } from "@/ai/execution/step-executor";
import type { RetryPolicy } from "@/ai/execution/retry";

export interface DispatchOptions {
  executeStep?: ExecuteStepFn;
  onTelemetry?: (env: TelemetryEnvelope) => void;
  supportsParallel?: boolean;
  maxFailures?: number;
  /** Retry policy (P11-02). Default: sem retry (maxRetries 0). */
  retryPolicy?: RetryPolicy;
  /** Sinal de cancelamento — propaga para os steps (agent.cancelled). */
  signal?: AbortSignal;
  /** Cadeia de fallback models (P13-01): quando o modelo primário falha, tenta estes em ordem. */
  fallbackModels?: string[];
}

export interface DispatchResult {
  outcomes: StepOutcome[];
  state: BudgetState;
  ok: boolean;
  cancelled: boolean;
}

export async function dispatchPlan(
  plan: ExecutionPlan,
  adapter: AgentAdapter,
  opts: DispatchOptions = {},
): Promise<DispatchResult> {
  const exec = opts.executeStep;
  const onTelemetry = opts.onTelemetry ?? (() => {});
  const supportsParallel = opts.supportsParallel ?? adapter.capabilities().parallelAgents;
  const maxFailures = opts.maxFailures ?? 0;
  const retryPolicy = opts.retryPolicy;
  const signal = opts.signal;

  const { batches } = schedulePlan(plan, { supportsParallel });
  const outcomes: StepOutcome[] = [];
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

  // P11-02: gate de budget serializado (check+reserve atômicos mesmo com
  // Promise.all no batch). `setState` recebe os recursos consumidos.
  const gate = createBudgetGate(plan.budget, initialBudgetState());

  for (const batch of batches) {
    if (failures > maxFailures) break;
    if (signal?.aborted) {
      cancelled = true;
      emit("agent.cancelled", { agentRole: batch.map((s) => s.role).join("+") }, false);
      break;
    }
    emit("parallel.batch.started", { agentRole: batch.map((s) => s.role).join("+") });

    const batchResult = await executeBatch({
      adapter,
      plan,
      batch,
      exec,
      retryPolicy,
      fallbackModels: opts.fallbackModels,
      signal,
      emit,
      reserve: gate.reserve,
      consume: (outcome) => gate.setState(consumeResources(gate.getState(), outcome)),
    });
    failures += batchResult.failures;
    if (batchResult.cancelled) cancelled = true;
    outcomes.push(...batchResult.outcomes);
    emit("parallel.batch.completed", {});
  }

  emit(
    cancelled ? "agent.cancelled" : failures > 0 ? "execution.failed" : "execution.completed",
    {},
    failures === 0 && !cancelled,
  );
  return { outcomes, state: gate.getState(), ok: failures === 0 && !cancelled, cancelled };
}
