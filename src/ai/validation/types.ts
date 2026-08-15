/**
 * types.ts — P12 Real-World Validation (spec P12 §2, §11).
 *
 * Tipos centrais: `RealTask` (dataset P12-01) e `ValidationRun` (registro de
 * execução com todas as métricas §11). O `ValidationRun` é o registro
 * persistível que alimenta as análises P12-05..08 e os relatórios P12-09/10.
 */

export type ValidationTaskClass = "tiny" | "small" | "medium" | "large" | "architectural";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type ValidationStrategy = "single" | "multi" | "graph+multi";
export type RunStatus = "success" | "failure" | "blocked" | "cancelled";

export interface RealTask {
  taskId: string;
  description: string;
  class: ValidationTaskClass;
  risk: RiskLevel;
  expectedFiles: string[];
  expectedModules: string[];
  domainRisk: RiskLevel;
  graphRisk: RiskLevel;
  testRisk: RiskLevel;
  apiRisk: RiskLevel;
  schemaRisk: RiskLevel;
  acceptanceCriteria: string[];
}

/** Métricas mínimas §11 — toda execução real deve permitir medir. */
export interface RunMetrics {
  taskId: string;
  strategy: ValidationStrategy;
  agent: string;
  model: string;
  role: string;
  status: RunStatus;
  quality: number; // 0..10
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  toolCalls: number;
  retryCount: number;
  rework: number; // 0..1
  graphUsed: boolean;
  graphLatencyMs: number;
  contextSize: number;
  contextFreshness: number; // 0..1
  budgetUsage: number; // 0..1
  validation: boolean;
  testPassRate: number; // 0..1
  failureRate: number; // 0..1
  agentCount: number;
  orchestrationOverhead: number; // 0..1 — §7
  planningTimeMs: number;
  executionTimeMs: number;
  validationTimeMs: number;
  repository: {
    commitSha: string;
    branch: string;
    workingTreeClean: boolean;
    beforeSha: string;
    afterSha: string;
  };
  repeats: number;
  meanDurationMs: number;
  medianDurationMs: number;
  varianceDurationMs: number;
  sampleCount: number;
  confidence: number; // 0..1 — baseado no sample
}

export interface ValidationConfig {
  /** Repetição mínima para tasks importantes (spec §16). */
  repeatImportant: number;
  /** Modelo padrão mantido fixo entre estratégias (spec §14). */
  model: string;
  /** Triggers de investigação (spec P12-05). */
  triggers: {
    failureRate: number;
    reworkRate: number;
    telemetryCompleteness: number;
    budgetViolation: number;
    timeoutRate: number;
    contextStaleRate: number;
  };
}
