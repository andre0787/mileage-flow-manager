import { ArrowDownRight, ArrowUpRight, DollarSign, Target, TrendingUp, Wallet } from "lucide-react";
import { HeroStatCard, type HeroStatCardProps } from "@/components/dashboard/HeroStatCard";

interface HeroStatsProps {
  variant: "milhas" | "pontos";
  currentMetrics: {
    totalMiles: number;
    totalInvested: number;
    activeAccounts: number;
    totalSoldMiles: number;
    avgCostPerMile: number;
    avgProfitMargin: number;
    totalRevenue: number;
    monthlyMilesIn: number;
  };
  financialMetrics?: {
    avgProfitMargin: number;
    totalRevenue: number;
  };
}

export function HeroStats({ variant, currentMetrics, financialMetrics }: HeroStatsProps) {
  const stats: HeroStatCardProps[] =
    variant === "milhas"
      ? [
          {
            icon: ArrowUpRight,
            label: "Entradas no mês",
            value: { value: currentMetrics.monthlyMilesIn, prefix: "+" },
            iconColor: "text-success",
            valueColor: "text-success",
          },
          {
            icon: ArrowDownRight,
            label: "Milhas vendidas",
            value: { value: currentMetrics.totalSoldMiles },
            iconColor: "text-gold",
            valueColor: "text-gold",
          },
          {
            icon: DollarSign,
            label: "Custo médio/milha",
            value: { value: currentMetrics.avgCostPerMile, prefix: "R$ ", format: "fixed3" },
            iconColor: "text-teal",
            valueColor: "text-teal",
          },
          {
            icon: TrendingUp,
            label: "Contas ativas",
            value: { value: currentMetrics.activeAccounts },
            iconColor: "text-primary",
            valueColor: "text-primary",
          },
          {
            icon: Target,
            label: "Margem Média",
            value: { value: financialMetrics?.avgProfitMargin ?? 0, format: "percent1" },
            iconColor: "text-success",
            valueColor: "text-success",
            borderClass: "border-primary/20",
          },
          {
            icon: DollarSign,
            label: "Receita Total",
            value: { value: financialMetrics?.totalRevenue ?? 0, prefix: "R$ " },
            iconColor: "text-gold",
            valueColor: "text-gold",
            borderClass: "border-gold/20",
          },
        ]
      : [
          {
            icon: Wallet,
            label: "Total Investido",
            value: { value: currentMetrics.totalInvested, prefix: "R$ " },
            iconColor: "text-teal",
            valueColor: "text-teal",
          },
          {
            icon: DollarSign,
            label: "Custo médio/ponto",
            value: { value: currentMetrics.avgCostPerMile, prefix: "R$ ", format: "fixed3" },
            iconColor: "text-teal",
            valueColor: "text-teal",
          },
          {
            icon: TrendingUp,
            label: "Contas ativas",
            value: { value: currentMetrics.activeAccounts },
            iconColor: "text-primary",
            valueColor: "text-primary",
          },
        ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 mt-4 sm:mt-6">
      {stats.map((s) => (
        <HeroStatCard key={s.label} {...s} />
      ))}
    </div>
  );
}
