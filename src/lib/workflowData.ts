/**
 * workflowData.ts — Dados da aba Workflow (telemetria REAL atualizada).
 *
 * Busca /workflow-data.json (gerado por `npm run data:refresh` / nightly CI)
 * com fallback para /mock/workflow-fallback.json (dados ilustrativos em JSON estático)
 * e por fim para estrutura vazia segura. Compatível com React 19 `use()`.
 *
 * Regra-31: lib com teste unitário (tests/unit/workflowData.test.ts)
 */
import { use } from "react";
import type { WorkflowData } from "@/types/kpi";

/** Estrutura vazia segura — nunca quebra a UI se ambos os JSON falharem. */
export function fallbackWorkflowData(): WorkflowData {
  return {
    generatedAt: new Date(0).toISOString(),
    dataDate: new Date().toISOString().slice(0, 10),
    kpiStats: [],
    eventTypes: [],
    grades: [],
    recentTimeline: [],
    gateEfficiency: {
      ruleFails: 0,
      healed: 0,
      healedRate: 0,
      prePrTotal: 0,
      prePrPass: 0,
      prePrPassRate: 0,
      gateBlocked: 0,
      topViolations: [],
    },
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
 * Resource de dados reais: tenta workflow-data.json, depois fallback JSON estático,
 * depois estrutura vazia. Nunca rejeita.
 */
export function loadWorkflowData(): Promise<WorkflowData> {
  if (!workflowPromise) {
    workflowPromise = fetch("/workflow-data.json")
      .then((res) => {
        if (!res.ok) throw new Error("workflow-data indisponível");
        return res.json() as Promise<WorkflowData>;
      })
      .catch(() =>
        fetch("/mock/workflow-fallback.json")
          .then((res) => {
            if (!res.ok) throw new Error("fallback indisponível");
            return res.json() as Promise<Record<string, unknown>>;
          })
          .then((fallback) => {
            // Converte fallback genérico para WorkflowData quando possível,
            // senão retorna estrutura vazia. Mantém compatibilidade com
            // dados ilustrativos antigos que têm KPI_STATS etc.
            if (fallback && typeof fallback === "object" && "KPI_STATS" in fallback) {
              const f = fallback as unknown as {
                DATA_DATE: string;
                KPI_STATS: WorkflowData["kpiStats"];
                EVENT_TYPES: WorkflowData["eventTypes"];
                GRADES: WorkflowData["grades"];
                RECENT_TIMELINE: WorkflowData["recentTimeline"];
                GATE_EFFICIENCY: WorkflowData["gateEfficiency"];
              };
              return {
                generatedAt: new Date(0).toISOString(),
                dataDate: f.DATA_DATE,
                kpiStats: f.KPI_STATS,
                eventTypes: f.EVENT_TYPES,
                grades: f.GRADES,
                recentTimeline: f.RECENT_TIMELINE,
                gateEfficiency: f.GATE_EFFICIENCY,
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
              } satisfies WorkflowData;
            }
            return fallback as unknown as WorkflowData;
          })
          .catch(() => fallbackWorkflowData()),
      );
  }
  return workflowPromise;
}

/** Hook React 19 que suspende via `use()` até dados chegarem. */
export function useWorkflowData(): WorkflowData {
  return use(loadWorkflowData());
}

/** Reseta cache — útil para testes. */
export function _resetWorkflowCache(): void {
  workflowPromise = null;
}
