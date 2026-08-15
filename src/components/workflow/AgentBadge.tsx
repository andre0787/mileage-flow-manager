/**
 * AgentBadge.tsx — P11-09 badge de execução de agente (inspeção).
 *
 * Extraído de WorkflowPipelineDag.tsx (rule-41 — hard limit de 150 linhas
 * por arquivo).
 */

import { cn } from "@/lib/utils";
import type { TelemetryEnvelope } from "@/ai/telemetry/envelope";
import { formatMs } from "./pipeline-definition";

export default function AgentBadge({ env }: { env: TelemetryEnvelope }) {
  const failed = env.eventType === "agent.failed";
  const cancelled = env.eventType === "agent.cancelled";
  return (
    <div
      className={cn(
        "rounded-lg border p-3 text-sm transition-colors",
        failed
          ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950"
          : cancelled
            ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950"
            : "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">{env.agentRole ?? "agente"}</span>
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {failed ? "FAILED" : cancelled ? "CANCELLED" : "SUCCESS"}
        </span>
      </div>
      <dl className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
        <div>
          <dt className="inline">Adapter:</dt>{" "}
          <dd className="inline font-medium text-foreground">{env.agentAdapter ?? "—"}</dd>
        </div>
        <div>
          <dt className="inline">Model:</dt>{" "}
          <dd className="inline font-medium text-foreground">{env.model ?? "—"}</dd>
        </div>
        <div>
          <dt className="inline">Dur:</dt>{" "}
          <dd className="inline font-medium text-foreground">{formatMs(env.durationMs)}</dd>
        </div>
        <div>
          <dt className="inline">Tokens:</dt>{" "}
          <dd className="inline font-medium text-foreground">
            {(env.inputTokens ?? 0) + (env.outputTokens ?? 0)}
          </dd>
        </div>
        <div>
          <dt className="inline">Tools:</dt>{" "}
          <dd className="inline font-medium text-foreground">{env.toolCalls ?? 0}</dd>
        </div>
        <div>
          <dt className="inline">Retries:</dt>{" "}
          <dd className="inline font-medium text-foreground">
            {Math.max(0, ((env as TelemetryEnvelope & { attempts?: number }).attempts ?? 1) - 1)}
          </dd>
        </div>
      </dl>
      {env.errorCode && <p className="mt-1 text-xs text-destructive">error: {env.errorCode}</p>}
    </div>
  );
}
