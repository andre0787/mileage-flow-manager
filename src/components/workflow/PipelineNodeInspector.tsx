/**
 * PipelineNodeInspector.tsx — P11-09 inspeção de node + Why?.
 *
 * Extraído de WorkflowPipelineDag.tsx (rule-41 — hard limit de 150 linhas
 * por arquivo).
 */

import type { TelemetryEnvelope } from "@/ai/telemetry/envelope";
import AgentBadge from "./AgentBadge";
import { PIPELINE } from "./pipeline-definition";

interface Props {
  nodeId: string;
  /** Envelopes já agrupados para este node (vazio = fail-open). */
  envelopes: TelemetryEnvelope[];
  /** Decisões explicáveis (P11-05) — why_run/why_skip/why_parallel etc. */
  decisions?: Array<{ why: string; reason: string; role?: string }>;
}

export default function PipelineNodeInspector({ nodeId, envelopes, decisions = [] }: Props) {
  const node = PIPELINE.find((n) => n.id === nodeId);
  if (!node) return null;
  const why = decisions.filter((d) => {
    const role = d.role;
    return !role || node.roles.includes(role);
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xl">{node.icon}</span>
        <h4 className="font-display text-sm font-semibold">{node.label} — inspeção</h4>
      </div>

      {why.length > 0 && (
        <div className="rounded-lg border bg-muted/40 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Why?
          </div>
          <ul className="mt-1 space-y-1 text-sm">
            {why.map((d, i) => (
              <li key={i}>
                <span className="font-medium text-foreground">{d.why}</span>:{" "}
                <span className="text-muted-foreground">{d.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {envelopes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Sem execução registrada neste node (fail-open).
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {envelopes.map((env) => (
            <AgentBadge key={env.eventId} env={env} />
          ))}
        </div>
      )}
    </div>
  );
}
