/**
 * access-gate.ts — Anonymous Demo Access Gate (P12.5-02).
 *
 * Fluxo: anonymous request → Demo Access Gate → Demo Execution Context →
 * Demo Tenant → Application.
 *
 * Nunca: anonymous → authenticated real user. O gate resolve um request
 * anônimo para o ExecutionContext do demo OU rejeita, controlado por
 * env/feature flag/route policy/rate limit/session/tenant.
 */

import type { ExecutionContext } from "./context";
import { demoContext } from "./context-factories";

export type GateDecision =
  { allowed: true; context: ExecutionContext } | { allowed: false; reason: string };

export interface AccessGateConfig {
  /** PUBLIC_DEMO_ENABLED — desligamento imediato. */
  enabled: boolean;
  /** Rate limit: max requests/min por session. */
  maxRequestsPerMinute: number;
  /** Rate limit: max requests/min por IP. */
  maxRequestsPerMinutePerIp: number;
  /** Janela de rate limit (ms). */
  windowMs: number;
  /** Máximo de sessions demo ativas. */
  maxActiveSessions: number;
}

export const DEFAULT_GATE_CONFIG: AccessGateConfig = {
  enabled: false,
  maxRequestsPerMinute: 30,
  maxRequestsPerMinutePerIp: 60,
  windowMs: 60_000,
  maxActiveSessions: 200,
};

export interface SessionRecord {
  sessionId: string;
  startedAt: number;
  lastActivityAt: number;
  requestTimestamps: number[];
}

export class DemoAccessGate {
  private sessions = new Map<string, SessionRecord>();
  private ipRequests = new Map<string, number[]>();

  constructor(private config: AccessGateConfig = DEFAULT_GATE_CONFIG) {}

  /** Permite/nega acesso anônimo ao demo. */
  decide(sessionId: string, ip?: string): GateDecision {
    if (!this.config.enabled) {
      return { allowed: false, reason: "demo disabled (PUBLIC_DEMO_ENABLED=false)" };
    }
    const now = Date.now();
    this.prune(now);

    if (this.sessions.size >= this.config.maxActiveSessions) {
      return { allowed: false, reason: "demo session limit reached" };
    }

    const rec = this.sessions.get(sessionId) ?? {
      sessionId,
      startedAt: now,
      lastActivityAt: now,
      requestTimestamps: [],
    };

    // Rate limit por session (janela deslizante)
    const windowStart = now - this.config.windowMs;
    rec.requestTimestamps = rec.requestTimestamps.filter((t) => t > windowStart);
    if (rec.requestTimestamps.length >= this.config.maxRequestsPerMinute) {
      return { allowed: false, reason: "demo rate limit exceeded (session)" };
    }

    // Rate limit por IP
    if (ip) {
      const ipList = (this.ipRequests.get(ip) ?? []).filter((t) => t > windowStart);
      if (ipList.length >= this.config.maxRequestsPerMinutePerIp) {
        return { allowed: false, reason: "demo rate limit exceeded (ip)" };
      }
      ipList.push(now);
      this.ipRequests.set(ip, ipList);
    }

    rec.requestTimestamps.push(now);
    rec.lastActivityAt = now;
    this.sessions.set(sessionId, rec);
    return { allowed: true, context: demoContext() };
  }

  /** Registra atividade (para idle timeout). */
  touch(sessionId: string): void {
    const rec = this.sessions.get(sessionId);
    if (rec) rec.lastActivityAt = Date.now();
  }

  /** Termina sessão demo (reset). */
  end(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /** Limpa sessões expiradas (TTL). */
  private prune(now: number): void {
    for (const [id, rec] of this.sessions) {
      if (
        now - rec.startedAt > this.config.windowMs * 60 ||
        now - rec.lastActivityAt > this.config.windowMs * 15
      ) {
        this.sessions.delete(id);
      }
    }
  }

  get activeSessions(): number {
    return this.sessions.size;
  }
}
