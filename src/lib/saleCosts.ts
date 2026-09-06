/** Custos adicionais de venda — parse/agregação em ponto único. Funções PURAS. */

/** Item de custo adicional normalizado. */
export interface SaleCostItem {
  desc: string;
  amount: number;
}

/** Normaliza additional_costs do banco (ponto único p/ mapSale). */
export function parseSaleCosts(raw: unknown): SaleCostItem[] {
  if (!Array.isArray(raw)) return [];
  return (raw as { desc?: unknown; amount?: unknown }[])
    .filter((c) => c && typeof c.amount === "number")
    .map((c) => ({ desc: (c.desc as string) ?? "", amount: Number(c.amount) }));
}

/** Aplica o bloco additional_costs no payload snake_case do update (extraído p/ rule-41). */
export function applyAdditionalCosts(updateData: Record<string, unknown>, input: unknown): void {
  const costs = Array.isArray(input) ? input : [];
  const sum = costs.reduce((s, c) => s + (Number((c as { amount?: unknown }).amount) || 0), 0);
  updateData.additional_costs = costs;
  updateData.additional_cost = sum;
  updateData.additional_cost_desc = costs
    .map(
      (c) => `${(c as { desc?: unknown }).desc || "Custo"}: ${(c as { amount?: unknown }).amount}`,
    )
    .join("; ");
}
