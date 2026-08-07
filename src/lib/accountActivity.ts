import type { PointEntry, Sale } from "@/types";

export interface AccountActivity {
  lastEntry?: PointEntry;
  lastSale?: Sale;
}

/**
 * Última entrada e última venda válidas de uma conta.
 * Filtro consistente com computedBalances de Contas.tsx:
 * entradas "aguardando" (recorrência futura) e vendas "cancelado" são ignoradas.
 */
export function getLastAccountActivity(
  entries: PointEntry[],
  sales: Sale[],
  accountId: string,
): AccountActivity {
  const validEntries = entries.filter(
    (e) => e.accountId === accountId && e.entryStatus !== "aguardando",
  );
  const validSales = sales.filter((s) => s.accountId === accountId && s.status !== "cancelado");

  let lastEntry: PointEntry | undefined;
  for (const e of validEntries) {
    if (!lastEntry || e.date > lastEntry.date) lastEntry = e;
  }

  let lastSale: Sale | undefined;
  for (const s of validSales) {
    if (!lastSale || s.date > lastSale.date) lastSale = s;
  }

  return { lastEntry, lastSale };
}
