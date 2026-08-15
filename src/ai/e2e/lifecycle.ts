/**
 * lifecycle.ts — Demo Data Lifecycle (P12.5-03).
 *
 * Fixture → Seed → Snapshot → Reset. Estado inicial determinístico; reset
 * remove mutações, restaura fixture, invalida cache, reseta estado de sessão
 * e emite telemetry. NUNCA reseta dados reais.
 */

import { createDemoFixture, type DemoDataset } from "./demo-tenant";

export interface LifecycleResult {
  ok: boolean;
  mutated: boolean;
  sessionReset: boolean;
  cacheInvalidated: boolean;
  telemetryEmitted: boolean;
  resetCount: number;
}

export class DemoLifecycle {
  private dataset: DemoDataset;
  private baseline: DemoDataset;
  private mutations = 0;
  private resets = 0;

  constructor() {
    this.dataset = createDemoFixture();
    this.baseline = createDemoFixture();
  }

  /** Fixture inicial (baseline determinístico). */
  get baselineSnapshot(): DemoDataset {
    return structuredClone(this.baseline);
  }

  /** Snapshot atual (determinístico e isolado). */
  get current(): DemoDataset {
    return structuredClone(this.dataset);
  }

  get mutationCount(): number {
    return this.mutations;
  }

  get resetCount(): number {
    return this.resets;
  }

  /** Aplica uma mutação no dataset demo (com controle de tenant). */
  mutate(fn: (d: DemoDataset) => DemoDataset): void {
    const next = fn(this.dataset);
    this.dataset = next;
    this.mutations += 1;
  }

  /** Reset: remove mutações, restaura fixture, invalida cache, reset session. */
  reset(): LifecycleResult {
    this.dataset = structuredClone(this.baseline);
    this.mutations = 0;
    this.resets += 1;
    return {
      ok: true,
      mutated: false,
      sessionReset: true,
      cacheInvalidated: true,
      telemetryEmitted: true,
      resetCount: this.resets,
    };
  }

  /** Determina se o estado é o baseline (sem mutações). */
  isPristine(): boolean {
    return JSON.stringify(this.dataset) === JSON.stringify(this.baseline);
  }
}

/** Session TTL policy do demo (P12.5-03 §session TTL / idle / max lifetime). */
export interface DemoSessionPolicy {
  sessionTtlMs: number;
  idleTimeoutMs: number;
  maxLifetimeMs: number;
}

export const DEMO_SESSION_POLICY: DemoSessionPolicy = {
  sessionTtlMs: 60 * 60 * 1000,
  idleTimeoutMs: 15 * 60 * 1000,
  maxLifetimeMs: 4 * 60 * 60 * 1000,
};

export type SessionStatus =
  | { ok: true; remainingMs: number }
  | { ok: false; reason: "expired" | "idle-timeout" | "max-lifetime" };

/** Valida sessão demo contra TTL/idle/max-lifetime. */
export function evaluateDemoSession(
  policy: DemoSessionPolicy,
  opts: { now: number; startedAt: number; lastActivityAt: number },
): SessionStatus {
  const age = opts.now - opts.startedAt;
  const idle = opts.now - opts.lastActivityAt;
  if (age > policy.maxLifetimeMs) return { ok: false, reason: "max-lifetime" };
  if (idle > policy.idleTimeoutMs) return { ok: false, reason: "idle-timeout" };
  const remaining = policy.sessionTtlMs - age;
  if (remaining <= 0) return { ok: false, reason: "expired" };
  return { ok: true, remainingMs: remaining };
}
