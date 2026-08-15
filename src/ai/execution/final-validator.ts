/**
 * final-validator.ts — Final Validator (Agent Execution Spec §21/§26).
 *
 * Última autoridade técnica: verifica tests, typecheck, lint, gates,
 * graph freshness, telemetry completeness e budget compliance.
 * Cada check é uma função pura independente; o agregador roda todos e
 * reporta. Fail-open: checks sem ferramenta → "skip", não bloqueiam.
 */

import { checkGraphFreshness, type FreshnessResult } from "./graph-freshness";
import { graphStatus } from "@/ai/graph/engine";

export type CheckStatus = "pass" | "fail" | "skip";

export interface ValidationCheck {
  name: string;
  status: CheckStatus;
  detail?: string;
}

export interface FinalValidation {
  checks: ValidationCheck[];
  ok: boolean;
}

/** Check 1 — grafo disponível (base do fluxo graph-first). */
export function checkGraphAvailable(): ValidationCheck {
  const status = graphStatus();
  if (!status.available) {
    return { name: "graph-available", status: "fail", detail: status.error };
  }
  return { name: "graph-available", status: "pass", detail: `${status.nodes ?? 0} nós` };
}

/** Check 2 — freshness do grafo (§22). */
export function checkFreshness(): ValidationCheck {
  const f: FreshnessResult = checkGraphFreshness();
  if (f.stale === undefined) {
    return { name: "graph-freshness", status: "skip", detail: "grafo indisponível" };
  }
  if (f.stale) {
    return {
      name: "graph-freshness",
      status: "fail",
      detail: `grafo em ${f.builtAtCommit?.slice(0, 7)} vs HEAD ${f.currentCommit?.slice(0, 7)} — rode graph:update`,
    };
  }
  return { name: "graph-freshness", status: "pass", detail: "grafo atualizado" };
}

/**
 * Check 3 — telemetria completa: registros de execução na sessão.
 * `envelopeCount` vem do caller (o validator não lê eventos.jsonl —
 * mantém-se puro); undefined → skip (fail-open).
 */
export function checkTelemetryCompleteness(envelopeCount?: number): ValidationCheck {
  if (envelopeCount === undefined) {
    return {
      name: "telemetry-completeness",
      status: "skip",
      detail: "sem contagem de envelopes informada",
    };
  }
  if (envelopeCount === 0) {
    return {
      name: "telemetry-completeness",
      status: "fail",
      detail: "nenhum envelope de execução registrado",
    };
  }
  return { name: "telemetry-completeness", status: "pass", detail: `${envelopeCount} envelopes` };
}

/** Check 4 — budget compliance: não excedeu limites do plano. */
export function checkBudgetCompliance(state?: {
  maxAgents?: number;
  agentsDispatched?: number;
  maxTokens?: number;
  tokensUsed?: number;
}): ValidationCheck {
  if (!state)
    return { name: "budget-compliance", status: "skip", detail: "sem estado de budget informado" };
  const agentsOk =
    state.maxAgents === undefined || (state.agentsDispatched ?? 0) <= state.maxAgents;
  const tokensOk = state.maxTokens === undefined || (state.tokensUsed ?? 0) <= state.maxTokens;
  if (!agentsOk || !tokensOk) {
    return {
      name: "budget-compliance",
      status: "fail",
      detail: `agentes ${state.agentsDispatched}/${state.maxAgents} · tokens ${state.tokensUsed}/${state.maxTokens}`,
    };
  }
  return { name: "budget-compliance", status: "pass", detail: "dentro do budget" };
}

/**
 * Validação final (§26: code + tests + graph + telemetry + gates).
 * `cmdOk` permite injetar resultados de typecheck/lint/testes (fail-open
 * quando não informado).
 */
export function finalValidate(opts?: {
  typecheckOk?: boolean;
  lintOk?: boolean;
  testsOk?: boolean;
  envelopeCount?: number;
  budgetState?: Parameters<typeof checkBudgetCompliance>[0];
}): FinalValidation {
  const checks: ValidationCheck[] = [
    checkGraphAvailable(),
    checkFreshness(),
    checkTelemetryCompleteness(opts?.envelopeCount),
    checkBudgetCompliance(opts?.budgetState),
  ];
  if (opts?.typecheckOk !== undefined) {
    checks.push({ name: "typecheck", status: opts.typecheckOk ? "pass" : "fail" });
  }
  if (opts?.lintOk !== undefined) {
    checks.push({ name: "lint", status: opts.lintOk ? "pass" : "fail" });
  }
  if (opts?.testsOk !== undefined) {
    checks.push({ name: "tests", status: opts.testsOk ? "pass" : "fail" });
  }
  return { checks, ok: checks.every((c) => c.status !== "fail") };
}
