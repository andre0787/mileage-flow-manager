import { Badge } from "@/components/ui/badge";

interface WorkflowEmptyStateProps {
  title: string;
  message: string;
  /** Comando de ação exibido como código copiável (ex: npm run data:refresh). */
  actionCommand?: string;
  actionHint?: string;
}

/**
 * Estado vazio/acionável compartilhado das seções de telemetria (Workflow).
 * Usado quando não há dados reais — nunca exibe zeros como se fossem métricas.
 */
export function WorkflowEmptyState({
  title,
  message,
  actionCommand,
  actionHint,
}: WorkflowEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-card px-4 py-8 text-center">
      <span className="text-3xl opacity-40">📭</span>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="max-w-[420px] text-xs text-muted-foreground">{message}</p>
      {actionCommand && (
        <div className="mt-1 flex flex-col items-center gap-1">
          <code className="rounded bg-muted px-2 py-1 font-mono text-[11px] text-foreground">
            {actionCommand}
          </code>
          {actionHint && <p className="text-[11px] text-muted-foreground">{actionHint}</p>}
        </div>
      )}
    </div>
  );
}

/** Badge visível quando os números exibidos são ilustrativos, não reais. */
export function IllustrativeBadge() {
  return (
    <Badge variant="outline" title="Estes números são um exemplo estático, não a telemetria real">
      Dados ilustrativos
    </Badge>
  );
}
