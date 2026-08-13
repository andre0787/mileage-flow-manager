import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { formatDateBR } from "@/lib/dateUtils";
import type { TransferRow } from "@/lib/dashboardTimeline";

interface RecentTransfersListProps {
  recentTransfers: TransferRow[];
}

export function RecentTransfersList({ recentTransfers }: RecentTransfersListProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold font-display">
          <TrendingUp className="h-4 w-4 text-primary" />
          Transferências Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {recentTransfers.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="Nenhuma transferência"
              description="Transfira pontos entre contas na opção Transferir em Entradas e veja o histórico aqui."
            />
          ) : (
            recentTransfers.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:bg-muted/50"
              >
                <div className="space-y-0.5 min-w-0">
                  <h4 className="font-semibold text-sm text-foreground font-display truncate">
                    {t.sourceAccountName}
                  </h4>
                  <p className="text-xs text-muted-foreground font-body">
                    {formatDateBR(t.date)} • {t.destAccountName}{" "}
                    {t.bonusPercent ? `• +${t.bonusPercent}% bônus` : ""}
                  </p>
                </div>
                <div className="text-right space-y-0.5 shrink-0 ml-3">
                  <p className="text-sm font-semibold text-foreground tabular-nums">
                    {t.pointsDebited.toLocaleString("pt-BR")} pts
                  </p>
                  <p className="text-xs text-success tabular-nums">
                    → {t.milesReceived.toLocaleString("pt-BR")} milhas
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
