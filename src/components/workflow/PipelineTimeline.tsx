/**
 * PipelineTimeline.tsx — P11-09 timeline compacta de envelopes.
 *
 * Extraído de WorkflowPipelineDag.tsx (rule-41 — hard limit de 150 linhas
 * por arquivo).
 */

import type { TelemetryEnvelope } from "@/ai/telemetry/envelope";
import { formatMs } from "./pipeline-definition";

export default function PipelineTimeline({ envelopes }: { envelopes: TelemetryEnvelope[] }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <h4 className="font-display text-sm font-semibold mb-2">Timeline</h4>
      {envelopes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Sem eventos de execução. Rode{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run exec:run:real</code> para
          popular a telemetria.
        </p>
      ) : (
        <ol className="space-y-1.5">
          {envelopes.map((env) => (
            <li key={env.eventId} className="flex items-center gap-2 text-sm">
              <span className="w-40 shrink-0 truncate text-xs text-muted-foreground">
                {env.eventType}
              </span>
              <span className="font-medium">{env.agentRole ?? "—"}</span>
              <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                {formatMs(env.durationMs)} · {env.model ?? "—"}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
