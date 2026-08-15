/**
 * pi.ts — Adapter de referência "pi" (SDD v5.0, P5).
 *
 * Primeiro adapter concreto. Capacidades declaradas seguem o exemplo do
 * SDD §9. `execute` é a fronteira: no futuro chama o agente real; hoje
 * implementa uma execução segura baseada no CLI (fail-open).
 */

import { spawnSync } from "node:child_process";
import type {
  AgentAdapter,
  AgentCapabilities,
  AgentExecutionRequest,
  AgentExecutionResult,
} from "@/ai/core/agent-contract";

export const PI_ADAPTER_ID = "pi";

export function piCapabilities(): AgentCapabilities {
  return {
    toolCalling: true,
    parallelAgents: true,
    streaming: true,
    sessionPersistence: true,
    structuredOutput: true,
    subagents: true,
    worktrees: true,
    roles: [
      "intent",
      "graph-scout",
      "domain-scout",
      "test-scout",
      "history-scout",
      "architect",
      "implementer",
      "tester",
      "security-reviewer",
      "performance-reviewer",
      "reviewer",
      "final-validator",
    ],
  };
}

/** Executa um comando via CLI com timeout e fail-open (nunca lança). */
export function executeCli(cmd: string, args: string[]): AgentExecutionResult {
  try {
    const res = spawnSync(cmd, args, { encoding: "utf8", timeout: 30_000 });
    return {
      success: res.error ? false : res.status === 0,
      output: res.stdout ?? "",
      errorCode: res.error ? res.error.message : res.status !== 0 ? `exit:${res.status}` : null,
      durationMs: 0,
    };
  } catch (err) {
    return {
      success: false,
      errorCode: err instanceof Error ? err.message : String(err),
    };
  }
}

export const piAdapter: AgentAdapter = {
  id: PI_ADAPTER_ID,
  capabilities: piCapabilities,
  execute: (request: AgentExecutionRequest): Promise<AgentExecutionResult> => {
    // Implementação de referência: resolve via CLI (fail-open).
    // request.contextPacket pode conter affectedFiles — sem contrato com SDK.
    const result = executeCli("code-review-graph", ["status", "--json"]);
    return Promise.resolve({
      ...result,
      durationMs: 0,
      inputTokens: 0,
      outputTokens: 0,
      toolCalls: 0,
    });
  },
};
