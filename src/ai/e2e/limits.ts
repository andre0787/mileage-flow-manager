/**
 * limits.ts — Demo Security / Limits (P12.5-04).
 *
 * Rate limits por IP/session/tenant/workflow/AI execution + budgets próprios
 * (tokens, duration, tool calls, concurrent workflows, runs). Todo consumo do
 * demo é checado contra estes limites ANTES de executar.
 */

export interface RateLimits {
  maxRequestsPerMinute: number;
  maxWorkflowRunsPerHour: number;
  maxAiExecutionsPerHour: number;
  maxConcurrentExecutions: number;
  maxPayloadSizeBytes: number;
  maxSessionDurationMs: number;
}

export const DEMO_RATE_LIMITS: RateLimits = {
  maxRequestsPerMinute: 30,
  maxWorkflowRunsPerHour: 10,
  maxAiExecutionsPerHour: 20,
  maxConcurrentExecutions: 1,
  maxPayloadSizeBytes: 1 * 1024 * 1024,
  maxSessionDurationMs: 4 * 60 * 60 * 1000,
};

export interface AiBudget {
  maxTokens: number;
  maxDurationMs: number;
  maxToolCalls: number;
  maxConcurrentWorkflows: number;
  maxRuns: number;
}

export const DEMO_AI_BUDGET: AiBudget = {
  maxTokens: 20_000,
  maxDurationMs: 30_000,
  maxToolCalls: 10,
  maxConcurrentWorkflows: 1,
  maxRuns: 50,
};

export interface ConsumptionState {
  requestsThisMinute: number;
  workflowRunsThisHour: number;
  aiExecutionsThisHour: number;
  activeExecutions: number;
  tokensUsed: number;
  toolCallsUsed: number;
  activeWorkflows: number;
  runsUsed: number;
  sessionStartedAt: number;
}

export type LimitVerdict =
  | { allowed: true }
  | { allowed: false; violated: keyof RateLimits | keyof AiBudget | "session"; message: string };

export class DemoLimiter {
  constructor(
    private limits: RateLimits = DEMO_RATE_LIMITS,
    private budget: AiBudget = DEMO_AI_BUDGET,
  ) {}

  /** Checa todos os limites antes de um request/execução. */
  check(state: ConsumptionState, now: number, payloadSizeBytes: number): LimitVerdict {
    if (state.requestsThisMinute >= this.limits.maxRequestsPerMinute) {
      return this.deny("maxRequestsPerMinute", "requests/min limit reached");
    }
    if (state.workflowRunsThisHour >= this.limits.maxWorkflowRunsPerHour) {
      return this.deny("maxWorkflowRunsPerHour", "workflow runs/hour limit reached");
    }
    if (state.aiExecutionsThisHour >= this.limits.maxAiExecutionsPerHour) {
      return this.deny("maxAiExecutionsPerHour", "AI executions/hour limit reached");
    }
    if (state.activeExecutions >= this.limits.maxConcurrentExecutions) {
      return this.deny("maxConcurrentExecutions", "concurrent executions limit reached");
    }
    if (payloadSizeBytes > this.limits.maxPayloadSizeBytes) {
      return this.deny("maxPayloadSizeBytes", "payload size limit reached");
    }
    if (now - state.sessionStartedAt > this.limits.maxSessionDurationMs) {
      return { allowed: false, violated: "session", message: "session duration limit reached" };
    }
    if (state.tokensUsed >= this.budget.maxTokens) {
      return this.deny("maxTokens", "token budget exhausted");
    }
    if (state.toolCallsUsed >= this.budget.maxToolCalls) {
      return this.deny("maxToolCalls", "tool call budget exhausted");
    }
    if (state.activeWorkflows >= this.budget.maxConcurrentWorkflows) {
      return this.deny("maxConcurrentWorkflows", "concurrent workflows limit reached");
    }
    if (state.runsUsed >= this.budget.maxRuns) {
      return this.deny("maxRuns", "run budget exhausted");
    }
    return { allowed: true };
  }

  private deny(violated: keyof RateLimits | keyof AiBudget, message: string): LimitVerdict {
    return { allowed: false, violated, message };
  }
}
