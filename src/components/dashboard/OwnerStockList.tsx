import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import type { OwnerDataRow } from "@/lib/dashboardSelectors";

interface OwnerStockListProps {
  ownerData: OwnerDataRow[];
  unitLabel: "milhas" | "pontos";
  /** Exibe badge de alerta CPF (apenas na tab Milhas) */
  showCpfBadge?: boolean;
  emptyTitle: string;
  emptyDescription: string;
  icon: LucideIcon;
  title: string;
}

export function OwnerStockList({
  ownerData,
  unitLabel,
  showCpfBadge = false,
  emptyTitle,
  emptyDescription,
  icon: Icon,
  title,
}: OwnerStockListProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold font-display">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {ownerData.length === 0 ? (
            <EmptyState icon={Icon} title={emptyTitle} description={emptyDescription} />
          ) : (
            ownerData.map((owner) => (
              <div
                key={owner.owner}
                className="flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:bg-muted/50"
              >
                <div className="space-y-0.5">
                  <h3 className="font-semibold text-sm text-foreground font-display">
                    {owner.owner}
                  </h3>
                  <p className="text-xs text-muted-foreground font-body">
                    {owner.programs.join(", ")} •{" "}
                    <span className="font-semibold">
                      {owner.totalMiles.toLocaleString("pt-BR")} {unitLabel}
                    </span>
                  </p>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="text-sm font-semibold text-foreground tabular-nums">
                    R$ {owner.totalInvested.toLocaleString("pt-BR")}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    R$ {owner.avgCost.toFixed(4)}/{unitLabel === "milhas" ? "milha" : "ponto"}
                  </p>
                  {showCpfBadge && (
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-xs text-muted-foreground">
                        CPFs: {owner.cpfCount}/{owner.maxCpf}
                      </span>
                      <Badge
                        variant={
                          owner.cpfCount >= 20
                            ? "destructive"
                            : owner.cpfCount >= 18
                              ? "secondary"
                              : "outline"
                        }
                        className="text-xs px-1.5 py-0"
                      >
                        {owner.cpfCount >= 20 ? "Crítico" : owner.cpfCount >= 18 ? "Atenção" : "OK"}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
