/**
 * P12.6-12.5 — Context Mode + Caveman Evaluation
 *
 * Avaliar context-mode e caveman como camadas opcionais de infraestrutura
 * de agentes, não como dependências do produto.
 *
 * Experimento A/B para cada role relevante:
 *   A = baseline
 *   B = Context Mode
 *   C = Caveman
 *   D = Context Mode + Caveman
 */

// ─── Agent Runtime Abstraction ─────────────────────────────────

export type ContextStrategy = "baseline" | "context_mode";
export type OutputStrategy = "baseline" | "caveman";

export interface AgentRuntime {
  contextStrategy: ContextStrategy;
  outputStrategy: OutputStrategy;
  role: string;
}

export const RUNTIME_CONFIGS: AgentRuntime[] = [
  { contextStrategy: "baseline", outputStrategy: "baseline", role: "A" },
  { contextStrategy: "context_mode", outputStrategy: "baseline", role: "B" },
  { contextStrategy: "baseline", outputStrategy: "caveman", role: "C" },
  { contextStrategy: "context_mode", outputStrategy: "caveman", role: "D" },
];

// ─── Evaluation Metrics ────────────────────────────────────────

export interface ContextModeMetrics {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  latency: number;
  toolCalls: number;
  contextCompactions: number;
  contextSize: number;
  taskSuccess: boolean;
  detectionRecall: number;
  precision: number;
  evidenceQuality: number;
  reproducibility: number;
  triageAccuracy: number;
  fixSuccess: boolean;
  regressionRate: number;
}

// ─── Caveman-Safe Rules ────────────────────────────────────────

/**
 * Caveman pode comprimir narrativa/status intermediários, mas NÃO pode alterar:
 *   code, commands, paths, errors, structured JSON, telemetry IDs,
 *   evidence IDs, promotion data
 */
export interface CavemanConstraints {
  protectedFields: string[];
  compressionTargets: string[];
}

export const CAVEMAN_CONSTRAINTS: CavemanConstraints = {
  protectedFields: [
    "code",
    "commands",
    "paths",
    "errors",
    "structured JSON",
    "telemetry IDs",
    "evidence IDs",
    "promotion data",
  ],
  compressionTargets: [
    "narrative status",
    "intermediate reasoning",
    "exploration logs",
    "debug output",
  ],
};

/**
 * Context Mode pode reduzir contexto, mas NÃO pode remover evidência auditável:
 *   screenshots, traces, raw source, test logs, mutation metadata,
 *   telemetry, promotion evidence
 */
export interface ContextModeConstraints {
  protectedEvidence: string[];
  compressibleContent: string[];
}

export const CONTEXT_MODE_CONSTRAINTS: ContextModeConstraints = {
  protectedEvidence: [
    "screenshots",
    "traces",
    "raw source",
    "test logs",
    "mutation metadata",
    "telemetry",
    "promotion evidence",
  ],
  compressibleContent: [
    "Playwright snapshots",
    "test output",
    "logs",
    "large JSON",
    "API responses",
    "git diffs",
    "repository exploration",
    "promotion extraction",
    "telemetry analysis",
  ],
};

// ─── A/B Experiment ────────────────────────────────────────────

export interface ABExperimentConfig {
  role: string;
  task: string;
  model: string;
  temperature: number;
  budget: number;
  repository: string;
  mutationOrSource: string;
  browser: string;
}

export interface ABExperimentResult {
  config: ABExperimentConfig;
  runtime: AgentRuntime;
  metrics: ContextModeMetrics;
  timestamp: string;
}

export interface ABComparison {
  role: string;
  baseline: ABExperimentResult;
  contextMode?: ABExperimentResult;
  caveman?: ABExperimentResult;
  combined?: ABExperimentResult;
  analysis: ABAnalysis;
}

export interface ABAnalysis {
  contextModeBenefit: {
    tokenReduction: number;
    costReduction: number;
    qualityDelta: number;
    recommendation: "ADOPT" | "OPTIONAL" | "REJECT";
  };
  cavemanBenefit: {
    tokenReduction: number;
    costReduction: number;
    qualityDelta: number;
    recommendation: "ADOPT" | "OPTIONAL" | "REJECT";
  };
  combinedBenefit: {
    tokenReduction: number;
    costReduction: number;
    qualityDelta: number;
    recommendation: "ADOPT" | "OPTIONAL" | "REJECT";
  };
}

