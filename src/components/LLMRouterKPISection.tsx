import KPICard from "./KPICard";
import KPITable from "./KPITable";
import type { RouterMonthlyKPI } from "@/types/kpi";

export type { RouterMonthlyKPI };

function formatPercent(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return `${value}%`;
}

export default function LLMRouterKPISection({ llmRouter }: { llmRouter: RouterMonthlyKPI }) {
  const hasData =
    llmRouter.resolved > 0 ||
    llmRouter.completed > 0 ||
    llmRouter.failed > 0 ||
    llmRouter.models.length > 0;

  if (!hasData) {
    return (
      <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        Sem dados do router neste período.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <KPICard
          label="Ativações do Router"
          value={String(llmRouter.resolved)}
          description={`${llmRouter.completed} concluída(s) · ${llmRouter.failed} falha(s)`}
        />
        <KPICard
          label="Uso de Fallback"
          value={formatPercent(llmRouter.fallbackRate)}
          description={`${llmRouter.fallbackUsed} rota(s) com fallback efetivo`}
        />
      </div>

      {llmRouter.unobserved > 0 && (
        <p className="text-sm text-muted-foreground">
          ⚠️ {llmRouter.unobserved} rota(s) sem conclusão observada
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <KPITable
          title="🤖 Modelos Efetivos"
          headers={["Modelo", "Taxa de Conclusão"]}
          rows={llmRouter.models.map((model) => [model, formatPercent(llmRouter.completionRate)])}
        />
        <KPITable
          title="🧠 Skills por Modelo"
          headers={["Skill", "Modelo"]}
          rows={llmRouter.skillsByModel.map((row) => [row.skill, row.model])}
        />
      </div>
    </div>
  );
}
