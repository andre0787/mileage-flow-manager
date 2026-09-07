import { Suspense, use } from "react";
import KPIDashboard from "@/components/KPIDashboard";
import type { KpiData } from "@/types/kpi";

/** TTL do cache — JSON nightly fresco por sessão, refetch a cada 10 min. */
const KPI_TTL_MS = 10 * 60 * 1000;
let kpiCache: { promise: Promise<KpiData | null>; at: number } | null = null;

function fetchKpiData(): Promise<KpiData | null> {
  return fetch("/kpi-data.json")
    .then((r) => {
      if (!r.ok) throw new Error("Dados não encontrados");
      return r.json() as Promise<KpiData>;
    })
    .catch(() => null);
}

/**
 * Resource dos KPIs: /kpi-data.json (gerado por `npm run data:refresh`/nightly).
 * Cache com TTL em módulo — em falha resolve com null (a página mostra a
 * UI de "nenhum dado disponível" com a dica de gerar os dados).
 */
function loadKpiData(): Promise<KpiData | null> {
  if (!kpiCache || Date.now() - kpiCache.at > KPI_TTL_MS) {
    kpiCache = { promise: fetchKpiData(), at: Date.now() };
  }
  return kpiCache.promise;
}

function KpiContent() {
  const data = use(loadKpiData());

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <p className="text-4xl mb-4">📊</p>
          <h2 className="text-xl font-semibold mb-2 text-muted-foreground">
            Nenhum dado disponível
          </h2>
          <p className="text-muted-foreground text-sm">
            Execute{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
              npm run data:refresh
            </code>{" "}
            no terminal (ou aguarde o nightly) para gerar os KPIs diários e mensais.
          </p>
        </div>
      </div>
    );
  }

  return <KPIDashboard data={data} />;
}

export default function KPI() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando KPIs...</p>
          </div>
        </div>
      }
    >
      <KpiContent />
    </Suspense>
  );
}
