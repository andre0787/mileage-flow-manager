import { AnimatedNumber } from "./AnimatedNumber";
import type { KpiData } from "@/types/kpi";

function LiveChips({ kpi }: { kpi: KpiData }) {
  const today = kpi.daily[kpi.daily.length - 1];
  const s = kpi.summary;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
      {today && (
        <div className="flex flex-col bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
          <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider mb-1">
            Hoje (pre-pr / merge)
          </span>
          <span className="text-xl md:text-2xl font-bold font-display text-emerald-800 dark:text-emerald-300 tabular-nums tracking-tight">
            <AnimatedNumber value={today.prePrTotal} /> / <AnimatedNumber value={today.merges} />
          </span>
        </div>
      )}
      <div className="flex flex-col bg-muted/30 border border-border rounded-xl p-3">
        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
          Taxa Pre-PR 30d
        </span>
        <span className="text-xl md:text-2xl font-bold font-display text-foreground tabular-nums tracking-tight">
          {s.prePrPassRate !== null ? (
            <span className="inline-flex items-baseline">
              <AnimatedNumber value={s.prePrPassRate} />%
            </span>
          ) : (
            "—"
          )}
        </span>
      </div>
      <div
        className={`flex flex-col border rounded-xl p-3 ${s.violations > 0 ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" : "bg-muted/30 border-border"}`}
      >
        <span
          className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${s.violations > 0 ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"}`}
        >
          Violações 30d
        </span>
        <span
          className={`text-xl md:text-2xl font-bold font-display tabular-nums tracking-tight ${s.violations > 0 ? "text-amber-800 dark:text-amber-300" : "text-foreground"}`}
        >
          <AnimatedNumber value={s.violations} />
        </span>
      </div>
      <div className="flex flex-col bg-muted/30 border border-border rounded-xl p-3">
        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
          Auto-correções 30d
        </span>
        <span className="text-xl md:text-2xl font-bold font-display text-foreground tabular-nums tracking-tight">
          <AnimatedNumber value={s.healed} />
        </span>
      </div>
      <div className="flex flex-col bg-muted/30 border border-border rounded-xl p-3">
        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
          Merges 30d
        </span>
        <span className="text-xl md:text-2xl font-bold font-display text-foreground tabular-nums tracking-tight">
          <AnimatedNumber value={s.merges} />
        </span>
      </div>
      <div className="flex flex-col bg-muted/30 border border-border rounded-xl p-3">
        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
          Sessões 30d
        </span>
        <span className="text-xl md:text-2xl font-bold font-display text-foreground tabular-nums tracking-tight">
          <AnimatedNumber value={s.sessions} />
        </span>
      </div>
    </div>
  );
}
export { LiveChips };
