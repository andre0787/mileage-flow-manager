/**
 * failure-taxonomy.ts — Failure Taxonomy (P11-02 Execution Reliability).
 *
 * Classifica qualquer falha em 14 categorias (spec §P11-02), priorizando o
 * errorCode sobre a fase. Usada para: telemetria consistente, decisão de
 * retry e diagnóstico de bottlenecks.
 */

/** Categorias de falha (spec P11-02 — failure taxonomy). */
export type FailureCategory =
  | "planning_failure"
  | "scheduling_failure"
  | "adapter_failure"
  | "agent_failure"
  | "model_failure"
  | "tool_failure"
  | "context_failure"
  | "graph_failure"
  | "budget_failure"
  | "validation_failure"
  | "test_failure"
  | "timeout"
  | "cancellation"
  | "infrastructure_failure";

/** Fase em que a falha ocorreu — fallback quando o errorCode é ambíguo. */
export type FailurePhase =
  | "planning"
  | "scheduling"
  | "adapter"
  | "agent"
  | "model"
  | "tool"
  | "context"
  | "graph"
  | "validation"
  | "test"
  | "unknown";

const BUDGET_MARKERS = [
  "maxAgents",
  "maxParallel",
  "maxTokens",
  "maxCost",
  "maxDurationMs",
  "maxToolCalls",
  "maxTurns",
];

/**
 * Classifica uma falha em categoria. Ordem de prioridade:
 * 1. errorCode explícito (timeout/cancellation/budget/spawn)
 * 2. fase da falha
 * 3. default agent_failure
 */
export function classifyFailure(
  errorCode: string | null | undefined,
  phase: FailurePhase = "unknown",
): FailureCategory {
  const code = (errorCode ?? "").toLowerCase();
  if (code.includes("timeout")) return "timeout";
  if (code.includes("cancel")) return "cancellation";
  if (BUDGET_MARKERS.some((m) => code.includes(m.toLowerCase()))) return "budget_failure";
  if (code.startsWith("spawn:")) return "infrastructure_failure";
  if (code.startsWith("exit:")) {
    // Exit code sem contexto de fase: test_failure é o mais comum (suíte).
    if (phase === "test") return "test_failure";
    if (phase === "planning") return "planning_failure";
    if (phase === "scheduling") return "scheduling_failure";
    if (phase === "graph") return "graph_failure";
    if (phase === "validation") return "validation_failure";
    if (phase === "tool") return "tool_failure";
    if (phase === "model") return "model_failure";
    if (phase === "context") return "context_failure";
    if (phase === "adapter") return "adapter_failure";
    return "agent_failure";
  }
  switch (phase) {
    case "planning":
      return "planning_failure";
    case "scheduling":
      return "scheduling_failure";
    case "adapter":
      return "adapter_failure";
    case "model":
      return "model_failure";
    case "tool":
      return "tool_failure";
    case "context":
      return "context_failure";
    case "graph":
      return "graph_failure";
    case "validation":
      return "validation_failure";
    case "test":
      return "test_failure";
    default:
      return "agent_failure";
  }
}

/** Lista ordenada das 14 categorias — para relatórios estáveis. */
export const FAILURE_CATEGORIES: FailureCategory[] = [
  "planning_failure",
  "scheduling_failure",
  "adapter_failure",
  "agent_failure",
  "model_failure",
  "tool_failure",
  "context_failure",
  "graph_failure",
  "budget_failure",
  "validation_failure",
  "test_failure",
  "timeout",
  "cancellation",
  "infrastructure_failure",
];
