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
 * Definição/painéis vivem em arquivos próprios (rule-41 — hard limit de
 * 150 linhas por arquivo).
 */

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { TelemetryEnvelope } from "@/ai/telemetry/envelope";
import PipelineNodeInspector from "./PipelineNodeInspector";
import PipelineTimeline from "./PipelineTimeline";
import { PIPELINE, roleToNode } from "./pipeline-definition";

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
          <PipelineNodeInspector
            nodeId={selected}
            envelopes={byNode.get(selected) ?? []}
            decisions={decisions}
          />
        </div>
      )}

      {/* Timeline compacta */}
      <PipelineTimeline envelopes={envelopes} />
    </div>
  );
}
