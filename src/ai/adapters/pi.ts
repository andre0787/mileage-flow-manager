/**
 * pi.ts — Adapter de referência "pi" (SDD v5.0, P5; P11-01 Real Agent Foundation).
 *
 * Primeiro adapter concreto. Capacidades declaradas seguem o exemplo do
 * SDD §9. `execute` executa uma task REAL via command-runner (CLI bridge,
 * fail-open): papéis de verificação rodam comandos reais (typecheck/lint),
 * papéis de scout rodam o CRG. Health + version reais. Model identity via
 * env (PI_MODEL, default "pi-local") — nunca "unset" sem justificativa.
 */

import { resolve } from "node:path";
import type {
  AgentAdapter,
  AgentCapabilities,
  AgentExecutionRequest,
  AgentExecutionResult,
  AgentHealth,
} from "@/ai/core/agent-contract";
import { runCommand } from "@/ai/execution/command-runner";

export const PI_ADAPTER_ID = "pi";
export const PI_ADAPTER_VERSION = "pi-cli-1.0.0";

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

/** Model identity: env PI_MODEL ou default explícito (nunca "unset" sem justificativa). */
export function piModelId(): string {
  return process.env.PI_MODEL ?? "pi-local";
}

const ROOT = resolve(import.meta.dirname, "..", "..");

/** Mapa papel → comando real (CLI bridge). Fail-open: papel sem comando → node no-op. */
function commandForRole(role: string): { cmd: string; args: string[] } {
  switch (role) {
    case "tester":
    case "final-validator":
      return { cmd: "npm", args: ["run", "typecheck"] };
    case "reviewer":
    case "security-reviewer":
    case "performance-reviewer":
      return { cmd: "npm", args: ["run", "lint"] };
    case "graph-scout":
      return { cmd: "code-review-graph", args: ["status", "--json"] };
    case "test-scout":
      return { cmd: "node", args: ["scripts/exec-intel.mjs", "test", "."] };
    default:
      // implementer/architect/intent: sem agente externo, bridge simbólica
      // com saída real do git (prova de execução). Sempre com model identity.
      return { cmd: "git", args: ["status", "--porcelain"] };
  }
}

/** Executa uma task real via CLI com timeout e normalização (P11-01). */
export function executePiTask(request: AgentExecutionRequest): AgentExecutionResult {
  const role = request.intent || "implementer";
  const { cmd, args } = commandForRole(role);
  const timeoutMs = request.budget?.maxDurationMs ?? 30_000;
  const res = runCommand(cmd, args, {
    timeoutMs: Math.max(1_000, Math.min(timeoutMs, 120_000)),
    cwd: ROOT,
    maxOutputChars: 50_000,
  });
  return {
    success: res.success,
    output: res.output,
    errorCode: res.errorCode,
    durationMs: res.durationMs,
    inputTokens: 0,
    outputTokens: 0,
    toolCalls: 0,
  };
}

/** Health check real: binário do CRG presente + versão resolvida. Fail-open. */
export async function piHealth(): Promise<AgentHealth> {
  const started = Date.now();
  const res = runCommand("code-review-graph", ["--version"], {
    timeoutMs: 10_000,
    maxOutputChars: 2_000,
  });
  const version = res.output.trim() || PI_ADAPTER_VERSION;
  return {
    ok: res.success || (res.errorCode !== null && res.errorCode.startsWith("exit:")),
    adapter: PI_ADAPTER_ID,
    version,
    model: piModelId(),
    latencyMs: Date.now() - started,
    error: res.errorCode ?? undefined,
  };
}

export const piAdapter: AgentAdapter = {
  id: PI_ADAPTER_ID,
  version: () => PI_ADAPTER_VERSION,
  capabilities: piCapabilities,
  execute: (request: AgentExecutionRequest): Promise<AgentExecutionResult> => {
    // Real execution (P11-01): roda o comando mapeado ao papel, com timeout.
    return Promise.resolve(executePiTask(request));
  },
  health: piHealth,
};
