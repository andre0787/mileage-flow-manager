/**
 * context-factories.ts — Factories de ExecutionContext (P12.5-01/02).
 *
 * Extraído de context.ts (rule-41). Define as políticas de permissão por
 * papel e as factories: real (autenticado), demo (anônimo) e e2e (QA Agent).
 */

import { ACTORS, TENANTS, type ExecutionContext, type PermissionSet } from "./context";

/** Permissões restritas do demo — nunca admin/user mgmt/secrets/billing. */
export const DEMO_PERMISSIONS: PermissionSet = {
  read: true,
  create: true,
  update: true,
  delete: true,
  reset: true,
  export: false,
  admin: false,
  editCode: false,
};

/** Permissões do QA Agent — não edita código, não exporta. */
export const QA_AGENT_PERMISSIONS: PermissionSet = {
  read: true,
  create: false,
  update: false,
  delete: false,
  reset: false,
  export: false,
  admin: false,
  editCode: false,
};

/** Permissões do Fix Agent (workflow controlado, Level 3). */
export const FIX_AGENT_PERMISSIONS: PermissionSet = {
  read: true,
  create: true,
  update: true,
  delete: false,
  reset: false,
  export: false,
  admin: false,
  editCode: true,
};

/** Contexto do usuário real autenticado. */
export function realContext(userId: string, tenantId: string): ExecutionContext {
  return {
    tenantId,
    actorId: userId,
    actorType: "human",
    authMode: "authenticated",
    permissions: {
      read: true,
      create: true,
      update: true,
      delete: true,
      reset: false,
      export: true,
      admin: false,
      editCode: false,
    },
    dataPolicy: {
      canAccessProductionData: true,
      canPersistOutsideContext: false,
      artifactRetentionDays: 90,
      redactSecrets: true,
    },
    executionPolicy: {
      maxTokens: 100_000,
      maxDurationMs: 120_000,
      maxToolCalls: 40,
      maxWorkflowRunsPerHour: 60,
      maxAiExecutionsPerHour: 120,
      maxConcurrentExecutions: 4,
      maxPayloadSizeBytes: 5 * 1024 * 1024,
      sessionTtlMs: 7 * 24 * 60 * 60 * 1000,
      idleTimeoutMs: 30 * 60 * 1000,
      maxLifetimeMs: 14 * 24 * 60 * 60 * 1000,
      maxRequestsPerMinute: 300,
    },
  };
}

/** Contexto do demo anônimo (P12.5-02). */
export function demoContext(): ExecutionContext {
  return {
    tenantId: TENANTS.demo,
    actorId: ACTORS.publicDemo,
    actorType: "human",
    authMode: "anonymous-demo",
    permissions: DEMO_PERMISSIONS,
    dataPolicy: {
      canAccessProductionData: false,
      canPersistOutsideContext: false,
      artifactRetentionDays: 7,
      redactSecrets: true,
    },
    executionPolicy: {
      maxTokens: 20_000,
      maxDurationMs: 30_000,
      maxToolCalls: 10,
      maxWorkflowRunsPerHour: 10,
      maxAiExecutionsPerHour: 20,
      maxConcurrentExecutions: 1,
      maxPayloadSizeBytes: 1 * 1024 * 1024,
      sessionTtlMs: 60 * 60 * 1000,
      idleTimeoutMs: 15 * 60 * 1000,
      maxLifetimeMs: 4 * 60 * 60 * 1000,
      maxRequestsPerMinute: 30,
    },
  };
}

/** Contexto do QA Agent / Playwright (P12.5-08). */
export function e2eAgentContext(actorId: string = ACTORS.qaAgent): ExecutionContext {
  return {
    tenantId: TENANTS.e2e,
    actorId,
    actorType: "agent",
    authMode: "e2e-agent",
    permissions: QA_AGENT_PERMISSIONS,
    dataPolicy: {
      canAccessProductionData: false,
      canPersistOutsideContext: false,
      artifactRetentionDays: 14,
      redactSecrets: true,
    },
    executionPolicy: {
      maxTokens: 50_000,
      maxDurationMs: 90_000,
      maxToolCalls: 30,
      maxWorkflowRunsPerHour: 30,
      maxAiExecutionsPerHour: 60,
      maxConcurrentExecutions: 2,
      maxPayloadSizeBytes: 2 * 1024 * 1024,
      sessionTtlMs: 2 * 60 * 60 * 1000,
      idleTimeoutMs: 20 * 60 * 1000,
      maxLifetimeMs: 8 * 60 * 60 * 1000,
      maxRequestsPerMinute: 120,
    },
  };
}
