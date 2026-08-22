import { useCallback, useEffect, useState } from "react";
import type { KpiData } from "@/types/kpi";
import type { WorkflowData } from "@/types/kpi";
import { fallbackWorkflowData } from "@/lib/workflowData";

export interface WorkflowMetricsState {
  workflow: WorkflowData | null;
  kpis: KpiData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  refreshedAt: string | null;
  refresh: () => Promise<void>;
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`${path} indisponível`);
  return response.json() as Promise<T>;
}

/** Dados reais de Workflow/KPIs com atualização periódica e fallback fail-open. */
export function useWorkflowMetrics(): WorkflowMetricsState {
  const [workflow, setWorkflow] = useState<WorkflowData | null>(null);
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    const [workflowResult, kpiResult] = await Promise.allSettled([
      fetchJson<WorkflowData>("/workflow-data.json"),
      fetchJson<KpiData>("/kpi-data.json"),
    ]);
    if (workflowResult.status === "fulfilled") setWorkflow(workflowResult.value);
    if (kpiResult.status === "fulfilled") setKpis(kpiResult.value);
    const rejected = [workflowResult, kpiResult].find((result) => result.status === "rejected");
    setError(rejected?.status === "rejected" ? rejected.reason : null);
    if (workflowResult.status === "rejected") setWorkflow(fallbackWorkflowData());
    setRefreshedAt(new Date().toISOString());
    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 30_000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  return { workflow, kpis, isLoading, isRefreshing, error, refreshedAt, refresh };
}
