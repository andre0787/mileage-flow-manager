/**
 * security-checks.ts — Asserções de segurança isoladas (P12.5-13).
 *
 * Extraído de security.ts (rule-41). Cada asserção verifica uma invariante
 * do threat model (T3-T19): isolamento de tenant, privilégio, RLS, limites,
 * secrets, sandbox.
 */

import type { ExecutionContext } from "./context";

/** Controles que o demo deve ter ativos para ser habilitado. */
export interface DemoEnablementRequisites {
  anonymousAccessIsolated: boolean;
  tenantIsolated: boolean;
  rlsEnforced: boolean;
  permissionsRestricted: boolean;
  rateLimitActive: boolean;
  aiBudgetActive: boolean;
  sessionTtlActive: boolean;
  secretsInaccessible: boolean;
  adminInaccessible: boolean;
}

export function canEnableDemo(req: DemoEnablementRequisites): boolean {
  return Object.values(req).every(Boolean);
}

/** T3: contexto não pode escapar para outro tenant. */
export function assertTenantIsolation(ctx: ExecutionContext, allowedTenantId: string): boolean {
  return ctx.tenantId === allowedTenantId;
}

/** T6: demo nunca admin. */
export function assertNoPrivilegeEscalation(ctx: ExecutionContext): boolean {
  return !ctx.permissions.admin && !ctx.permissions.editCode;
}

/** T5: RLS no backend (migrations com auth.uid()). */
export function hasRlsEnforcement(migrationsSql: string[]): boolean {
  return migrationsSql.some((sql) => sql.includes("CREATE POLICY") && sql.includes("auth.uid()"));
}

/** T7/T8/T9: limites ativos. */
export function assertLimitsActive(opts: {
  rateLimitActive: boolean;
  aiBudgetActive: boolean;
  workflowLimitActive: boolean;
}): boolean {
  return opts.rateLimitActive && opts.aiBudgetActive && opts.workflowLimitActive;
}

/** T19: QA não acessa secrets (por policy). */
export function assertQaCannotAccessSecrets(ctx: ExecutionContext): boolean {
  return ctx.actorId !== "__qa_agent__" || (ctx.dataPolicy.redactSecrets && !ctx.permissions.admin);
}

/** T12: QA não pode escapar do sandbox (validação de URL). */
export function assertQaSandboxed(url: string, allowedPrefix: string): boolean {
  return url.startsWith(allowedPrefix);
}

/** Isolamento Playwright (P12.5-13 §Playwright deve validar). */
export interface PlaywrightIsolationAssertions {
  anonymousCannotAccessPrivateTenant: boolean;
  demoCannotAccessAdmin: boolean;
  demoCannotAccessAnotherDemo: boolean;
  demoCannotAccessProductionUser: boolean;
  qaCannotAccessSecrets: boolean;
  qaCannotEscapeBrowserSandbox: boolean;
}

export function assertPlaywrightIsolation(a: PlaywrightIsolationAssertions): boolean {
  return Object.values(a).every(Boolean);
}
