import { useState } from "react";
import KPICard from "./KPICard";
import KPIChart from "./KPIChart";
import KPITable from "./KPITable";
import KPIMonthSelector from "./KPIMonthSelector";

export interface MonthlyKPI {
  [key: string]: unknown;
  month: string;
  prePrPassRate: number;
  prePrTotal: number;
  prePrPass: number;
  prePrFail: number;
  testCoverageLibs: number | null;
  testCoverageComponents: number | null;
  gateActivations: { intent: number; twins: number; auth: number };
  avgOutcomeGrade: number | null;
  topViolations: Array<{ rule: string; count: number }>;
  avgCycleTimeHours: number | null;
  branchesMerged: number;
}

export interface KpiData {
  generatedAt: string;
  currentMonth: string;
  months: MonthlyKPI[];
}

function calcDelta(current: number, previous: number | null): number | null {
  if (previous === null || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export default function KPIDashboard({ data }: { data: KpiData }) {
  const [selectedMonth, setSelectedMonth] = useState(data.currentMonth);
  const current =
    data.months.find((m) => m.month === selectedMonth) ?? data.months[data.months.length - 1];
  const previous = data.months.length > 1 ? data.months[data.months.length - 2] : null;

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold font-display">📊 KPIs de Processo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Última atualização: {new Date(data.generatedAt).toLocaleString("pt-BR")}
          </p>
        </div>
        <KPIMonthSelector
          months={data.months}
          selected={selectedMonth}
          onChange={setSelectedMonth}
        />
      </div>

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
          data={data.months}
          dataKey="prePrPassRate"
          type="bar"
          unit="%"
        />
        <KPIChart
          title="📈 Cobertura de Testes (6 meses)"
          data={data.months}
          dataKey={["testCoverageLibs", "testCoverageComponents"]}
          type="line"
          unit="%"
          labels={["Libs", "Componentes"]}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <KPIChart
          title="🎯 Outcome Grade (6 meses)"
          data={data.months}
          dataKey="avgOutcomeGrade"
          type="line"
          unit="%"
        />
        <KPIChart
          title="🔐 Ativação de Gates (6 meses)"
          data={data.months}
          dataKey={["gateActivations.intent", "gateActivations.twins", "gateActivations.auth"]}
          type="bar"
          labels={["INTENT", "TWINS", "AUTH"]}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <KPITable
          title="⏱️ Tempo de Ciclo"
          headers={["Mês", "Média (horas)", "Branches"]}
          rows={data.months.map((m) => [
            m.month,
            m.avgCycleTimeHours !== null ? `${String(m.avgCycleTimeHours)}h` : "—",
            String(m.branchesMerged),
          ])}
        />
        <KPITable
          title="⚠️ Top Violações"
          headers={["Regra", "Falhas"]}
          rows={current.topViolations.map((v) => [v.rule, String(v.count)])}
        />
      </div>
    </div>
  );
}
