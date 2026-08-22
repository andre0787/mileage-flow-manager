/**
 * workflowStaticData.ts — Re-exporta dados ilustrativos a partir de JSON estático.
 *
 * Substitui `src/lib/workflowDemoData.ts` (deletado na Fase A) mantendo compatibilidade
 * para componentes ilustrativos (WorkflowHero, Gates, etc.) sem inflar contexto TS.
 * Dados vivem em `public/mock/workflow-fallback.json` (excluído do context-pack).
 */
import fallback from "../../public/mock/workflow-fallback.json";

export const DATA_DATE = (fallback as unknown as { DATA_DATE: string }).DATA_DATE;
export const HERO_META = (fallback as unknown as { HERO_META: string[] }).HERO_META;
export const WHAT_CARDS = (fallback as unknown as { WHAT_CARDS: unknown[] }).WHAT_CARDS as {
  emoji: string;
  title: string;
  body: string;
}[];
export const KPI_STATS = (fallback as unknown as { KPI_STATS: unknown[] })
  .KPI_STATS as import("@/types/workflow").KpiStat[];
export const EVENT_TYPES = (fallback as unknown as { EVENT_TYPES: unknown[] })
  .EVENT_TYPES as import("@/types/workflow").EventType[];
export const MAX_EVENTS = (fallback as unknown as { MAX_EVENTS: number }).MAX_EVENTS;
export const GRADES = (fallback as unknown as { GRADES: unknown[] })
  .GRADES as import("@/types/workflow").GradeBucket[];
export const MAX_GRADE = (fallback as unknown as { MAX_GRADE: number }).MAX_GRADE;
export const RECENT_TIMELINE = (fallback as unknown as { RECENT_TIMELINE: unknown[] })
  .RECENT_TIMELINE as import("@/types/workflow").RecentEvent[];
export const JOURNEY_STEPS = (fallback as unknown as { JOURNEY_STEPS: unknown[] })
  .JOURNEY_STEPS as import("@/types/workflow").JourneyStep[];
export const FLUXO_ITEMS = (fallback as unknown as { FLUXO_ITEMS: unknown[] })
  .FLUXO_ITEMS as import("@/types/workflow").FluxoItem[];
export const FLUXO_LOOP = (fallback as unknown as import("@/types/workflow").WorkflowFallbackData)
  .FLUXO_LOOP;
export const MIND = (fallback as unknown as { MIND: unknown[] })
  .MIND as import("@/types/workflow").MindBranch[];
export const GATES = (fallback as unknown as { GATES: unknown[] })
  .GATES as import("@/types/workflow").GateCard[];
export const GATE_EFFICIENCY = (fallback as unknown as { GATE_EFFICIENCY: unknown })
  .GATE_EFFICIENCY as import("@/types/workflow").GateEfficiencyStats;
export const SIM_SCENARIOS = (fallback as unknown as { SIM_SCENARIOS: unknown[] })
  .SIM_SCENARIOS as import("@/types/workflow").SimScenario[];

export function kpiForId(id: string): import("@/types/workflow").KpiStat | undefined {
  return (KPI_STATS as import("@/types/workflow").KpiStat[]).find((s) => s.value === Number(id));
}
