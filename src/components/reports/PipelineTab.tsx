import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildPipelineWip, type PipelineWip } from "@/lib/pipelineStages";
import type { PointEntry } from "@/types";

interface PipelineTabProps {
  entries: Pick<PointEntry, "amountPaid" | "amount" | "accountId">[];
  sales: {
    status: string;
    date: string;
    kind?: string | null;
    accountId?: string | null;
  }[];
}

const STAGE_META: { key: keyof Omit<PipelineWip, "expedite" | "servicoFora">; label: string }[] = [
  { key: "aguardando", label: "Aguardando" },
  { key: "comprado", label: "Comprado" },
  { key: "aExecutar", label: "Vendido · a executar" },
  { key: "aReceber", label: "A receber" },
  { key: "recebido", label: "Recebido" },
  { key: "cancelado", label: "Cancelado (lateral)" },
];

/**
 * Aba Pipeline: WIP por estágio computável (só-observação, sem bloqueio).
 * Escopo 100% no caller (entradas/saídas já filtradas) — sem filtro interno.
 * Sem P&L aqui — agregado só em drawer futuro.
 */
export function PipelineTab({ entries, sales }: PipelineTabProps) {
  const wip = useMemo(() => buildPipelineWip(entries, sales), [entries, sales]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STAGE_META.map(({ key, label }) => (
          <Card key={key} className="shadow-card">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-3xl font-display tabular-nums">{wip[key]}</p>
              {key === "aReceber" && wip.expedite > 0 && (
                <p className="text-xs font-semibold text-warning mt-1">
                  {wip.expedite} vencendo em ≤ 7 dias
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {wip.servicoFora > 0 && (
        <p className="text-xs text-muted-foreground">
          {wip.servicoFora} venda(s) de serviço fora do WIP de milhas.
        </p>
      )}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            WIP é só-observação (sem limites bloqueantes)
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
