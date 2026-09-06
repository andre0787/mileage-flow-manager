import { Card, CardContent } from "@/components/ui/card";
import type { FlowKeys } from "@/lib/flowKeys";

function fmt(n: number, digits = 1): string {
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/**
 * Strip 4-keys adaptadas. Cada key exibe margem de interpretação + prazo
 * de medição ao lado do número (anti-Goodhart). Sem lucro por cliente.
 */
export function FlowKeysStrip({ keys }: { keys: FlowKeys }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="shadow-card">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Throughput</p>
          <p className="text-2xl font-display tabular-nums">
            {fmt(keys.throughputPerDay)} <span className="text-sm">vendas/dia</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {keys.throughputCount} pagas+concluídas · janela {keys.windowDays}d
          </p>
        </CardContent>
      </Card>
      <Card className="shadow-card">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Lead time (FIFO, proxy)</p>
          <p className="text-2xl font-display tabular-nums">
            {keys.leadP50 === null
              ? "—"
              : `p50 ${fmt(keys.leadP50, 0)}d · p85 ${fmt(keys.leadP85 ?? 0, 0)}d`}
          </p>
          <p className="text-xs text-muted-foreground">
            n={keys.leadN}
            {keys.leadPreliminary && (
              <span className="ml-1 rounded-full bg-warning/10 px-1.5 py-0.5 font-semibold text-warning">
                preliminar
              </span>
            )}
          </p>
        </CardContent>
      </Card>
      <Card className="shadow-card">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">% Divergência</p>
          <p className="text-2xl font-display tabular-nums">{fmt(keys.divergencePct)}%</p>
          <p className="text-xs text-muted-foreground">
            {keys.divergenceNum}/{keys.divergenceDen} canceladas+estorno
          </p>
        </CardContent>
      </Card>
      <Card className="shadow-card">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">MTTR reconciliação</p>
          <p className="text-2xl font-display tabular-nums">
            {keys.mttrDays === null ? "—" : `${fmt(keys.mttrDays)} dias`}
          </p>
          <p className="text-xs text-muted-foreground">
            {keys.mttrPairs === 0 ? "sem pares reversal↔spend" : `${keys.mttrPairs} pares`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
