/**
 * agent-contract.ts — Agent Adapter Contract (SDD v5.0, seções 8-9).
 *
 * O core NÃO conhece "Pi", "Codex" ou "Claude" — conhece este contrato.
 * Um adapter concreto (adapters/pi, adapters/codex...) implementa a
 * interface. Este arquivo é o único ponto de acoplamento do core com
 * qualquer agente.
 */

/** Capacidades declaradas de um agente (ex.: Pi, generic-cli). */
export interface AgentCapabilities {
  toolCalling: boolean;
  parallelAgents: boolean;
  streaming: boolean;
  sessionPersistence: boolean;
  structuredOutput: boolean;
  subagents: boolean;
  worktrees: boolean;
  /** Papeis lógicos que o agente consegue desempenhar (SDD seção 13). */
  roles: string[];
}

/** Requisição de execução para um adapter. */
export interface AgentExecutionRequest {
  taskId: string;
  intent: string;
  contextPacket?: unknown;
  model?: string;
  budget?: { maxTokens?: number; maxCost?: number; maxDurationMs?: number };
}

/** Resultado da execução. */
export interface AgentExecutionResult {
  success: boolean;
  output?: string;
  errorCode?: string | null;
  durationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  toolCalls?: number;
}

/** Estado de saúde de um adapter (P11-01 — health check). */
export interface AgentHealth {
  ok: boolean;
  adapter: string;
  version: string;
  model?: string;
  latencyMs?: number;
  error?: string;
}

/** Contrato que todo adapter deve implementar (P11-01: health + version). */
export interface AgentAdapter {
  id: string;
  /** Versão do adapter (ex.: "pi-cli-1.0.0"). Nunca "unset" sem justificativa. */
  version(): string;
  capabilities(): AgentCapabilities;
  execute(request: AgentExecutionRequest): Promise<AgentExecutionResult>;
  /** Health check real (ex.: binário presente, versão resolvida). Fail-open. */
  health(): Promise<AgentHealth>;
  cancel?(executionId: string): Promise<void>;
}

/** Capabilities padrão de um agente sem capacidades declaradas (degradação). */
export function defaultCapabilities(roles: string[] = []): AgentCapabilities {
  return {
    toolCalling: false,
    parallelAgents: false,
    streaming: false,
    sessionPersistence: false,
    structuredOutput: false,
    subagents: false,
    worktrees: false,
    roles,
  };
}

/**
 * Decide se um agente atende a lista de capacidades requeridas.
 * Usado pelo router/orchestrator (P3 — capability-driven).
 */
export function satisfiesCapabilities(caps: AgentCapabilities, required: string[]): boolean {
  return required.every((cap) => caps[cap as keyof AgentCapabilities] === true);
}
