/**
 * dependency-resolver.ts — Resolve dependências entre steps (SDD §16).
 *
 * Ordena steps respeitando `dependsOn` (topological sort) e detecta
 * ciclos. Steps sem dependências preservam a ordem original. Fail-open:
 * ciclo → retorna erro (o caller degrada para execução sequencial).
 */

import type { ExecutionStep } from "@/ai/core/execution-plan";

export interface ResolveResult {
  order: ExecutionStep[];
  cycle?: string[];
}

/** Detecção de ciclo via DFS (algoritmo de cores). */
export function findCycle(steps: ExecutionStep[]): string[] | undefined {
  const byId = new Map(steps.map((s) => [s.id, s]));
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map<string, number>();
  for (const s of steps) color.set(s.id, WHITE);
  const stack: string[] = [];

  const visit = (id: string): string[] | undefined => {
    color.set(id, GRAY);
    stack.push(id);
    for (const dep of byId.get(id)?.dependsOn ?? []) {
      const c = color.get(dep);
      if (c === WHITE) {
        const cycle = visit(dep);
        if (cycle) return cycle;
      } else if (c === GRAY) {
        // Encontrou ciclo: retorna o segmento atual do stack
        const start = stack.indexOf(dep);
        return stack.slice(start).concat(dep);
      }
    }
    color.set(id, BLACK);
    stack.pop();
    return undefined;
  };

  for (const s of steps) {
    if (color.get(s.id) === WHITE) {
      const cycle = visit(s.id);
      if (cycle) return cycle;
    }
  }
  return undefined;
}

/**
 * Ordem topológica dos steps. Steps cuja dependência não existe são
 * tratados como sem dependência (fail-open). Ciclo → `cycle` preenchido.
 */
export function resolveOrder(steps: ExecutionStep[]): ResolveResult {
  const cycle = findCycle(steps);
  if (cycle) return { order: [], cycle };

  const byId = new Map(steps.map((s) => [s.id, s]));
  const result: ExecutionStep[] = [];
  const visited = new Set<string>();

  const visit = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);
    const step = byId.get(id);
    if (!step) return;
    for (const dep of step.dependsOn ?? []) visit(dep);
    result.push(step);
  };

  // Ordem estável: visita na ordem original
  for (const s of steps) visit(s.id);
  return { order: result };
}
