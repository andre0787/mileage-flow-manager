import { AlertTriangle, CreditCard, Target } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import type { DashboardMetrics, MetricHistory } from "@/lib/metrics";

interface DashboardSecondaryMetricsProps {
  metrics: DashboardMetrics;
  metricHistory?: MetricHistory;
  variant: "milhas" | "pontos";
}

export function DashboardSecondaryMetrics({
  metrics,
  metricHistory,
  variant,
}: DashboardSecondaryMetricsProps) {
  if (variant === "pontos") {
    return (
      <div className="animate-appear animate-delay-800">
        <MetricCard
          title="Contas Ativas (Pontos)"
          value={metrics.activeAccounts}
          subtitle="Contas de pontos operacionais"
          icon={CreditCard}
          variant="teal"
        />
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 animate-appear animate-delay-800">
      <MetricCard
        title="Contas Ativas"
        value={metrics.activeAccounts}
        subtitle="Contas operacionais"
        icon={CreditCard}
        variant="teal"
        sparklineData={metricHistory?.milesIn}
      />
      <MetricCard
        title="Vendas Pendentes"
        value={metrics.pendingSales}
        subtitle="Aguardando processamento"
        icon={Target}
        variant="default"
      />
      <MetricCard
        title="Alertas CPF"
        value={metrics.cpfAlerts}
        subtitle="Próximo ao limite"
        icon={AlertTriangle}
        variant="warning"
      />
    </div>
  );
}
