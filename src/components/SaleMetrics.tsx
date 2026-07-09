import { DollarSign, TrendingUp, Target, Percent } from "lucide-react";
import { cn } from "@/lib/utils";
import { MetricCard } from "@/components/MetricCard";
import { calcProfitMargin } from "@/lib/metrics";
import type { Sale } from "@/types";

interface SaleMetricsProps {
  sales: Sale[];
  className?: string;
}

export function SaleMetrics({ sales, className }: SaleMetricsProps) {
  const activeSales = sales.filter((s) => s.status !== "cancelado");
  const totalRevenue = activeSales.reduce((sum, s) => sum + s.saleValue, 0);
  const totalProfit = activeSales.reduce((sum, s) => sum + s.profit, 0);
  const totalMilesSold = activeSales.reduce((sum, s) => sum + s.milesUsed, 0);
  const margin = calcProfitMargin(totalProfit, totalRevenue);

  return (
    <div
      className={cn(
        "grid gap-4 grid-cols-1 sm:grid-cols-2 animate-appear animate-delay-300",
        className,
      )}
    >
      <MetricCard
        title="Faturamento Total"
        value={totalRevenue}
        icon={DollarSign}
        prefix="R$"
        variant="default"
      />
      <MetricCard
        title="Lucro Total"
        value={totalProfit}
        icon={TrendingUp}
        prefix="R$"
        variant="success"
      />
      <MetricCard
        title="Milhas Vendidas"
        value={totalMilesSold.toLocaleString("pt-BR")}
        icon={Target}
        variant="default"
      />
      <MetricCard
        title="Margem Média"
        value={`${margin.toFixed(1)}%`}
        icon={Percent}
        variant="teal"
      />
    </div>
  );
}
