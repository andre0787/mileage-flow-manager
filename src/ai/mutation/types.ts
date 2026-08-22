/**
 * P12.6-01 — Mutation Framework Core Types
 *
 * Tipos fundamentais para defeitos controlados, determinísticos,
 * isolados, identificáveis, versionados e reversíveis.
 */

// ─── Categories ────────────────────────────────────────────────

export type MutationCategory =
  | "ui"
  | "api"
  | "data"
  | "validation"
  | "state"
  | "workflow"
  | "regression"
  | "performance"
  | "authorization";

// ─── Severity ──────────────────────────────────────────────────

export type MutationSeverity = "low" | "medium" | "high" | "critical";

// ─── Activation / Cleanup ──────────────────────────────────────

export type MutationActivation =
  | { type: "file_replace"; file: string; search: string; replace: string }
  | { type: "file_inject"; file: string; after: string; inject: string }
  | { type: "file_delete_lines"; file: string; startLine: number; endLine: number }
  | { type: "env_override"; key: string; value: string }
  | { type: "mock_return"; module: string; function: string; returnValue: unknown };

export type MutationCleanup =
  | { type: "git_checkout"; file: string }
  | { type: "restore_snapshot"; snapshotId: string }
  | { type: "env_restore"; key: string }
  | { type: "mock_restore"; module: string; function: string };

// ─── Mutation Case ─────────────────────────────────────────────

export interface MutationCase {
  id: string;
  category: MutationCategory;
  severity: MutationSeverity;
  target: string;
  description: string;
  expectedBehavior: string;
  mutatedBehavior: string;
  activation: MutationActivation;
  cleanup: MutationCleanup;
  tags?: string[];
  estimatedDetectionDifficulty?: "easy" | "medium" | "hard";
}

// ─── Mutation State ────────────────────────────────────────────

export type MutationState =
  | "registered"
  | "activating"
  | "active"
  | "detecting"
  | "detected"
  | "not_detected"
  | "fixing"
  | "fixed"
  | "regressing"
  | "cleaning"
  | "cleaned"
  | "aborted"
  | "error";

// ─── Mutation Run ──────────────────────────────────────────────

export interface MutationRun {
  id: string;
  mutationId: string;
  state: MutationState;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  detectionResult?: DetectionResult;
  fixResult?: FixResult;
  regressionResult?: RegressionResult;
  blastRadius?: BlastRadius;
  cost?: CostMetrics;
}

// ─── Detection ─────────────────────────────────────────────────

export interface DetectionFinding {
  id: string;
  mutationId: string;
  category: MutationCategory;
  severity: MutationSeverity;
  target: string;
  description: string;
  evidence: EvidencePack;
  confidence: number;
  detectedAt: string;
  detectionMode: "guided" | "exploratory" | "hybrid";
}

export interface DetectionResult {
  findings: DetectionFinding[];
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  trueNegatives: number;
  recall: number;
  precision: number;
  fpr: number;
  fnr: number;
}

// ─── Evidence ──────────────────────────────────────────────────

export interface EvidencePack {
  screenshot?: string;
  dom?: string;
  trace?: string;
  console?: string[];
  network?: NetworkEntry[];
  telemetry?: TelemetrySnapshot;
  steps?: string[];
  expectedBehavior?: string;
  actualBehavior?: string;
  commitSha?: string;
  scenarioId?: string;
}

export interface NetworkEntry {
  url: string;
  method: string;
  status: number;
  body?: string;
}

export interface TelemetrySnapshot {
  runId: string;
  planId?: string;
  steps: TelemetryStep[];
}

export interface TelemetryStep {
  stepId: string;
  agent: string;
  model?: string;
  role?: string;
  status: "success" | "failure" | "skipped";
  duration?: number;
  tokens?: number;
  cost?: number;
}

// ─── Triage ────────────────────────────────────────────────────

export type TriageClassification = "correct" | "partially_correct" | "incorrect" | "unknown";

export interface TriageResult {
  rootCauseHypothesis: string;
  classification: TriageClassification;
  severity: MutationSeverity;
  confidence: number;
  filesIdentified: string[];
}

// ─── Fix ───────────────────────────────────────────────────────

export interface FixResult {
  mutationRemoved: boolean;
  originalBehaviorRestored: boolean;
  existingTestsPass: boolean;
  e2ePasses: boolean;
  securityRegression: boolean;
  overallSuccess: boolean;
  filesChanged: string[];
  patch?: string;
}

// ─── Regression ────────────────────────────────────────────────

export interface RegressionResult {
  originalScenarioPass: boolean;
  relatedScenariosPass: boolean;
  fullRegressionPass: boolean;
  regressionRate: number;
  regressions: RegressionFinding[];
}

export interface RegressionFinding {
  scenarioId: string;
  description: string;
  relatedToMutation: boolean;
}

// ─── Blast Radius ──────────────────────────────────────────────

export interface BlastRadius {
  changedFiles: string[];
  changedLines: number;
  modulesTouched: string[];
  testsAdded: number;
  dependenciesChanged: string[];
  configChanged: boolean;
  expectedScope?: string;
  divergenceLevel: "minimal" | "moderate" | "large" | "excessive";
}

// ─── Cost Metrics ──────────────────────────────────────────────

export interface CostMetrics {
  tokens: number;
  cost: number;
  duration: number;
  agentCount: number;
  toolCalls: number;
  browserActions: number;
  retries: number;
  contextSize: number;
}

// ─── Graph Diagnosis ───────────────────────────────────────────

export type GraphBenefit = "graph_beneficial" | "graph_neutral" | "graph_harmful" | "graph_unnecessary";

export interface GraphDiagnosisResult {
  strategy: "evidence_llm" | "evidence_llm_graph";
  rootCauseAccuracy: number;
  timeToDiagnosis: number;
  tokens: number;
  cost: number;
  filesChanged: string[];
  fixSuccess: boolean;
  regression: boolean;
  confidence: number;
  benefit: GraphBenefit;
}
