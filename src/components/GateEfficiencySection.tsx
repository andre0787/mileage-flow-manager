import KPICard from "./KPICard";
import KPITable from "./KPITable";

/**
 * GateEfficiencySection — KPIs de eficiência dos gates de processo.
 * Mostra quantas violações os gates pegaram, taxa de auto-correção (healed)
 * e fricção média por entrega. Dados vêm do kpi-report.mjs.
 */
export interface GateEfficiencyProps {
  violationsCaught: number;
  healedRate: number | null;
  frictionPerPass: number | null;
  topViolations: Array<{ rule: string; count: number }>;
  healedByRule: Record<string, number>;
  gateBlockedByRule: Record<string, number>;
}

export default function GateEfficiencySection({
  violationsCaught,
  healedRate,
  frictionPerPass,
  topViolations,
  healedByRule,
  gateBlockedByRule,
}: GateEfficiencyProps) {
  const totalHealed = Object.values(healedByRule).reduce((a, b) => a + b, 0);
  const totalBlocked = Object.values(gateBlockedByRule).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold font-display">🛡️ Eficiência dos Gates</h2>
        <p className="text-sm text-muted-foreground">
          Problemas pegos pelo processo antes de chegar à produção.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Violações pegas"
          value={String(violationsCaught)}
          description="bloqueadas antes do PR (rule:fail)"
        />
        <KPICard
          label="Auto-correção"
          value={healedRate !== null ? `${healedRate}%` : "—"}
          description={`${totalHealed} healed no mês`}
        />
        <KPICard
          label="Fricção por entrega"
          value={frictionPerPass !== null ? `${frictionPerPass} violações/pre-pr` : "—"}
          description="custo médio até o pre-pr passar"
        />
        <KPICard
          label="Gates bloqueados"
          value={String(totalBlocked)}
          description="decisão humana exigida (AUTH/council)"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <KPITable
          title="⚠️ Top Violações"
          headers={["Regra", "Falhas"]}
          rows={topViolations.map((v) => [v.rule, String(v.count)])}
        />
        <KPITable
          title="🔧 Auto-correções por regra"
          headers={["Regra", "Healed"]}
          rows={Object.entries(healedByRule).map(([rule, count]) => [rule, String(count)])}
        />
      </div>
    </div>
  );
}
