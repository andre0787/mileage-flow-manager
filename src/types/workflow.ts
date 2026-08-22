/**
 * workflow.ts — Tipos e interfaces estruturais do Workflow.
 */

export interface KpiStat {
  value: number;
  label: string;
  sub: string;
}

export interface EventType {
  name: string;
  n: number;
  color: string;
}

export interface GradeBucket {
  name: string;
  n: number;
  color: string;
}

export interface RecentEvent {
  t: string;
  d: string;
  desc: string;
}

export interface JourneyStep {
  dot: string;
  title: string;
  badge: string;
  badgeKind: "gate" | "tele";
  body: string;
  ev: string;
  done?: boolean;
  blocked?: boolean;
}

export interface FluxoTStep {
  side: "left" | "right";
  kind: "step" | "gate" | "fail";
  time: string;
  title: string;
  desc: string;
  tag: string;
  tagKind: "default" | "warn" | "fail";
}

export interface FluxoPhase {
  label: string;
}

export type FluxoItem = { type: "phase"; phase: FluxoPhase } | { type: "step"; step: FluxoTStep };

export interface MindBranch {
  id: string;
  label: string;
  color: string;
  detail: string;
  ev: string;
  kids: string[];
}

export interface GateCard {
  emoji: string;
  title: string;
  question: string;
  how: string;
  rule: string;
  state: string;
  stateKind: "ok" | "fail" | "warn";
}

export interface SimScenario {
  id: "fail" | "ok";
  label: string;
  lines: { text: string; kind: "muted" | "ok" | "fail" | "title" }[];
  summary: string;
  summaryKind: "fail" | "ok";
  hint: string;
}

export interface ViolationStat {
  rule: string;
  count: number;
  hint: string;
}

export interface GateEfficiencyStats {
  ruleFails: number;
  healed: number;
  healedRate: number;
  prePrTotal: number;
  prePrPass: number;
  prePrPassRate: number;
  gateBlocked: number;
  topViolations: ViolationStat[];
}

export interface WorkflowFallbackData {
  DATA_DATE: string;
  HERO_META: string[];
  WHAT_CARDS: { emoji: string; title: string; body: string }[];
  KPI_STATS: KpiStat[];
  EVENT_TYPES: EventType[];
  MAX_EVENTS: number;
  GRADES: GradeBucket[];
  MAX_GRADE: number;
  RECENT_TIMELINE: RecentEvent[];
  JOURNEY_STEPS: JourneyStep[];
  FLUXO_ITEMS: FluxoItem[];
  FLUXO_LOOP: {
    failArrow: string;
    title: string;
    desc: string;
    tag: string;
    okArrow: string;
  };
  MIND: MindBranch[];
  GATES: GateCard[];
  GATE_EFFICIENCY: GateEfficiencyStats;
  SIM_SCENARIOS: SimScenario[];
}
