import KPICard from "@/components/KPICard";
import KPIChart from "@/components/KPIChart";
import KPITable from "@/components/KPITable";
import type { MonthlyKPI } from "@/types/kpi";

function calcDelta(current: number, previous: number | null): number | null {
  if (previous === null || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

interface MonthlySectionProps {
  months: MonthlyKPI[];
  current: MonthlyKPI;
  previous: MonthlyKPI | null;
}

/**
 * MonthlySection — Evolução mensal (6 meses) do processo: taxa pre-pr,
 * cobertura, outcome grade, tempo de ciclo e ativação de gates.
 */
export function MonthlySection({ months, current, previous }: MonthlySectionProps) {
  return (
    <section className="space-y-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Mensal · 6 meses
      </span>
      <h2 className="text-lg md:text-xl font-bold text-foreground font-display">
        Evolução do processo
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Taxa Pre-Pr"
          value={`${current.prePrPassRate}%`}
          delta={calcDelta(current.prePrPassRate, previous?.prePrPassRate ?? null)}
          description={`${current.prePrPass} pass / ${current.prePrFail} fail`}
        />
        <KPICard
          label="Cobertura Libs"
          value={current.testCoverageLibs !== null ? `${current.testCoverageLibs}%` : "—"}
          delta={calcDelta(current.testCoverageLibs ?? 0, previous?.testCoverageLibs ?? null)}
        />
        <KPICard
          label="Cobertura Componentes"
          value={
            current.testCoverageComponents !== null ? `${current.testCoverageComponents}%` : "—"
          }
          delta={calcDelta(
            current.testCoverageComponents ?? 0,
            previous?.testCoverageComponents ?? null,
          )}
        />
        <KPICard
          label="Outcome Grade"
          value={current.avgOutcomeGrade !== null ? `${current.avgOutcomeGrade}%` : "—"}
          delta={calcDelta(current.avgOutcomeGrade ?? 0, previous?.avgOutcomeGrade ?? null)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <KPIChart
          title="📈 Taxa de Aprovação (6 meses)"
          data={months}
          dataKey="prePrPassRate"
          type="bar"
          unit="%"
        />
        <KPIChart
          title="📈 Cobertura de Testes (6 meses)"
          data={months}
          dataKey={["testCoverageLibs", "testCoverageComponents"]}
          type="line"
          unit="%"
          labels={["Libs", "Componentes"]}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <KPIChart
          title="🎯 Outcome Grade (6 meses)"
          data={months}
          dataKey="avgOutcomeGrade"
          type="line"
          unit="%"
        />
        <KPIChart
          title="🔐 Ativação de Gates (6 meses)"
          data={months}
          dataKey={["gateActivations.intent", "gateActivations.twins", "gateActivations.auth"]}
          type="bar"
          labels={["INTENT", "TWINS", "AUTH"]}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <KPITable
          title="⏱️ Tempo de Ciclo"
          headers={["Mês", "Média (horas)", "Branches"]}
          rows={months.map((m) => [
            m.month,
            m.avgCycleTimeHours !== null ? `${String(m.avgCycleTimeHours)}h` : "—",
            String(m.branchesMerged),
          ])}
        />
        <KPITable
          title="📈 Evolução da Taxa Pre-Pr"
          headers={["Mês", "Taxa", "Pass/Fail"]}
          rows={months.map((m) => [
            m.month,
            `${m.prePrPassRate}%`,
            `${m.prePrPass}/${m.prePrFail}`,
          ])}
        />
      </div>
    </section>
  );
}
