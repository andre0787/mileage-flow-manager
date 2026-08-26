import { Card, CardContent } from "@/components/ui/card";
import { useWorkflowData } from "@/lib/workflowData";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import type { RepoFacts } from "@/types/kpi";

const FACT_LABELS: Array<[keyof RepoFacts, string]> = [
  ["components", "Componentes"],
  ["pages", "Páginas"],
  ["libs", "Libs"],
  ["scripts", "Scripts"],
  ["testFiles", "Arquivos de teste"],
  ["skills", "Skills"],
  ["rules", "Regras"],
  ["events", "Eventos rastreados"],
  ["qualityNotes", "Notas de qualidade"],
];

/**
 * WorkflowOverview — "MilesControl em números": visão geral do projeto com
 * fatos reais do repositório e as últimas entregas em produção.
 */
export function WorkflowOverview() {
  const data = useWorkflowData();
  const { overview, lastPrs } = data;
  const hasFacts = overview.components > 0;

  return (
    <div className="space-y-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Visão geral do projeto
      </span>
      <h2 className="text-xl md:text-2xl font-bold text-foreground font-display">
        MilesControl em números
      </h2>

      {hasFacts ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {FACT_LABELS.map(([key, label]) => (
            <Card key={key}>
              <CardContent className="p-3 text-center">
                <div className="text-[2rem] font-extrabold text-primary font-display tabular-nums tracking-tight">
                  <AnimatedNumber value={overview[key]} />
                </div>
                <div className="text-[12px] uppercase tracking-wider font-semibold text-muted-foreground mt-1">
                  {label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Fatos do repositório indisponíveis — rode{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
            npm run data:refresh
          </code>{" "}
          para gerá-los.
        </p>
      )}

      {lastPrs.length > 0 && (
        <div className="overflow-hidden rounded-xl border bg-card divide-y divide-border">
          <div className="px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-foreground">
            🚀 Últimas entregas em produção
          </div>
          {lastPrs.map((pr) => (
            <div key={pr.number} className="flex items-center gap-3 px-4 py-2.5">
              <span className="shrink-0 font-mono text-[11px] font-bold text-primary">
                #{pr.number}
              </span>
              <span className="min-w-0 truncate text-[12.5px] text-foreground" title={pr.title}>
                {pr.title}
              </span>
              <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">{pr.date}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
