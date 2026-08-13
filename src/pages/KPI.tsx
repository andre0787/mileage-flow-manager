import { useEffect, useState } from "react";
import KPIDashboard from "@/components/KPIDashboard";
import type { KpiData } from "@/types/kpi";

export default function KPI() {
  const [data, setData] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/kpi-data.json")
      .then((r) => {
        if (!r.ok) throw new Error("Dados não encontrados");
        return r.json();
      })
      .then((d: KpiData) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando KPIs...</p>
        </div>
      </div>
    );

  if (error || !data) {
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
