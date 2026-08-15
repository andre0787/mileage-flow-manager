/**
 * graph-freshness.ts — Graph freshness (Agent Execution Spec §22).
 *
 * Compara o commit em que o grafo foi construído com o HEAD atual.
 * Stale → o Final Validator recomenda `graph:update` antes de concluir
 * tasks estruturais. Fail-open: sem grafo → stale desconhecido (não
 * bloqueia, apenas reporta).
 */

import { execSync } from "node:child_process";
import { graphStatus } from "@/ai/graph/engine";

export interface FreshnessResult {
  fresh: boolean;
  builtAtCommit?: string;
  currentCommit?: string;
  stale?: boolean; // true quando sabemos que está desatualizado
  error?: string;
}

function currentCommit(): string | undefined {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8", timeout: 5000 }).trim() || undefined;
  } catch {
    return undefined;
  }
}

export function checkGraphFreshness(): FreshnessResult {
  const status = graphStatus();
  if (!status.available) {
    return { fresh: false, stale: undefined, error: status.error ?? "grafo indisponível" };
  }
  const builtAt = status.lastBuildAt ?? undefined;
  const current = currentCommit();
  // freshness é por commit do build (status.expandido)
  const builtCommit = (status as unknown as Record<string, unknown>).built_at_commit as
    string | undefined;

  return {
    fresh: Boolean(builtCommit && current && builtCommit === current),
    builtAtCommit: builtCommit,
    currentCommit: current,
    stale: Boolean(builtCommit && current && builtCommit !== current),
    error: undefined,
  };
}
