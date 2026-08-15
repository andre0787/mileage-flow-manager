/**
 * context.ts — ExecutionContext (P12.5-01/02).
 *
 * Todo acesso (humano real, demo anônimo, Playwright, QA Agent) é resolvido
 * para um ExecutionContext imutável que define tenant, ator, modo de auth,
 * permissões e políticas. O isolamento demo/e2e/real é garantido pelo
 * tenantId + authMode — nunca por checagens de UI.
 *
 * As factories (realContext/demoContext/e2eAgentContext) vivem em
 * context-factories.ts (rule-41 — hard limit de 150 linhas por arquivo).
 */

export type ActorType = "human" | "synthetic" | "agent";

export type AuthMode = "authenticated" | "anonymous-demo" | "e2e-agent";

export interface PermissionSet {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  reset: boolean;
  export: boolean;
  admin: boolean;
  /** Permitido apenas no workflow controlado do Fix Agent (Level ≤ 3). */
  editCode: boolean;
}

export interface DataPolicy {
  /** Pode acessar o banco real? (demo: false — usa fixtures) */
  canAccessProductionData: boolean;
  /** Pode persistir fora do contexto? */
  canPersistOutsideContext: boolean;
  /** Artefatos têm retention (dias). */
  artifactRetentionDays: number;
  /** Redação de secrets obrigatória. */
  redactSecrets: boolean;
}

export interface ExecutionPolicy {
  /** Max tokens por execução AI. */
  maxTokens: number;
  /** Max duração (ms). */
  maxDurationMs: number;
  /** Max tool calls por execução. */
  maxToolCalls: number;
  /** Max runs de workflow por hora. */
  maxWorkflowRunsPerHour: number;
  /** Max execuções AI por hora. */
  maxAiExecutionsPerHour: number;
  /** Max execuções concorrentes. */
  maxConcurrentExecutions: number;
  /** Max payload size (bytes). */
  maxPayloadSizeBytes: number;
  /** Sessão demo: TTL (ms). */
  sessionTtlMs: number;
  /** Sessão demo: idle timeout (ms). */
  idleTimeoutMs: number;
  /** Sessão demo: máximo lifetime (ms). */
  maxLifetimeMs: number;
  /** Rate limit: max requests por minuto (por IP/session). */
  maxRequestsPerMinute: number;
}

export interface ExecutionContext {
  tenantId: string;
  actorId: string;
  actorType: ActorType;
  authMode: AuthMode;
  permissions: PermissionSet;
  dataPolicy: DataPolicy;
  executionPolicy: ExecutionPolicy;
}

/** Tenants reservados do sistema. */
export const TENANTS = {
  demo: "__demo__",
  e2e: "__e2e__",
} as const;

/** Atores reservados. */
export const ACTORS = {
  publicDemo: "__public_demo__",
  playwright: "__playwright__",
  qaAgent: "__qa_agent__",
} as const;

/** Idempotência: nunca transformar anônimo em autenticado (princípio 1). */
export function isAnonymous(ctx: ExecutionContext): boolean {
  return ctx.authMode === "anonymous-demo" || ctx.authMode === "e2e-agent";
}
