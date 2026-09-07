/**
 * unitCost.ts — Valor médio por unidade (ponto/milha) do saldo disponível.
 * Fonte única da fórmula (tabela de Contas, card mobile e rodapé).
 * ponytail: puro, sem React/Supabase.
 */

/** Valor médio por unidade: total investido ÷ saldo atual. undefined sem dado. */
export function avgUnitCost(
  totalInvested: number | null | undefined,
  balance: number,
): number | undefined {
  const invested = Number(totalInvested ?? 0);
  if (invested <= 0 || balance <= 0) return undefined;
  return invested / balance;
}

/** Formatação: 4 casas (ponto/milha é fração de real). */
export function formatUnitCost(v: number): string {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
}
