/** Tipos dos dados de telemetria das abas KPI e Workflow (npm run data:refresh). */

export interface RouterMonthlyKPI {
  resolved: number;
  completed: number;
  failed: number;
  unobserved: number;
  fallbackUsed: number;
  completionRate: number | null;
  fallbackRate: number | null;
  models: string[];
  skillsByModel: Array<{ skill: string; model: string }>;
}

export interface MonthlyKPI {
  [key: string]: unknown;
  month: string;
  prePrPassRate: number;
  prePrTotal: number;
  prePrPass: number;
  prePrFail: number;
  testCoverageLibs: number | null;
  testCoverageComponents: number | null;
  gateActivations: { intent: number; twins: number; auth: number };
  avgOutcomeGrade: number | null;
  topViolations: Array<{ rule: string; count: number }>;
  healedByRule: Record<string, number>;
  gateBlockedByRule: Record<string, number>;
  avgCycleTimeHours: number | null;
  branchesMerged: number;
  violationsCaught: number;
  healedRate: number | null;
  frictionPerPass: number | null;
  llmRouter?: RouterMonthlyKPI;
}

export interface DailyMetric {
  [key: string]: unknown;
  day: string;
  label: string;
  prePrTotal: number;
  prePrPass: number;
  prePrFail: number;
  prePrPassRate: number | null;
  ruleFails: number;
  healed: number;
  sessions: number;
  merges: number;
  friction: number | null;
}

export type PrType = "feat" | "fix" | "refactor" | "docs" | "chore" | "other";

export interface PrRow {
  number: number;
  title: string;
  type: PrType;
  date: string;
  tokens: number;
  benefit: string;
  impact: string;
}

export interface RepoFacts {
  components: number;
  pages: number;
  libs: number;
  scripts: number;
  testFiles: number;
  skills: number;
  rules: number;
  events: number;
  qualityNotes: number;
}

export interface Summary30 {
  merges: number;
  prs: number;
  sessions: number;
  violations: number;
  healed: number;
  prePrPassRate: number | null;
}

export interface KpiData {
  generatedAt: string;
  currentMonth: string;
  months: MonthlyKPI[];
  daily: DailyMetric[];
  prs: PrRow[];
  repo: RepoFacts;
  summary: Summary30;
}

// ─── Aba Workflow ───

export interface WorkflowKpiStat {
  value: number;
  label: string;
  sub: string;
}

export interface WorkflowEventType {
  name: string;
  n: number;
  color: string;
}

export interface WorkflowGradeBucket {
  name: string;
  n: number;
  color: string;
}

export interface WorkflowRecentEvent {
  t: string;
  d: string;
  desc: string;
}

export interface WorkflowViolation {
  rule: string;
  count: number;
  hint: string;
}

export interface WorkflowGateEfficiency {
  ruleFails: number;
  healed: number;
  healedRate: number | null;
  prePrTotal: number;
  prePrPass: number;
  prePrPassRate: number | null;
  gateBlocked: number;
  topViolations: WorkflowViolation[];
}

export interface WorkflowData {
  generatedAt: string;
  dataDate: string;
  kpiStats: WorkflowKpiStat[];
  eventTypes: WorkflowEventType[];
  grades: WorkflowGradeBucket[];
  recentTimeline: WorkflowRecentEvent[];
  gateEfficiency: WorkflowGateEfficiency;
  lastPrs: PrRow[];
  overview: RepoFacts;
}
