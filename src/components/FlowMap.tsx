import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Plane, ArrowRight, TrendingUp, DollarSign, Users, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlowNode {
  id: string;
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
}

interface FlowMapProps {
  totalMiles: number;
  activeAccounts: number;
  totalSoldMiles: number;
  totalRevenue: number;
  ownersCount: number;
  className?: string;
  unitLabel?: string;
}

export function FlowMap({
  totalMiles,
  activeAccounts,
  totalSoldMiles,
  totalRevenue,
  ownersCount,
  className,
  unitLabel = "Milhas",
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
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Plane className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground font-display">
              Fluxo de {unitLabel}
            </h3>
            <p className="text-xs text-muted-foreground">
              {ownersCount} proprietário{ownersCount !== 1 ? "s" : ""} ativo
              {ownersCount !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Flow indicator */}
          <div className="ml-auto hidden sm:flex items-center gap-2 text-xs text-muted-foreground tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            FLUXO ATIVO
          </div>
        </div>

        {/* Desktop: horizontal flow */}
        <div className="hidden md:flex items-stretch gap-3">
          {nodes.map((node, index) => (
            <div key={node.id} className="flex-1 flex flex-col items-stretch">
              <div
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-3 p-4 rounded-xl border text-center transition-card duration-300",
                  "hover:-translate-y-1.5 hover:shadow-elegant hover:border-primary/30",
                  node.border,
                  node.bg,
                  node.id === "miles" ? "shadow-glow border-primary/30" : "",
                  index === 0 && "animate-appear",
                  index === 1 && "animate-appear animate-delay-100",
                  index === 2 && "animate-appear animate-delay-200",
                  index === 3 && "animate-appear animate-delay-300",
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
                    "backdrop-blur-sm",
                    node.bg,
                    node.color,
                  )}
                >
                  <node.icon className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    {node.label}
                  </p>
                  <p className={cn("text-base font-bold", node.color)}>{node.value}</p>
                </div>
              </div>

              {/* Connecting arrow with animated line */}
              {index < nodes.length - 1 && (
                <div className="flex items-center justify-center h-6 -my-1 relative">
                  <div className="w-px h-full bg-gradient-to-b from-primary/20 via-gold/20 to-success/20" />
                  <div className="absolute w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center">
                    <ArrowRight className="w-3 h-3 text-muted-foreground/60" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile: horizontal scroll */}
        <div className="flex md:hidden items-stretch gap-2 overflow-x-auto pb-2 snap-x snap-mandatory max-w-full">
          {nodes.map((node, index) => (
            <div key={node.id} className="flex items-stretch gap-2 snap-center">
              <div
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border text-center min-w-[130px] transition-all duration-300",
                  "hover:-translate-y-0.5 hover:shadow-elegant",
                  node.border,
                  node.bg,
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    node.bg,
                    node.color,
                  )}
                >
                  <node.icon className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    {node.label}
                  </p>
                  <p className={cn("text-sm font-bold", node.color)}>{node.value}</p>
                </div>
              </div>

              {index < nodes.length - 1 && (
                <div className="flex items-center">
                  <div className="w-5 h-px bg-border relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                  </div>
                  <ArrowRight className="w-3 h-3 text-muted-foreground/40 -ml-1" />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
