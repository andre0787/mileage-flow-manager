/**
 * workflowData.ts — Dados da aba Workflow (telemetria REAL atualizada).
 *
 * Busca /workflow-data.json (gerado por `npm run data:refresh` / nightly CI)
 * e usa os dados ilustrativos congelados (workflowDemoData) como fallback —
 * a primeira renderização já exibe conteúdo e o real chega em seguida.
 *
 * React 19 (rule-45): em vez de useEffect + useState, a lib expõe um resource
 * (promise cacheada em módulo) resolvido com `use()` — o Suspense mais próximo
 * mostra o fallback ilustrativo enquanto o JSON real carrega.
 *
 * regra-31: lib com teste unitário (tests/unit/workflowData.test.ts)
 */
import { use } from "react";
import {
  DATA_DATE,
  EVENT_TYPES as DEMO_EVENT_TYPES,
  GATE_EFFICIENCY as DEMO_GATE,
  GRADES as DEMO_GRADES,
  KPI_STATS as DEMO_KPI_STATS,
  RECENT_TIMELINE as DEMO_TIMELINE,
} from "@/lib/workflowDemoData";
import type { WorkflowData } from "@/types/kpi";

/** Dados ilustrativos de fallback (congelados em 2026-08-12). */
export function fallbackWorkflowData(): WorkflowData {
  return {
    generatedAt: new Date(0).toISOString(),
    dataDate: DATA_DATE,
    kpiStats: DEMO_KPI_STATS,
    eventTypes: DEMO_EVENT_TYPES,
    grades: DEMO_GRADES,
    recentTimeline: DEMO_TIMELINE,
    gateEfficiency: DEMO_GATE,
    lastPrs: [],
    overview: {
      components: 0,
      pages: 0,
      libs: 0,
      scripts: 0,
      testFiles: 0,
      skills: 0,
      rules: 0,
      events: 0,
      qualityNotes: 0,
    },
  };
}

let workflowPromise: Promise<WorkflowData> | null = null;

/**
 * Resource de dados reais do workflow: uma única promise cacheada em módulo.
 * Em falha (JSON ausente), resolve com o fallback ilustrativo — o componente
 * nunca suspende por erro, apenas enquanto o fetch está pendente.
 */
export function loadWorkflowData(): Promise<WorkflowData> {
  if (!workflowPromise) {
    workflowPromise = fetch("/workflow-data.json")
      .then((res) => {
        if (!res.ok) throw new Error("workflow-data indisponível");
        return res.json() as Promise<WorkflowData>;
      })
      .catch(() => fallbackWorkflowData());
  }
  return workflowPromise;
}

/**
 * Hook de dados reais do workflow. Retorna sempre um WorkflowData válido:
 * suspende via `use()` até o JSON real chegar (fallback ilustrativo exibido
 * pelo Suspense), ou resolve com o fallback se a busca falhar.
 */
export function useWorkflowData(): WorkflowData {
  return use(loadWorkflowData());
}
