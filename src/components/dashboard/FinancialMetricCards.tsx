import { DollarSign, Target, TrendingUp, Wallet } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import type { DashboardMetrics, MetricHistory } from "@/lib/metrics";

interface FinancialMetricCardsProps {
  financialMetrics: DashboardMetrics;
  financialHistory: MetricHistory;
}

export function FinancialMetricCards({
  financialMetrics,
  financialHistory,
}: FinancialMetricCardsProps) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 animate-appear animate-delay-200">
      <MetricCard
        title="Total Investido"
        value={financialMetrics.totalInvested}
        subtitle="Capital aplicado"
        icon={Wallet}
        variant="gold"
        prefix="R$"
        trend={{
          value: Math.round(financialMetrics.revenueChange),
          isPositive: financialMetrics.revenueChange >= 0,
        }}
        sparklineData={financialHistory.revenue}
      />
      <MetricCard
        title="Faturamento Mensal"
        value={financialMetrics.monthlyRevenue}
        subtitle="Receita do mês"
        icon={DollarSign}
        variant="success"
        prefix="R$"
        sparklineData={financialHistory.revenue}
      />
      <MetricCard
        title="Lucro Mensal"
        value={financialMetrics.monthlyProfit}
        subtitle="Ganho líquido"
        icon={TrendingUp}
        variant="teal"
        prefix="R$"
        sparklineData={financialHistory.profit}
      />
      <MetricCard
        title="Margem de Lucro"
        value={`${financialMetrics.avgProfitMargin.toFixed(1)}%`}
        subtitle="Sobre receita total"
        icon={Target}
        variant="default"
        sparklineData={financialHistory.profit}
      />
    </div>
  );
}
