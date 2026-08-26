import { useMemo, useState } from "react";
import KPIMonthSelector from "./KPIMonthSelector";
import GateEfficiencySection from "./GateEfficiencySection";
import { AnimatedNumber } from "./AnimatedNumber";

import { BusinessPanel } from "./kpi/BusinessPanel";
import { BusinessBreakdown } from "./kpi/BusinessBreakdown";
import { ProcessDailySection } from "./kpi/ProcessDailySection";
import { ProcessAlerts } from "./kpi/ProcessAlerts";
import { MonthlySection } from "./kpi/MonthlySection";
import { PrsPanel } from "./kpi/PrsPanel";
import { AiCostSection } from "./kpi/AiCostSection";
import LiveAiEngineeringCommandCenter from "./kpi/LiveAiEngineeringCommandCenter";
import { useData } from "@/contexts/DataContext";
import { computeDashboardMetrics } from "@/lib/metrics";
import {
  computeDailyBusinessSeries,
  computeOwnersBreakdown,
  computeProgramsBreakdown,
} from "@/lib/businessSeries";
import { cn } from "@/lib/utils";
import type { KpiData } from "@/types/kpi";
const MAX_CPF_PER_OWNER = 22;
/* Série ao vivo do BusinessPanel; o seletor 7/14/30d usa o JSON nightly (até 30d). */
const LIVE_SERIES_DAYS = 14;

function LiveChips({ kpi }: { kpi: KpiData }) {
  const today = kpi.daily[kpi.daily.length - 1];
  const s = kpi.summary;
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
      {today && (
        <div className="flex flex-col bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
          <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider mb-1">Hoje (pre-pr / merge)</span>
          <span className="text-xl md:text-2xl font-bold font-display text-emerald-800 dark:text-emerald-300 tabular-nums tracking-tight">
            <AnimatedNumber value={today.prePrTotal} /> / <AnimatedNumber value={today.merges} />
          </span>
        </div>
      )}
      <div className="flex flex-col bg-muted/30 border border-border rounded-xl p-3">
        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Taxa Pre-PR 30d</span>
        <span className="text-xl md:text-2xl font-bold font-display text-foreground tabular-nums tracking-tight">
          {s.prePrPassRate !== null ? (
            <span className="inline-flex items-baseline"><AnimatedNumber value={s.prePrPassRate} />%</span>
          ) : (
            "—"
          )}
        </span>
      </div>
      <div className={`flex flex-col border rounded-xl p-3 ${s.violations > 0 ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" : "bg-muted/30 border-border"}`}>
        <span className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${s.violations > 0 ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"}`}>Violações 30d</span>
        <span className={`text-xl md:text-2xl font-bold font-display tabular-nums tracking-tight ${s.violations > 0 ? "text-amber-800 dark:text-amber-300" : "text-foreground"}`}>
          <AnimatedNumber value={s.violations} />
        </span>
      </div>
      <div className="flex flex-col bg-muted/30 border border-border rounded-xl p-3">
        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Auto-correções 30d</span>
        <span className="text-xl md:text-2xl font-bold font-display text-foreground tabular-nums tracking-tight">
          <AnimatedNumber value={s.healed} />
        </span>
      </div>
      <div className="flex flex-col bg-muted/30 border border-border rounded-xl p-3">
        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Merges 30d</span>
        <span className="text-xl md:text-2xl font-bold font-display text-foreground tabular-nums tracking-tight">
          <AnimatedNumber value={s.merges} />
        </span>
      </div>
      <div className="flex flex-col bg-muted/30 border border-border rounded-xl p-3">
        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Sessões 30d</span>
        <span className="text-xl md:text-2xl font-bold font-display text-foreground tabular-nums tracking-tight">
          <AnimatedNumber value={s.sessions} />
        </span>
      </div>
    </div>
  );
}

/* KPIDashboard — "Datadog interno": produto & negócio (ao vivo), radar diário do
 * processo, entregas recentes, mensal + gates + router. */
export default function KPIDashboard({ data }: { data: KpiData }) {
  const { owners, accounts, programs, sales, entries, isLoading } = useData();
  const [selectedMonth, setSelectedMonth] = useState(data.currentMonth);
  const current =
    data.months.find((m) => m.month === selectedMonth) ?? data.months[data.months.length - 1];
  const previous = data.months.length > 1 ? data.months[data.months.length - 2] : null;

  const metrics = useMemo(
    () => computeDashboardMetrics(accounts, sales, entries, owners, MAX_CPF_PER_OWNER),
    [accounts, sales, entries, owners],
  );
  const dailyBusiness = useMemo(
    () => computeDailyBusinessSeries(sales, entries, LIVE_SERIES_DAYS),
    [sales, entries],
  );
  const ownersBreakdown = useMemo(
    () => computeOwnersBreakdown(owners, accounts, sales),
    [owners, accounts, sales],
  );
  const programsBreakdown = useMemo(
    () => computeProgramsBreakdown(programs, accounts),
    [programs, accounts],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-display text-2xl font-bold">📊 Datadog interno</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Processo · Produto · Negócio — atualizado em{" "}
              {new Date(data.generatedAt).toLocaleString("pt-BR")} (nightly automático)
            </p>
          </div>
          <KPIMonthSelector
            months={data.months}
            selected={selectedMonth}
            onChange={setSelectedMonth}
          />
        </div>
        <LiveChips kpi={data} />
      </header>

      <ProcessAlerts daily={data.daily} summary={data.summary} />

      {!isLoading && <BusinessPanel metrics={metrics} daily={dailyBusiness} />}

      {!isLoading && (
        <BusinessBreakdown
          owners={ownersBreakdown}
          programs={programsBreakdown}
          ownerColorsByName={Object.fromEntries(owners.map((o) => [o.name, o.color ?? null]))}
        />
      )}

      <ProcessDailySection daily={data.daily} />

      <PrsPanel prs={data.prs} />

      <MonthlySection months={data.months} current={current} previous={previous} />

      <GateEfficiencySection
        violationsCaught={current.violationsCaught}
        healedRate={current.healedRate}
        frictionPerPass={current.frictionPerPass}
        topViolations={current.topViolations}
        healedByRule={current.healedByRule}
        gateBlockedByRule={current.gateBlockedByRule}
      />

      <AiCostSection />

      {/* P11-08: AI Engineering Command Center — telemetria de agentes §19. */}
      <LiveAiEngineeringCommandCenter />
    </div>
  );
}
