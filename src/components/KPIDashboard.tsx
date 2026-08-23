import { useMemo, useState } from "react";
import KPIMonthSelector from "./KPIMonthSelector";
import GateEfficiencySection from "./GateEfficiencySection";

import { BusinessPanel } from "./kpi/BusinessPanel";
import { BusinessBreakdown } from "./kpi/BusinessBreakdown";
import { ProcessDailySection } from "./kpi/ProcessDailySection";
import { ProcessAlerts } from "./kpi/ProcessAlerts";
import { MonthlySection } from "./kpi/MonthlySection";
import { PrsPanel } from "./kpi/PrsPanel";
import { AiCostSection } from "./kpi/AiCostSection";
import AiEngineeringCommandCenter from "./kpi/AiEngineeringCommandCenter";
import type { TelemetryEnvelope } from "@/ai/telemetry/envelope";
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
  const chips: Array<{ label: string; value: string; warn?: boolean }> = [
    ...(today
      ? [
          {
            label: "hoje",
            value: `${today.prePrTotal} pre-pr · ${today.merges} merges`,
            warn: today.ruleFails > 10,
          },
        ]
      : []),
    { label: "30d taxa pre-pr", value: s.prePrPassRate !== null ? `${s.prePrPassRate}%` : "—" },
    { label: "30d violações", value: String(s.violations), warn: s.violations > 0 },
    { label: "30d auto-correções", value: String(s.healed) },
    { label: "30d merges", value: String(s.merges) },
    { label: "30d sessões", value: String(s.sessions) },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((c) => (
        <span
          key={c.label}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
            c.warn
              ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
              : "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
          )}
        >
          <span
            className={cn("h-1.5 w-1.5 rounded-full", c.warn ? "bg-amber-500" : "bg-emerald-500")}
          />
          {c.label}: {c.value}
        </span>
      ))}
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

      <AiCostSection records={data.telemetry} />

      {/* P11-08: AI Engineering Command Center — telemetria de agentes §19.
       * Consome envelopes (exec:run:real grava em docs/tracking/envelopes.jsonl);
       * quando o feed ainda não está conectado, renderiza vazio (fail-open). */}
      <AiEngineeringCommandCenter
        envelopes={(data.telemetry as unknown as TelemetryEnvelope[]) ?? []}
      />
    </div>
  );
}
