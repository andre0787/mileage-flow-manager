/**
 * budget.ts — Execution Budget (SDD v5.0, §18).
 *
 * Guarda-costas do dispatcher: verifica limites acumulados antes de
 * despachar cada step. Ajustável por risk/task type/model/agent.
 */

import type { ExecutionBudget } from "@/ai/core/execution-plan";

export interface BudgetState {
  tokensUsed: number;
  costUsed: number;
  durationMsUsed: number;
  toolCallsUsed: number;
  agentsDispatched: number;
  parallelActive: number;
}

export function initialBudgetState(): BudgetState {
  return {
    tokensUsed: 0,
    costUsed: 0,
    durationMsUsed: 0,
    toolCallsUsed: 0,
    agentsDispatched: 0,
    parallelActive: 0,
  };
}

export interface BudgetCheck {
  ok: boolean;
  reason?: string;
}

/** Verifica se um dispatch pode prosseguir dentro do budget. */
export function checkBudget(
  budget: ExecutionBudget,
  state: BudgetState,
  next: { inputTokens?: number; cost?: number; durationMs?: number; toolCalls?: number },
): BudgetCheck {
  if (state.agentsDispatched + 1 > budget.maxAgents) {
    return { ok: false, reason: `maxAgents (${budget.maxAgents}) excedido` };
  }
  if (state.parallelActive + 1 > budget.maxParallel) {
    return { ok: false, reason: `maxParallel (${budget.maxParallel}) excedido` };
  }
  if (state.tokensUsed + (next.inputTokens ?? 0) > budget.maxTokens) {
    return { ok: false, reason: `maxTokens (${budget.maxTokens}) excedido` };
  }
  if (state.costUsed + (next.cost ?? 0) > budget.maxCost) {
    return { ok: false, reason: `maxCost (R$ ${budget.maxCost.toFixed(2)}) excedido` };
  }
  if (state.durationMsUsed + (next.durationMs ?? 0) > budget.maxDurationMs) {
    return { ok: false, reason: `maxDurationMs (${budget.maxDurationMs}) excedido` };
  }
  if (state.toolCallsUsed + (next.toolCalls ?? 0) > budget.maxToolCalls) {
    return { ok: false, reason: `maxToolCalls (${budget.maxToolCalls}) excedido` };
  }
  return { ok: true };
}

/** Acumula o resultado de um step no estado do budget. */
export function consumeBudget(
  state: BudgetState,
  result: { inputTokens?: number; cost?: number; durationMs?: number; toolCalls?: number },
): BudgetState {
  return {
    ...state,
    tokensUsed: state.tokensUsed + (result.inputTokens ?? 0),
    costUsed: state.costUsed + (result.cost ?? 0),
    durationMsUsed: state.durationMsUsed + (result.durationMs ?? 0),
    toolCallsUsed: state.toolCallsUsed + (result.toolCalls ?? 0),
    agentsDispatched: state.agentsDispatched + 1,
  };
}
