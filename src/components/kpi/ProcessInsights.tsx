import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { buildProcessInsights, type InsightSeverity } from "@/lib/processInsights";
import type { AiTelemetryAreaCost, DailyMetric, MonthlyKPI } from "@/types/kpi";

interface ProcessInsightsProps {
  daily: DailyMetric[];
  months: MonthlyKPI[];
  aiCosts?: AiTelemetryAreaCost[];
}

const DOT: Record<InsightSeverity, string> = {
  warn: "bg-warning",
  info: "bg-primary",
  ok: "bg-success",
};

/**
 * Insights Acionáveis — recomendações geradas da telemetria (violação top,
 * tendência da nota, falhas de pre-pr, custo de IA), cada uma com comando
 * de ação. Sem dados de negócio (lucro/margem) nesta seção.
 */
export function ProcessInsights({ daily, months, aiCosts }: ProcessInsightsProps) {
  const insights = useMemo(
    () => buildProcessInsights({ daily, months, aiCosts }),
    [daily, months, aiCosts],
  );

  return (
    <section className="space-y-3" aria-label="Insights acionáveis">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Processo · insights
        </span>
        <h2 className="text-lg font-bold text-foreground font-display md:text-xl">
          💡 Insights Acionáveis
        </h2>
      </div>

      {insights.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-card px-4 py-8 text-center">
          <span className="text-3xl opacity-40">💡</span>
          <p className="text-sm font-semibold text-foreground">Sem insights ainda</p>
          <p className="max-w-[420px] text-xs text-muted-foreground">
            Os insights aparecem após as primeiras coletas de telemetria (pre-pr, quality gates e
            custo de IA).
          </p>
          <code className="mt-1 rounded bg-muted px-2 py-1 font-mono text-[11px] text-foreground">
            npm run data:refresh
          </code>
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {insights.map((insight) => (
            <li key={insight.id} className="flex flex-col gap-1.5 rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", DOT[insight.severity])} />
                <p className="text-sm font-bold text-foreground">{insight.title}</p>
              </div>
              <p className="text-xs text-muted-foreground">{insight.finding}</p>
              <p className="text-xs text-foreground">{insight.recommendation}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {insight.actionLabel}:
                </span>
                <code className="rounded bg-muted px-2 py-1 font-mono text-[11px] text-foreground">
                  {insight.actionCommand}
                </code>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
