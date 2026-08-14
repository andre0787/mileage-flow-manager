import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { costPerArea, type AiTelemetryRecord } from "@/lib/aiTelemetry";

/**
 * AiCostSection — "Custo por Funcionalidade" (Blueprint v9.0, rule-48).
 *
 * Cruza ai_telemetry com as áreas do sistema (Contas, Vendas, Milhas...) e
 * exibe custo estimado por área. Sem registros (migration ainda não aplicada
 * ou sessões sem `npm run telemetry:record`), renderiza empty state.
 *
 * `records` é override para testes — sem ele, a seção busca no Supabase.
 */
export function AiCostSection({ records: initialRecords }: { records?: AiTelemetryRecord[] }) {
  const [records, setRecords] = useState<AiTelemetryRecord[]>(initialRecords ?? []);
  const [loading, setLoading] = useState(initialRecords === undefined);

  useEffect(() => {
    if (initialRecords !== undefined) return;
    let active = true;
    setLoading(true);
    supabase
      .from("ai_telemetry")
      .select("area, cost_estimate, total_execution_time_ms, tokens_used")
      .order("created_at", { ascending: false })
      .limit(500)
      .then(
        ({ data }) => {
          if (!active) return;
          setRecords((data as AiTelemetryRecord[]) ?? []);
          setLoading(false);
        },
        () => {
          if (active) {
            setRecords([]);
            setLoading(false);
          }
        },
      );
    return () => {
      active = false;
    };
  }, [initialRecords]);

  const byArea = useMemo(() => costPerArea(records), [records]);
  const totalCost = useMemo(() => byArea.reduce((s, a) => s + a.cost, 0), [byArea]);
  const totalExec = useMemo(() => byArea.reduce((s, a) => s + a.executions, 0), [byArea]);

  return (
    <section className="space-y-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Telemetria da IA
      </span>
      <h2 className="text-lg md:text-xl font-bold text-foreground font-display">
        Custo por Funcionalidade
      </h2>

      <Card>
        <CardContent className="p-4">
          {loading ? (
            <div className="h-24 animate-pulse rounded-xl bg-muted" />
          ) : byArea.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Sem registros de telemetria</p>
              <p className="mt-1">
                Rode{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">
                  npm run telemetry:record
                </code>{" "}
                ao finalizar sessões de IA para ver o custo por área.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
                <span>
                  Custo total: <b className="text-foreground">${totalCost.toFixed(5)}</b>
                </span>
                <span>
                  Execuções: <b className="text-foreground">{totalExec}</b>
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="pb-2 pr-4 font-semibold">Área</th>
                      <th className="pb-2 pr-4 font-semibold">Execuções</th>
                      <th className="pb-2 pr-4 font-semibold">Custo (USD)</th>
                      <th className="pb-2 font-semibold">Tempo médio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byArea.map((a) => (
                      <tr key={a.area} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-semibold text-foreground capitalize">
                          {a.area}
                        </td>
                        <td className="py-2 pr-4 text-muted-foreground">{a.executions}</td>
                        <td className="py-2 pr-4 font-mono text-muted-foreground">
                          ${a.cost.toFixed(5)}
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {a.avgExecutionMs > 0 ? `${(a.avgExecutionMs / 1000).toFixed(1)}s` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
