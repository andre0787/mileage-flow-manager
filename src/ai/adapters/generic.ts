/**
 * generic.ts — Adapter "generic-cli" (SDD v5.0, §9).
 *
 * Exemplo de degradação máxima: capacidades todas false. O workflow
 * deve se adaptar (SDD §14) — sem subagentes → sequencial; sem
 * structured output → parser; sem tool calling → CLI bridge.
 */

import type {
  AgentAdapter,
  AgentCapabilities,
  AgentExecutionRequest,
  AgentExecutionResult,
} from "@/ai/core/agent-contract";

export const GENERIC_ADAPTER_ID = "generic-cli";

export function genericCapabilities(): AgentCapabilities {
  return {
    toolCalling: true,
    parallelAgents: false,
    streaming: false,
    sessionPersistence: false,
    structuredOutput: false,
    subagents: false,
    worktrees: false,
    roles: ["implementer", "tester"],
  };
}

export const genericAdapter: AgentAdapter = {
  id: GENERIC_ADAPTER_ID,
  capabilities: genericCapabilities,
  execute: async (_request: AgentExecutionRequest): Promise<AgentExecutionResult> => {
    // Sem agente concreto — bridge CLI simbólico (fail-open).
    return { success: true, output: "", errorCode: null };
  },
};
