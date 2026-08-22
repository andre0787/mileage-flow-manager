export type MutationStatus = "detected" | "missed" | "fixed" | "regression" | "skipped";

export interface AgentLabMutationResult {
  id: string;
  category: string;
  severity: string;
  status: MutationStatus;
  confidence?: number;
  detectionMode?: string;
  triage?: string;
  rootCause?: string;
  evidenceId?: string;
  duration?: number;
  matchCount?: number;
}

export interface AgentLabExperiment {
  experimentId: string;
  timestamp: string;
  mode: string;
  mutationsTotal: number;
  resolvable: number;
  detected: number;
  missed: number;
  skipped: number;
  recall: number;
  precision: number;
  fpr: number;
  fnr: number;
  detectionMode?: string;
  validationNote?: string;
  results: AgentLabMutationResult[];
}

const experimentModules = import.meta.glob<AgentLabExperiment>(
  "../../docs/tracking/p12.6-experiment-*.json",
  { eager: true, import: "default" },
);

export function getExperiments(): AgentLabExperiment[] {
  return Object.values(experimentModules).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export function getLatestExperiment(): AgentLabExperiment | null {
  return getExperiments()[0] ?? null;
}

export function getReadinessGrade(experiment: AgentLabExperiment | null) {
  if (!experiment) return { grade: "—", status: "NO DATA", score: 0 };
  const regressionScore = 100 - experiment.fnr;
  const score = Math.round((experiment.recall + experiment.precision + regressionScore) / 3);
  if (score >= 95) return { grade: "A", status: "PRODUCTION READY", score };
  if (score >= 85) return { grade: "B", status: "CONDITIONAL", score };
  if (score >= 70) return { grade: "C", status: "NEEDS IMPROVEMENT", score };
  if (score >= 50) return { grade: "D", status: "NOT READY", score };
  return { grade: "F", status: "BLOCKED", score };
}

export function formatExperimentDate(value?: string) {
  if (!value) return "Nunca";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
