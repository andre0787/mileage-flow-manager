/**
 * WorkflowPipelineDag.tsx — P11-09 Workflow Observability UI.
 *
 * Representa o workflow REAL como DAG/timeline:
 *   TASK → CLASSIFIER → GRAPH → PLANNER → AGENTS → TOOLS → VALIDATOR → RESULT
 *
 * Cada node permite inspeção (adapter, role, model, duração, tokens, tool
 * calls, retries, status) e responde "Why?" — por que rodou / por que foi
 * pulado / por que esse modelo / por que paralelo (P11-05 explainability).
 *
 * Fail-open: sem envelopes, renderiza o pipeline estrutural com status
 * "sem dados" (o fluxo ainda é visível).
 */

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { TelemetryEnvelope } from "@/ai/telemetry/envelope";

interface PipelineNode {
  id: string;
  label: string;
  icon: string;
  description: string;
  /** Papéis de agente que pertencem a este node do pipeline. */
  roles: string[];
}

const PIPELINE: PipelineNode[] = [
  { id: "task", label: "TASK", icon: "🎯", description: "Entrada: intent + contrato", roles: [] },
  {
    id: "classifier",
    label: "CLASSIFIER",
    icon: "🏷️",
    description: "tiny/small/medium/large (P11-05)",
    roles: [],
  },
  {
    id: "graph",
    label: "GRAPH",
    icon: "🕸️",
    description: "impacto, contexto, freshness",
    roles: ["graph-scout", "domain-scout", "test-scout", "history-scout"],
  },
  {
    id: "planner",
    label: "PLANNER",
    icon: "🗺️",
    description: "capability-driven + budget",
    roles: ["architect"],
  },
  {
    id: "agents",
    label: "AGENTS",
    icon: "🤖",
    description: "implementer · tester · reviewer",
    roles: ["implementer", "tester", "reviewer", "security-reviewer", "performance-reviewer"],
  },
  {
    id: "tools",
    label: "TOOLS",
    icon: "🛠️",
    description: "CLI bridge, typecheck, lint",
    roles: [],
  },
  {
    id: "validator",
    label: "VALIDATOR",
    icon: "🧪",
    description: "final validation + telemetry",
    roles: ["final-validator"],
  },
  { id: "result", label: "RESULT", icon: "✅", description: "outcome + envelopes §19", roles: [] },
];

function roleToNode(role: string): PipelineNode | undefined {
  return PIPELINE.find((n) => n.roles.includes(role));
}

function formatMs(ms: number | undefined): string {
  if (ms === undefined) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function AgentBadge({ env }: { env: TelemetryEnvelope }) {
  const node = roleToNode(env.agentRole ?? "");
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

interface Props {
  envelopes: TelemetryEnvelope[];
  /** Decisões explicáveis (P11-05) — why_run/why_skip/why_parallel etc. */
  decisions?: Array<{ why: string; reason: string; role?: string }>;
}

export default function WorkflowPipelineDag({ envelopes, decisions = [] }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const byNode = useMemo(() => {
    const map = new Map<string, TelemetryEnvelope[]>();
    for (const env of envelopes) {
      const node = roleToNode(env.agentRole ?? "") ?? PIPELINE.find((n) => n.id === "agents");
      if (!node) continue;
      const list = map.get(node.id) ?? [];
      list.push(env);
      map.set(node.id, list);
    }
    return map;
  }, [envelopes]);

  const whyFor = (nodeId: string) =>
    decisions.filter((d) => {
      const role = d.role;
      const node = PIPELINE.find((n) => n.id === nodeId);
      return !role || node?.roles.includes(role);
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Pipeline real (DAG)</h3>
        <span className="text-xs text-muted-foreground">
          {envelopes.length} envelopes §19 · clique num node para inspecionar
        </span>
      </div>

      {/* DAG horizontal */}
      <div className="flex flex-wrap items-stretch gap-2">
        {PIPELINE.map((node, i) => {
          const envs = byNode.get(node.id) ?? [];
          const failed = envs.some((e) => e.eventType === "agent.failed");
          const active = envs.length > 0;
          const isSelected = selected === node.id;
          return (
            <div key={node.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelected(isSelected ? null : node.id)}
                className={cn(
                  "rounded-xl border p-3 text-left transition-colors min-w-[130px]",
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                    : active
                      ? failed
                        ? "border-red-300 bg-red-50 hover:border-red-400 dark:border-red-800 dark:bg-red-950"
                        : "border-emerald-300 bg-emerald-50 hover:border-emerald-400 dark:border-emerald-800 dark:bg-emerald-950"
                      : "border-muted bg-card hover:border-primary/30",
                )}
              >
                <div className="text-xl">{node.icon}</div>
                <div className="mt-1 text-sm font-semibold">{node.label}</div>
                <div className="text-[11px] text-muted-foreground">{node.description}</div>
                <div className="mt-1 text-[11px] font-medium">
                  {active ? `${envs.length} agente(s)` : "sem dados"}
                </div>
              </button>
              {i < PIPELINE.length - 1 && <span className="text-muted-foreground">→</span>}
            </div>
          );
        })}
      </div>

      {/* Inspeção do node selecionado */}
      {selected && (
        <div className="rounded-xl border bg-card p-4">
          {(() => {
            const node = PIPELINE.find((n) => n.id === selected)!;
            const envs = byNode.get(selected) ?? [];
            const why = whyFor(selected);
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

                {envs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Sem execução registrada neste node (fail-open).
                  </p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {envs.map((env) => (
                      <AgentBadge key={env.eventId} env={env} />
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Timeline compacta */}
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
    </div>
  );
}
