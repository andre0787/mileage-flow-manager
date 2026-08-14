import { Suspense, use, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { costPerArea, type AiTelemetryRecord } from "@/lib/aiTelemetry";
import type { AiTelemetryAreaCost } from "@/types/kpi";

/** Registros brutos da ai_telemetry OU agregados por área (snapshot do JSON). */
export type AiCostRecord = AiTelemetryRecord | AiTelemetryAreaCost;

let telemetryPromise: Promise<AiTelemetryRecord[]> | null = null;

/**
 * Resource dos registros de telemetria (Blueprint v9.0, rule-48): busca a
 * tabela ai_telemetry no Supabase uma única vez (promise cacheada em módulo).
 * Nunca rejeita — em falha resolve com [] (empty state, fail-open).
 */
function LiveAiCostContent() {
  const records = use(loadTelemetryRecords());
  return <AiCostContent records={records} />;
}

function loadTelemetryRecords(): Promise<AiTelemetryRecord[]> {
  if (!telemetryPromise) {
    telemetryPromise = Promise.resolve(
      supabase
        .from("ai_telemetry")
        .select("area, cost_estimate, total_execution_time_ms, tokens_used")
        .order("created_at", { ascending: false })
        .limit(500)
        .then(
          ({ data }) => (data as AiTelemetryRecord[]) ?? [],
          () => [],
        ),
    );
  }
  return telemetryPromise;
}

function AiCostContent({ records }: { records: AiCostRecord[] }) {
  // Registros brutos (id/user_id) → agrega via costPerArea; agregados do
  // snapshot nightly (area/cost/executions) → usa direto.
  const byArea = useMemo(() => {
    if (!records.length) return [];
    const first = records[0] as AiCostRecord;
    if ("cost_estimate" in first) {
      return costPerArea(records as AiTelemetryRecord[]);
    }
    return records as AiTelemetryAreaCost[];
  }, [records]);
  const totalCost = byArea.reduce((s, a) => s + a.cost, 0);
  const totalExec = byArea.reduce((s, a) => s + a.executions, 0);

  if (byArea.length === 0) {
    return (
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
    );
  }

  return (
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
                <td className="py-2 pr-4 font-semibold text-foreground capitalize">{a.area}</td>
                <td className="py-2 pr-4 text-muted-foreground">{a.executions}</td>
                <td className="py-2 pr-4 font-mono text-muted-foreground">${a.cost.toFixed(5)}</td>
                <td className="py-2 text-muted-foreground">
                  {a.avgExecutionMs > 0 ? `${(a.avgExecutionMs / 1000).toFixed(1)}s` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/**
 * AiCostSection — "Custo por Funcionalidade" (Blueprint v9.0, rule-48).
 *
 * Cruza ai_telemetry com as áreas do sistema (Contas, Vendas, Milhas...) e
 * exibe custo estimado por área. React 19: resolve via use() — o Suspense
 * local mostra o skeleton enquanto o Supabase responde.
 *
 * `records` é override para testes — sem ele, a seção busca via use().
 */
export function AiCostSection({ records: initialRecords }: { records?: AiCostRecord[] }) {
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
          {initialRecords !== undefined ? (
            <AiCostContent records={initialRecords} />
          ) : (
            <Suspense fallback={<div className="h-24 animate-pulse rounded-xl bg-muted" />}>
              <LiveAiCostContent />
            </Suspense>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
