import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import type { RecentSaleRow } from "@/lib/dashboardTimeline";

interface RecentSalesListProps {
  recentSales: RecentSaleRow[];
}

export function RecentSalesList({ recentSales }: RecentSalesListProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold font-display">
          <TrendingUp className="h-4 w-4 text-primary" />
          Vendas Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {recentSales.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="Nenhuma venda registrada"
              description="Vender milhas é o próximo passo natural. Crie sua primeira venda na aba Vendas."
            />
          ) : (
            recentSales.map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:bg-muted/50"
              >
                <div className="space-y-0.5 min-w-0">
                  <h4 className="font-semibold text-sm text-foreground font-display truncate">
                    {sale.client}
                  </h4>
                  <p className="text-xs text-muted-foreground font-body truncate">
                    {sale.owner} • {sale.program} •{" "}
                    <span className="font-semibold tabular-nums">
                      {sale.miles.toLocaleString("pt-BR")} milhas
                    </span>
                  </p>
                </div>
                <div className="text-right space-y-0.5 shrink-0 ml-3">
                  <p className="text-sm font-semibold text-foreground tabular-nums">
                    R$ {sale.value.toLocaleString("pt-BR")}
                  </p>
                  <Badge variant={sale.statusColor} className="text-xs px-1.5 py-0">
                    {sale.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
