/**
 * security.ts — Security & Autonomy Certification (P12.5-13).
 *
 * Verifica as invariantes do threat model (T1-T23) com asserções executáveis.
 * As asserções isoladas vivem em security-checks.ts (rule-41).
 *
 * Demo só pode ser habilitado se TODOS os controles estiverem ativos.
 * Playwright valida isolamento (anon não acessa tenant privado, demo não
 * acessa admin/outro demo/usuário prod, QA não acessa secrets, etc.).
 */

import type { ExecutionContext } from "./context";
import { isAutonomyAllowed, MAX_AUTONOMY, type AutonomyLevel } from "./fix-workflow";
import { TENANTS } from "./context";
import { assertNoPrivilegeEscalation } from "./security-checks";

export interface SecurityCheck {
  id: string;
  name: string;
  passed: boolean;
  detail: string;
}

export interface SecurityCertification {
  allPassed: boolean;
  checks: SecurityCheck[];
  autonomyLevel: AutonomyLevel;
  autonomyCapped: boolean;
}

export {
  canEnableDemo,
  assertTenantIsolation,
  assertNoPrivilegeEscalation,
  hasRlsEnforcement,
  assertLimitsActive,
  assertQaCannotAccessSecrets,
  assertQaSandboxed,
  assertPlaywrightIsolation,
} from "./security-checks";
export type { DemoEnablementRequisites, PlaywrightIsolationAssertions } from "./security-checks";

export interface SecurityOptions {
  tenantEscape: boolean;
  idor: boolean;
  rlsBypass: boolean;
  privilegeEscalation: boolean;
  anonymousAbuse: boolean;
  rateLimit: boolean;
  sessionExpiry: boolean;
  csrf: boolean;
  xss: boolean;
  ssrf: boolean;
  promptInjection: boolean;
  aiBudgetExhaustion: boolean;
  secretExposure: boolean;
  fileUploadAbuse: boolean;
  exportAbuse: boolean;
}

/** Certificação completa de segurança + autonomia. */
export function certify(
  ctx: ExecutionContext,
  opts: SecurityOptions,
  autonomy: AutonomyLevel,
): SecurityCertification {
  const checks: SecurityCheck[] = [
    {
      id: "tenant-escape",
      name: "T3 tenant escape",
      passed: !opts.tenantEscape,
      detail: opts.tenantEscape ? "escape detected" : "isolated",
    },
    {
      id: "idor",
      name: "T4 IDOR",
      passed: !opts.idor,
      detail: opts.idor ? "IDOR detected" : "no IDOR",
    },
    {
      id: "rls-bypass",
      name: "T5 RLS bypass",
      passed: !opts.rlsBypass,
      detail: opts.rlsBypass ? "bypass detected" : "RLS enforced",
    },
    {
      id: "priv-esc",
      name: "T6 privilege escalation",
      passed: !opts.privilegeEscalation && assertNoPrivilegeEscalation(ctx),
      detail: "restricted",
    },
    {
      id: "anon-abuse",
      name: "T1 anonymous abuse",
      passed: !opts.anonymousAbuse,
      detail: opts.anonymousAbuse ? "abuse detected" : "limited",
    },
    { id: "rate-limit", name: "T7/T15 rate limit", passed: opts.rateLimit, detail: "active" },
    {
      id: "session-expiry",
      name: "T2 session expiry",
      passed: opts.sessionExpiry,
      detail: "TTL active",
    },
    { id: "csrf", name: "T16 CSRF", passed: !opts.csrf, detail: "no CSRF" },
    { id: "xss", name: "T17 XSS", passed: !opts.xss, detail: "no XSS" },
    { id: "ssrf", name: "T18 SSRF", passed: !opts.ssrf, detail: "no SSRF" },
    {
      id: "prompt-injection",
      name: "T10 prompt injection",
      passed: !opts.promptInjection,
      detail: "treated as data",
    },
    {
      id: "ai-budget",
      name: "T9 AI budget exhaustion",
      passed: !opts.aiBudgetExhaustion,
      detail: "budgets active",
    },
    {
      id: "secret-exposure",
      name: "T19 secret exposure",
      passed: !opts.secretExposure,
      detail: "redacted",
    },
    {
      id: "file-upload",
      name: "T13 file upload abuse",
      passed: !opts.fileUploadAbuse,
      detail: "restricted",
    },
    { id: "export-abuse", name: "T14 export abuse", passed: !opts.exportAbuse, detail: "blocked" },
    {
      id: "autonomy",
      name: "T22 autonomy capped",
      passed: isAutonomyAllowed(autonomy),
      detail: `level ${autonomy} ≤ ${MAX_AUTONOMY}`,
    },
  ];
  const allPassed = checks.every((c) => c.passed);
  return {
    allPassed,
    checks,
    autonomyLevel: autonomy,
    autonomyCapped: isAutonomyAllowed(autonomy),
  };
}

export { TENANTS };
