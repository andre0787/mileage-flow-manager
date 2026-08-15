/**
 * explainability.ts — Explainability (P11-05 Adaptive Orchestration).
 *
 * Para cada decisão de workflow, registra o porquê: why_run, why_skip,
 * why_parallel, why_serial, why_retry, why_escalate. Usado pela
 * Workflow Observability UI (P11-09) para responder "Why did this
 * agent run?" — e para o Adaptive Learning (spec §13).
 */

export type WhyType =
  "why_run" | "why_skip" | "why_parallel" | "why_serial" | "why_retry" | "why_escalate";

export interface WhyEntry {
  why: WhyType;
  role?: string;
  stepId?: string;
  reason: string;
  /** Metadados de apoio (ex.: overhead, custo, falha). */
  data?: Record<string, unknown>;
  timestamp: string;
}

/** Coletor de decisões explicáveis — append-only, imutável externamente. */
export class ExplainabilityLog {
  private entries: WhyEntry[] = [];

  get all(): ReadonlyArray<WhyEntry> {
    return this.entries;
  }

  get size(): number {
    return this.entries.length;
  }

  record(why: WhyType, reason: string, data?: WhyEntry["data"]): void {
    this.entries.push({
      why,
      reason,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  whyRun(role: string, reason: string, data?: WhyEntry["data"]): void {
    this.record("why_run", reason, { ...data, role });
  }

  whySkip(role: string, reason: string, data?: WhyEntry["data"]): void {
    this.record("why_skip", reason, { ...data, role });
  }

  whyParallel(roles: string[], reason: string): void {
    this.record("why_parallel", reason, { roles });
  }

  whySerial(roles: string[], reason: string): void {
    this.record("why_serial", reason, { roles });
  }

  whyRetry(role: string, errorCode: string | null | undefined, attempt: number): void {
    this.record(
      "why_retry",
      `falha transitória (${errorCode}) recuperada na tentativa ${attempt}`,
      {
        role,
        errorCode,
        attempt,
      },
    );
  }

  whyEscalate(role: string, fromModel: string, toModel: string, reason: string): void {
    this.record("why_escalate", reason, { role, fromModel, toModel });
  }

  /** Filtra por tipo (ex.: todos os why_skip). */
  byType(why: WhyType): WhyEntry[] {
    return this.entries.filter((e) => e.why === why);
  }
}