export function analyzeABResults(results: ABExperimentResult[]): ABComparison {
  const baseline = results.find((r) => r.runtime.role === "A");
  const contextMode = results.find((r) => r.runtime.role === "B");
  const caveman = results.find((r) => r.runtime.role === "C");
  const combined = results.find((r) => r.runtime.role === "D");

  if (!baseline) throw new Error("Baseline result required for A/B comparison");

  const tokenReduction = (baseline: ContextModeMetrics, variant: ContextModeMetrics) =>
    baseline.totalTokens > 0
      ? (baseline.totalTokens - variant.totalTokens) / baseline.totalTokens
      : 0;

  const costReduction = (baseline: ContextModeMetrics, variant: ContextModeMetrics) =>
    baseline.cost > 0 ? (baseline.cost - variant.cost) / baseline.cost : 0;

  const qualityDelta = (baseline: ContextModeMetrics, variant: ContextModeMetrics) =>
    variant.evidenceQuality - baseline.evidenceQuality;

  function classifyRecommendation(
    tokenRed: number,
    costRed: number,
    qualDelta: number,
  ): "ADOPT" | "OPTIONAL" | "REJECT" {
    if (qualDelta < -0.05) return "REJECT"; // quality degradation
    if (costRed > 0.2 && qualDelta >= -0.02) return "ADOPT";
    if (costRed > 0.1 && qualDelta >= 0) return "OPTIONAL";
    return "REJECT";
  }

  const contextModeMetrics = contextMode?.metrics;
  const cavemanMetrics = caveman?.metrics;
  const combinedMetrics = combined?.metrics;

  return {
    role: baseline.config.task,
    baseline,
    contextMode,
    caveman,
    combined,
    analysis: {
      contextModeBenefit: contextModeMetrics
        ? {
            tokenReduction: tokenReduction(baseline.metrics, contextModeMetrics),
            costReduction: costReduction(baseline.metrics, contextModeMetrics),
            qualityDelta: qualityDelta(baseline.metrics, contextModeMetrics),
            recommendation: classifyRecommendation(
              tokenReduction(baseline.metrics, contextModeMetrics),
              costReduction(baseline.metrics, contextModeMetrics),
              qualityDelta(baseline.metrics, contextModeMetrics),
            ),
          }
        : { tokenReduction: 0, costReduction: 0, qualityDelta: 0, recommendation: "REJECT" as const },
      cavemanBenefit: cavemanMetrics
        ? {
            tokenReduction: tokenReduction(baseline.metrics, cavemanMetrics),
            costReduction: costReduction(baseline.metrics, cavemanMetrics),
            qualityDelta: qualityDelta(baseline.metrics, cavemanMetrics),
            recommendation: classifyRecommendation(
              tokenReduction(baseline.metrics, cavemanMetrics),
              costReduction(baseline.metrics, cavemanMetrics),
              qualityDelta(baseline.metrics, cavemanMetrics),
            ),
          }
        : { tokenReduction: 0, costReduction: 0, qualityDelta: 0, recommendation: "REJECT" as const },
      combinedBenefit: combinedMetrics
        ? {
            tokenReduction: tokenReduction(baseline.metrics, combinedMetrics),
            costReduction: costReduction(baseline.metrics, combinedMetrics),
            qualityDelta: qualityDelta(baseline.metrics, combinedMetrics),
            recommendation: classifyRecommendation(
              tokenReduction(baseline.metrics, combinedMetrics),
              costReduction(baseline.metrics, combinedMetrics),
              qualityDelta(baseline.metrics, combinedMetrics),
            ),
          }
        : { tokenReduction: 0, costReduction: 0, qualityDelta: 0, recommendation: "REJECT" as const },
    },
  };
}

// ─── Roles to Evaluate ─────────────────────────────────────────

export const CAVEMAN_CANDIDATE_ROLES = [
  "investigator",
  "scout",
  "triage",
  "reviewer",
  "promotion-scout",
  "promotion-deduplicator",
];

export const CAVEMAN_EXCLUDED_ROLES = [
  "main-solver",
  "final-reviewer",
  "user-facing-report-generator",
];

// ─── Quality Gate ──────────────────────────────────────────────

export function validateContextModeQuality(
  baseline: ContextModeMetrics,
  variant: ContextModeMetrics,
): { passed: boolean; violations: string[] } {
  const violations: string[] = [];

  // Factual/structured data must never be degraded
  if (variant.evidenceQuality < baseline.evidenceQuality - 0.01) {
    violations.push("Evidence quality degraded");
  }
  if (variant.reproducibility < baseline.reproducibility - 0.01) {
    violations.push("Reproducibility degraded");
  }
  if (variant.triageAccuracy < baseline.triageAccuracy - 0.01) {
    violations.push("Triage accuracy degraded");
  }
  if (variant.detectionRecall < baseline.detectionRecall - 0.01) {
    violations.push("Detection recall degraded");
  }
  if (variant.precision < baseline.precision - 0.01) {
    violations.push("Precision degraded");
  }

  return { passed: violations.length === 0, violations };
}
