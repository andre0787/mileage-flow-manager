import KPIChart from "@/components/KPIChart";
import type { DailyMetric } from "@/types/kpi";

interface ProcessDailySectionProps {
  daily: DailyMetric[];
}

/**
 * ProcessDailySection — Radar diário do workflow: série de 14 dias da taxa
 * de pre-pr e da fricção (violações × auto-correções). O "Datadog interno"
 * do processo de entrega.
 */
export function ProcessDailySection({ daily }: ProcessDailySectionProps) {
  const today = daily[daily.length - 1];

  return (
    <section className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Processo · 14 dias
          </span>
          <h2 className="text-lg md:text-xl font-bold text-foreground font-display">
            Radar do workflow
          </h2>
        </div>
        {today && (
          <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-primary">
              hoje: {today.prePrTotal} pre-pr · {today.merges} merges
            </span>
            <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-destructive">
              {today.ruleFails} violações
            </span>
            <span className="rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-success">
              {today.healed} auto-correções
            </span>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <KPIChart
          title="📡 Taxa de pre-pr por dia"
          data={daily}
          dataKey="prePrPassRate"
          type="line"
          unit="%"
          xKey="label"
        />
        <KPIChart
          title="🛡️ Fricção: violações × auto-correções"
          data={daily}
          dataKey={["ruleFails", "healed"]}
          type="bar"
          labels={["violações", "healed"]}
          xKey="label"
        />
      </div>
    </section>
  );
}
