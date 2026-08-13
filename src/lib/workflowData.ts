/**
 * workflowData.ts — Dados da aba Workflow (telemetria REAL atualizada).
 *
 * Busca /workflow-data.json (gerado por `npm run data:refresh` / nightly CI)
 * e usa os dados ilustrativos congelados (workflowDemoData) como fallback —
 * a primeira renderização já exibe conteúdo e o real chega em seguida.
 *
 * regra-31: lib com teste unitário (tests/unit/workflowData.test.ts)
 */
import { useEffect, useState } from "react";
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

/**
 * Hook de dados reais do workflow. Retorna sempre um WorkflowData válido:
 * os dados reais quando /workflow-data.json está disponível, o fallback
 * ilustrativo enquanto carrega ou se a busca falhar.
 */
export function useWorkflowData(): WorkflowData {
  const [data, setData] = useState<WorkflowData | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/workflow-data.json");
        if (!res.ok) throw new Error("workflow-data indisponível");
        const json = (await res.json()) as WorkflowData;
        if (!cancelled) setData(json);
      } catch {
        // fallback: mantém null → componentes usam os dados ilustrativos
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return data ?? fallbackWorkflowData();
}
