/**
 * dispatcher.ts — Dispatcher (SDD v5.0, §12/§18/§19).
 *
 * Executa os batches do scheduler chamando o `execute` do adapter,
 * respeitando o budget e emitindo telemetry envelope (§19). `executeStep`
 * é injetável — permite testar sem agente real. Fail-open: erro de um
 * step não derruba o plano (marca falha e continua até maxFailures).
 */

import type { AgentAdapter } from "@/ai/core/agent-contract";
import type { ExecutionPlan, ExecutionStep } from "@/ai/core/execution-plan";
import { createTelemetryEnvelope, type TelemetryEnvelope } from "@/ai/telemetry/envelope";
import { checkBudget, consumeBudget, initialBudgetState, type BudgetState } from "./budget";
import { schedulePlan } from "./scheduler";

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
}

export interface DispatchResult {
  outcomes: StepOutcome[];
  state: BudgetState;
  ok: boolean;
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

  const { batches } = schedulePlan(plan, { supportsParallel });
  const outcomes: StepOutcome[] = [];
  let state = initialBudgetState();
  let failures = 0;

  const emit = (type: Parameters<typeof createTelemetryEnvelope>[0], p: object, success = true) =>
    onTelemetry(
      createTelemetryEnvelope(
        type,
        {
          taskId: plan.taskId,
          executionId: plan.planId,
          agentAdapter: adapter.id,
          model: plan.model,
          ...p,
        },
        success,
      ),
    );

  emit("execution.started", { phase: "dispatch" });

  for (const batch of batches) {
    if (failures > maxFailures) break;
    emit("parallel.batch.started", { agentRole: batch.map((s) => s.role).join("+") });

    const batchOutcomes = await Promise.all(
      batch.map(async (step) => {
        const budgetCheck = checkBudget(plan.budget, state, {});
        if (!budgetCheck.ok) {
          return {
            stepId: step.id,
            role: step.role,
            success: false,
            errorCode: budgetCheck.reason,
          } satisfies StepOutcome;
        }
        emit("agent.dispatched", { agentRole: step.role });
        const outcome = await exec(adapter, step, plan);
        state = consumeBudget(state, outcome);
        emit(
          outcome.success ? "agent.completed" : "agent.failed",
          {
            agentRole: step.role,
            durationMs: outcome.durationMs,
            inputTokens: outcome.inputTokens,
            outputTokens: outcome.outputTokens,
            toolCalls: outcome.toolCalls,
          },
          outcome.success,
        );
        if (!outcome.success) failures += 1;
        return outcome;
      }),
    );

    outcomes.push(...batchOutcomes);
    emit("parallel.batch.completed", {});
  }

  emit(failures > 0 ? "execution.failed" : "execution.completed", {}, failures === 0);
  return { outcomes, state, ok: failures === 0 };
}
