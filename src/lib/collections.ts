/** Agregador puro do extrato completo de cobrança por cliente. */
import { CREDIT_EPSILON, calcCreditBalance, movementEffect } from "@/lib/clientCredits";
import { parseDateOnly } from "@/lib/dateUtils";
import type { ClientCredit } from "@/types";

export interface CollectionLine {
  id: string;
  saleId?: string;
  date: string;
  type: "sale" | "credit";
  kind: string;
  reversalOf?: "earn" | "spend";
  label: string;
  value: number;
  effect: number;
  received: number;
  pending: number;
}

export interface ClientCollection {
  clientId: string;
  clientName: string;
  lines: CollectionLine[];
  totalSold: number;
  totalReceived: number;
  totalPending: number;
  creditBalance: number;
  /** Positivo = devedor; negativo = credor. */
  net: number;
  oldestOpenDate: string;
}

export interface CollectionSale {
  id: string;
  clientId: string;
  clientName: string;
  kind?: string;
  serviceType?: string;
  ticketLocator?: string;
  observations?: string;
  saleValue: number;
  amountReceived?: number;
  status: string;
  date: string;
  accountId?: string | null;
  program?: string;
}

const amount = (n: unknown) => Math.max(0, Number(n) || 0);
const saleLabel = (s: CollectionSale) =>
  (s.kind ?? "milhas") === "servico" ? s.serviceType ?? "Serviço" :
    s.ticketLocator ? `Bilhete ${s.ticketLocator}` : "Milhas";

export function collectionLineTypeLabel(line: CollectionLine): string {
  if (line.type === "sale") return line.kind === "servico" ? "Venda de serviço" : "Venda de milhas";
  if (line.kind === "earn") return "Crédito gerado";
  if (line.kind === "spend") return "Crédito utilizado";
  if (line.kind === "reversal") {
    return line.reversalOf === "earn" ? "Estorno de crédito gerado" :
      line.reversalOf === "spend" ? "Estorno de crédito utilizado" : "Estorno de crédito";
  }
  return line.kind;
}

/** Inclui vendas não canceladas e todo o ledger, sem somar ledger no fechamento. */
export function buildCollectionReport(
  sales: CollectionSale[],
  movements: Pick<ClientCredit, "id" | "clientId" | "kind" | "reversalOf" | "amount" | "note" | "createdAt">[],
): ClientCollection[] {
  const groups = new Map<string, { name: string; sales: CollectionSale[]; credits: typeof movements }>();
  const get = (id: string, name: string) => {
    const group = groups.get(id) ?? { name, sales: [], credits: [] };
    groups.set(id, group);
    return group;
  };
  for (const sale of sales ?? []) {
    if (sale.status !== "cancelado") get(sale.clientId, sale.clientName).sales.push(sale);
  }
  for (const movement of movements ?? []) get(movement.clientId, movement.clientId).credits.push(movement);

  return [...groups].map(([clientId, group]) => {
    const saleLines = group.sales.map((s): CollectionLine => {
      const value = amount(s.saleValue);
      const received = amount(s.amountReceived);
      return { id: `sale:${s.id}`, saleId: s.id, date: s.date, type: "sale", kind: s.kind ?? "milhas",
        label: saleLabel(s), value, effect: -value, received, pending: Math.max(0, value - received) };
    });
    const creditLines = group.credits.map((m): CollectionLine => {
      const effect = movementEffect(m);
      return { id: `credit:${m.id}`, date: m.createdAt, type: "credit", kind: m.kind, reversalOf: m.reversalOf,
        label: m.note?.trim() || "Movimento de crédito", value: amount(m.amount), effect, received: 0, pending: 0 };
    });
    const lines = [...saleLines, ...creditLines].sort((a, b) =>
      b.date.localeCompare(a.date) || a.type.localeCompare(b.type) || a.id.localeCompare(b.id));
    const totalSold = saleLines.reduce((sum, l) => sum + l.value, 0);
    const totalReceived = saleLines.reduce((sum, l) => sum + l.received, 0);
    const totalPending = saleLines.reduce((sum, l) => sum + l.pending, 0);
    const creditBalance = Math.max(0, calcCreditBalance(group.credits));
    const netValue = totalPending - creditBalance;
    return { clientId, clientName: group.name, lines, totalSold, totalReceived, totalPending, creditBalance,
      net: Math.abs(netValue) < CREDIT_EPSILON ? 0 : netValue,
      oldestOpenDate: lines[lines.length - 1]?.date ?? "" };
  }).sort((a, b) => b.lines[0]?.date.localeCompare(a.lines[0]?.date ?? "") || a.clientId.localeCompare(b.clientId));
}

/** CSV espelha lançamentos e fechamento da interface. */
export function collectionCsvRows(rows: ClientCollection[]): Record<string, string | number>[] {
  return rows.flatMap((r) => [
    ...r.lines.map((l) => ({ Cliente: r.clientName, Data: l.date, Tipo: collectionLineTypeLabel(l),
      Detalhe: l.label, Débito: l.type === "sale" ? l.value.toFixed(2) : "0.00",
      "Crédito/efeito": l.type === "credit" ? l.effect.toFixed(2) : "0.00",
      "Recebido/aplicado": l.received.toFixed(2), Pendente: l.pending.toFixed(2),
      "Total vendido": "", "Total recebido/aplicado": "", "Pendente bruto": "",
      "Crédito disponível": "", "Saldo final": "" })),
    { Cliente: r.clientName, Data: "", Tipo: "FECHAMENTO", Detalhe: r.net > 0 ? "Saldo devedor" : r.net < 0 ? "Saldo credor" : "Quitado",
      Débito: "", "Crédito/efeito": "", "Recebido/aplicado": "", Pendente: "",
      "Total vendido": r.totalSold.toFixed(2), "Total recebido/aplicado": r.totalReceived.toFixed(2),
      "Pendente bruto": r.totalPending.toFixed(2), "Crédito disponível": r.creditBalance.toFixed(2),
      "Saldo final": r.net.toFixed(2) },
  ]);
}

export interface CollectionSalesFilter {
  cutoff: Date;
  accountIds: string[] | null;
  programName: string | null;
}

/** Recorte usado por Pipeline; Cobrança recebe o histórico sem filtros. */
export function filterCollectionSales(sales: CollectionSale[], filter: CollectionSalesFilter): CollectionSale[] {
  return (sales ?? []).filter((s) => parseDateOnly(s.date) >= filter.cutoff &&
    (filter.accountIds === null || filter.accountIds.includes(s.accountId ?? "")) &&
    (filter.programName === null || s.program === filter.programName));
}
