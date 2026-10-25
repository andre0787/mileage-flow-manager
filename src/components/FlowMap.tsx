import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Coins, Users, TrendingUp, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { FlowMapHeader, DesktopFlowView, MobileFlowView, FlowNode } from "./FlowMapViews";

interface FlowMapProps {
  totalMiles: number;
  activeAccounts: number;
  totalSoldMiles: number;
  totalRevenue: number;
  ownersCount: number;
  className?: string;
  unitLabel?: string;
  title?: string;
}

export function FlowMap({
  totalMiles,
  activeAccounts,
  totalSoldMiles,
  totalRevenue,
  ownersCount,
  className,
  unitLabel = "Milhas",
  title,
}: FlowMapProps) {
  const nodes: FlowNode[] = useMemo(
    () => [
      {
        id: "miles",
        label: `${unitLabel} em Estoque`,
        value: totalMiles.toLocaleString("pt-BR"),
        icon: Coins,
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/20",
      },
      {
        id: "accounts",
        label: "Contas Ativas",
        value: activeAccounts.toString(),
        icon: Users,
        color: "text-teal",
        bg: "bg-teal/10",
        border: "border-teal/20",
      },
      {
        id: "sold",
        label: `${unitLabel} Vendidas`,
        value: totalSoldMiles.toLocaleString("pt-BR"),
        icon: TrendingUp,
        color: "text-gold",
        bg: "bg-gold/10",
        border: "border-gold/20",
      },
      {
        id: "revenue",
        label: "Receita Total",
        value: `R$ ${totalRevenue.toLocaleString("pt-BR")}`,
        icon: DollarSign,
        color: "text-success",
        bg: "bg-success/10",
        border: "border-success/20",
      },
    ],
    [totalMiles, activeAccounts, totalSoldMiles, totalRevenue, unitLabel],
  );

  return (
    <Card
      className={cn("overflow-hidden transition-card duration-300 hover:shadow-elegant", className)}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/60 via-gold/40 to-teal/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.01] via-transparent to-gold/[0.01] pointer-events-none" />
      <CardContent className="p-5 md:p-6 relative">
        <FlowMapHeader title={title} unitLabel={unitLabel} ownersCount={ownersCount} />
        <DesktopFlowView nodes={nodes} />
        <MobileFlowView nodes={nodes} />
      </CardContent>
    </Card>
  );
}
