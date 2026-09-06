import { useMemo, useState } from "react";
import KPIChart from "@/components/KPIChart";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import type { DailyMetric } from "@/types/kpi";

interface ProcessDailySectionProps {
  daily: DailyMetric[];
}

const WINDOWS = [7, 14, 30] as const;

/**
 * ProcessDailySection — Radar diário do workflow: série da taxa de pre-pr e
 * da fricção (violações × auto-correções), com seletor de janela 7/14/30 dias.
 */
export function ProcessDailySection({ daily }: ProcessDailySectionProps) {
  const [windowDays, setWindowDays] = useState<(typeof WINDOWS)[number]>(14);
  if (daily.length === 0) {
    return (
      <section className="space-y-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Processo · série diária
          </span>
          <h2 className="text-lg font-bold text-foreground font-display md:text-xl">
            Radar do workflow
          </h2>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-card px-4 py-8 text-center">
          <span className="text-3xl opacity-40">📭</span>
          <p className="text-sm font-semibold text-foreground">Sem série diária ainda</p>
          <p className="max-w-[420px] text-xs text-muted-foreground">
            O radar começa a acumular a partir da primeira coleta — gere os dados para ver a taxa de
            pre-pr e a fricção por dia.
          </p>
          <code className="mt-1 rounded bg-muted px-2 py-1 font-mono text-[11px] text-foreground">
            npm run data:refresh
          </code>
        </div>
      </section>
    );
  }
  const today = daily[daily.length - 1];
  const windowData = useMemo(() => daily.slice(-windowDays), [daily, windowDays]);

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Processo · série diária
          </span>
          <h2 className="text-lg font-bold text-foreground font-display md:text-xl">
            Radar do workflow
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {today && (
            <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-primary">
                hoje: <AnimatedNumber value={today.prePrTotal} /> pre-pr ·{" "}
                <AnimatedNumber value={today.merges} /> merges
              </span>
              <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-destructive">
                <AnimatedNumber value={today.ruleFails} /> violações
              </span>
              <span className="rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-success">
                <AnimatedNumber value={today.healed} /> auto-correções
              </span>
            </div>
          )}
          <div className="flex rounded-full border border-border bg-muted/40 p-0.5">
            {WINDOWS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWindowDays(w)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors",
                  windowDays === w
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {w}d
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <KPIChart
          title="📡 Taxa de pre-pr por dia"
          data={windowData}
          dataKey="prePrPassRate"
          type="line"
          unit="%"
          xKey="label"
        />
        <KPIChart
          title="🛡️ Fricção: violações × auto-correções"
          data={windowData}
          dataKey={["ruleFails", "healed"]}
          type="bar"
          labels={["violações", "healed"]}
          xKey="label"
        />
      </div>
    </section>
  );
}
