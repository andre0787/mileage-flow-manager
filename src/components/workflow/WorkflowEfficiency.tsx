import { useWorkflowMetrics } from "@/hooks/useWorkflowMetrics";
import { isIllustrativeData } from "@/lib/workflowData";
import { EfficiencyStats } from "@/components/workflow/EfficiencyStats";
import { WorkflowEmptyState } from "@/components/workflow/WorkflowEmptyState";

/**
 * WorkflowEfficiency — "Os gates estão pegando bugs?" Dados REAIS dos
 * últimos 30 dias (via /workflow-data.json) com fallback ilustrativo.
 *
 * Quando só há fallback (generatedAt em epoch), exibe estado vazio acionável
 * em vez de zeros que pareceriam métricas reais.
 */
export function WorkflowEfficiency() {
  const { workflow } = useWorkflowMetrics();
  const data = workflow ?? {
    generatedAt: new Date(0).toISOString(),
    dataDate: "—",
    gateEfficiency: {
      ruleFails: 0,
      healed: 0,
      healedRate: 0,
      prePrTotal: 0,
      prePrPass: 0,
      prePrPassRate: 0,
      gateBlocked: 0,
      topViolations: [],
    },
  };
  const illustrative = isIllustrativeData(data.generatedAt);

  return (
    <div className="space-y-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Eficiência real
      </span>
      <h2 className="text-xl font-bold text-foreground font-display md:text-2xl">
        Os gates estão pegando bugs?
      </h2>
      <p className="text-sm text-muted-foreground max-w-3xl">
        Números <b className="text-foreground">reais</b> do repositório (últimos 30 dias, em{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{data.dataDate}</code>) —
        cada violação de regra é um problema <b className="text-foreground">pego antes do PR</b>,
        não em produção:
      </p>

      {illustrative ? (
        <WorkflowEmptyState
          title="Sem telemetria de gates ainda"
          message="O JSON de telemetria ainda não foi gerado — os zeros abaixo seriam ilustrativos, não medições. Gere os dados reais para ver a eficiência dos gates."
          actionCommand="npm run data:refresh"
          actionHint="ou aguarde o nightly gerar /workflow-data.json"
        />
      ) : (
        <EfficiencyStats gateEfficiency={data.gateEfficiency} />
      )}
    </div>
  );
}
