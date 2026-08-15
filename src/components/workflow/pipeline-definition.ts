/**
 * pipeline-definition.ts — P11-09 definição do DAG do pipeline real.
 *
 * Extraído de WorkflowPipelineDag.tsx (rule-41 — hard limit de 150 linhas
 * por arquivo).
 */

export interface PipelineNode {
  id: string;
  label: string;
  icon: string;
  description: string;
  /** Papéis de agente que pertencem a este node do pipeline. */
  roles: string[];
}

export const PIPELINE: PipelineNode[] = [
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

export function roleToNode(role: string): PipelineNode | undefined {
  return PIPELINE.find((n) => n.roles.includes(role));
}

export function formatMs(ms: number | undefined): string {
  if (ms === undefined) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
