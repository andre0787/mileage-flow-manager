/**
 * Planejamento puro de transições de status de venda (F3 telemetria).
 * Decide SE uma mudança deve ser registrada no histórico; a escrita
 * best-effort vive em features/vendas/statusHistory.ts.
 * Ponto único — sem React, sem Supabase.
 */

export interface StatusTransition {
  from: string;
  to: string;
}

/** Retorna a transição quando há mudança real; null = sem ruído no histórico. */
export function planStatusTransition(from: unknown, to: unknown): StatusTransition | null {
  const f = typeof from === "string" ? from.trim() : "";
  const t = typeof to === "string" ? to.trim() : "";
  if (!f || !t || f === t) return null;
  return { from: f, to: t };
}
