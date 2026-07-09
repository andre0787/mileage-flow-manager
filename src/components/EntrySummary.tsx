import { TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react"
import { MetricCard } from "@/components/MetricCard"

interface EntrySummaryProps {
  type: "pontos" | "milhas"
  totalAmount: number
  totalAmountPaid: number
  totalMilesGenerated: number
  averageCostPerMile: number
}

export function EntrySummary({
  type,
  totalAmount,
  totalAmountPaid,
  totalMilesGenerated,
  averageCostPerMile,
}: EntrySummaryProps) {
  const label = type === "pontos" ? "Pontos" : "Milhas"

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 animate-appear animate-delay-200">
      <MetricCard
        title={`Total de ${label}`}
        value={totalAmount.toLocaleString("pt-BR")}
        icon={type === "pontos" ? TrendingUp : TrendingDown}
        variant="default"
      />
      <MetricCard
        title="Valor Investido"
        value={totalAmountPaid}
        icon={DollarSign}
        prefix="R$"
        variant="warning"
      />
      {type === "pontos" && (
        <MetricCard
          title="Milhas Geradas"
          value={totalMilesGenerated.toLocaleString("pt-BR")}
          icon={Target}
          variant="success"
        />
      )}
      <MetricCard
        title="Custo Médio/Milha"
        value={averageCostPerMile}
        icon={TrendingDown}
        prefix="R$"
        variant="teal"
      />
    </div>
  )
}
