/**
 * Relatório de cobrança por cliente — funções PURAS (sem React/Supabase).
 * Ponto único das regras de débito: UI e CSV consomem daqui.
 * Cobrança mostra SOMENTE valores a cobrar — nunca lucro/margem/custos.
 */
import { CREDIT_EPSILON, calcCreditBalance } from "@/lib/clientCredits";
import { parseDateOnly } from "@/lib/dateUtils";
import type { ClientCredit } from "@/types";

export interface CollectionLine {
  saleId: string;
  date: string;
  kind: string;
  label: string;
  value: number;
  received: number;
  pending: number;
}

export interface ClientCollection {
  clientId: string;
  clientName: string;
  lines: CollectionLine[];
  totalPending: number;
  creditBalance: number;
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
  /** Só para filtrar por dono/programa (espelha ownerSales/programSales). */
  accountId?: string | null;
  program?: string;
}

function saleLabel(s: CollectionSale): string {
  if ((s.kind ?? "milhas") === "servico") return s.serviceType ?? "Serviço";
  return s.ticketLocator ? `Bilhete ${s.ticketLocator}` : "Milhas";
}

/** Monta o relatório de cobrança: vendas em aberto agrupadas por cliente. */
export function buildCollectionReport(
  sales: CollectionSale[],
  movements: Pick<ClientCredit, "clientId" | "kind" | "reversalOf" | "amount">[],
): ClientCollection[] {
  const byClient = new Map<string, ClientCredit[]>();
  for (const m of movements ?? []) {
    const list = byClient.get(m.clientId) ?? [];
    list.push(m as ClientCredit);
    byClient.set(m.clientId, list);
  }

  const rows: ClientCollection[] = [];
  const openByClient = new Map<string, CollectionSale[]>();
  for (const s of sales ?? []) {
    if (s.status === "cancelado") continue;
    const pending =
      Math.max(0, Number(s.saleValue) || 0) - Math.max(0, Number(s.amountReceived) || 0);
    if (pending <= CREDIT_EPSILON) continue;
    const list = openByClient.get(s.clientId) ?? [];
    list.push(s);
    openByClient.set(s.clientId, list);
  }

  for (const [clientId, open] of openByClient) {
    const lines = open
      .map((s) => {
        const value = Math.max(0, Number(s.saleValue) || 0);
        const received = Math.max(0, Number(s.amountReceived) || 0);
        return {
          saleId: s.id,
          date: s.date,
          kind: s.kind ?? "milhas",
          label: saleLabel(s),
          value,
          received,
          pending: value - received,
        } satisfies CollectionLine;
      })
      .sort((a, b) => (a.date < b.date ? -1 : 1));
    const totalPending = lines.reduce((sum, l) => sum + l.pending, 0);
    const creditBalance = Math.max(0, calcCreditBalance(byClient.get(clientId) ?? []));
    const net = Math.max(0, totalPending - creditBalance);
    rows.push({
      clientId,
      clientName: open[0]?.clientName ?? clientId,
      lines,
      totalPending,
      creditBalance,
      net: Math.abs(net) < CREDIT_EPSILON ? 0 : net,
      oldestOpenDate: lines[0]?.date ?? "",
    });
  }
  // Dono da dor: débito mais antigo primeiro.
  return rows.sort((a, b) => (a.oldestOpenDate < b.oldestOpenDate ? -1 : 1));
}

/** Linhas do CSV de cobrança (só campos de cobrança — sem lucro/margem/custos). */
export function collectionCsvRows(rows: ClientCollection[]): Record<string, string | number>[] {
  const out: Record<string, string | number>[] = [];
  for (const r of rows) {
    for (const l of r.lines) {
      out.push({
        Cliente: r.clientName,
        Data: l.date,
        Tipo: l.kind === "servico" ? "Serviço" : "Milhas",
        Detalhe: l.label,
        Valor: l.value.toFixed(2),
        Recebido: l.received.toFixed(2),
        Pendente: l.pending.toFixed(2),
      });
    }
    out.push({
      Cliente: r.clientName,
      Data: "",
      Tipo: "TOTAL",
      Detalhe: `Crédito: ${r.creditBalance.toFixed(2)} · Líquido a cobrar`,
      Valor: r.totalPending.toFixed(2),
      Recebido: "",
      Pendente: r.net.toFixed(2),
    });
  }
  return out;
}

export interface CollectionSalesFilter {
  /** Corte de período (mesmo dateCutoff da página). */
  cutoff: Date;
  /** ids das contas do dono selecionado; null = todos os donos. */
  accountIds: string[] | null;
  /** Nome do programa selecionado; null = todos os programas. */
  programName: string | null;
}

/**
 * Recorte de vendas para a Cobrança: período por data + dono (via conta) +
 * programa — mesma lógica de ownerSales/programSales de Relatorios.tsx.
 * Filtros nulos = passthrough (comportamento anterior).
 */
export function filterCollectionSales(
  sales: CollectionSale[],
  filter: CollectionSalesFilter,
): CollectionSale[] {
  return (sales ?? []).filter((s) => {
    if (parseDateOnly(s.date) < filter.cutoff) return false;
    if (filter.accountIds !== null && !filter.accountIds.includes(s.accountId ?? "")) return false;
    if (filter.programName !== null && s.program !== filter.programName) return false;
    return true;
  });
}
