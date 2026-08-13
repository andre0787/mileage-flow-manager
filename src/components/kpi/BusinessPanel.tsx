import {
  Wallet,
  DollarSign,
  TrendingUp,
  Target,
  CreditCard,
  Coins,
  AlertTriangle,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import type { DashboardMetrics } from "@/lib/metrics";
import type { DailyBusinessPoint } from "@/lib/businessSeries";

interface BusinessPanelProps {
  metrics: DashboardMetrics;
  daily: DailyBusinessPoint[];
}

/**
 * BusinessPanel — "Saúde do negócio": métricas de produto/negócio ao vivo
 * (fonte: dados do app) com sparklines dos últimos 14 dias.
 */
export function BusinessPanel({ metrics, daily }: BusinessPanelProps) {
  const revenueSpark = daily.map((d) => d.revenue);
  const profitSpark = daily.map((d) => d.profit);
  const milesInSpark = daily.map((d) => d.milesIn);

  return (
    <section className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Produto & Negócio
          </span>
          <h2 className="text-lg md:text-xl font-bold text-foreground font-display">
            Saúde do negócio
          </h2>
        </div>
        <span className="text-[11px] text-muted-foreground">
          dados ao vivo do app · sparklines de 14 dias
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          title="Estoque de milhas"
          value={metrics.totalMiles}
          subtitle="milhas disponíveis"
          icon={Coins}
          variant="teal"
          sparklineData={milesInSpark}
        />
        <MetricCard
          title="Total investido"
          value={metrics.totalInvested}
          subtitle="capital aplicado"
          icon={Wallet}
          variant="gold"
          prefix="R$"
        />
        <MetricCard
          title="Receita do mês"
          value={metrics.monthlyRevenue}
          subtitle="vendas do mês"
          icon={DollarSign}
          variant="success"
          prefix="R$"
          sparklineData={revenueSpark}
        />
        <MetricCard
          title="Lucro do mês"
          value={metrics.monthlyProfit}
          subtitle="ganho líquido"
          icon={TrendingUp}
          variant="teal"
          prefix="R$"
          sparklineData={profitSpark}
        />
        <MetricCard
          title="Margem média"
          value={`${metrics.avgProfitMargin.toFixed(1)}%`}
          subtitle="sobre receita total"
          icon={Target}
          variant="default"
        />
        <MetricCard
          title="Vendas pendentes"
          value={metrics.pendingSales}
          subtitle="aguardando processamento"
          icon={CreditCard}
          variant="warning"
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-warning" />
          <b className="text-foreground">{metrics.cpfAlerts}</b> dono(s) próximo(s) do limite de CPF
        </span>
        <span>
          <b className="text-foreground">{metrics.activeAccounts}</b> contas ativas ·{" "}
          <b className="text-foreground">R$ {metrics.avgCostPerMile.toFixed(4)}</b>/milha custo
          médio
        </span>
      </div>
    </section>
  );
}
