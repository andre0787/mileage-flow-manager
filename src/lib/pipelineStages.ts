/**
 * Estágios computáveis do pipeline operacional (spec pipeline-operacao, F1).
 * Ponto único da classificação entry/sale → estágio. Puro, sem React/Supabase.
 * Sem funil literal: só estágios deriváveis dos dados (status + amount_paid).
 * Vendas `servico` ficam fora do WIP de milhas (declarado no código).
 */
import { parseDateOnly } from "@/lib/dateUtils";
import type { PointEntry } from "@/types";

export type EntryStage = "aguardando" | "comprado";
export type SaleStage = "a_executar" | "a_receber" | "recebido" | "cancelado";

/** Venda mínima p/ classificação (estrutural — aceita Sale e CollectionSale). */
export interface StageSale {
  status: string;
  date: string;
  kind?: string | null;
}

/** Vencimento = sale.date + 30d; expedite quando faltam ≤ 7d (definições congeladas). */
export const SALE_DUE_DAYS = 30;
export const EXPEDITE_DAYS = 7;

/** Entry aguardando = amount_paid < amount; senão comprada. */
export function entryStage(e: Pick<PointEntry, "amountPaid" | "amount">): EntryStage {
  return Number(e.amountPaid ?? 0) < Number(e.amount ?? 0) ? "aguardando" : "comprado";
}

/** pendente → a_executar; pago → a_receber; concluido → recebido; resto → cancelado. */
export function saleStage(s: { status: string }): SaleStage {
  switch (s.status) {
    case "pendente":
      return "a_executar";
    case "pago":
      return "a_receber";
    case "concluido":
      return "recebido";
    default:
      return "cancelado";
  }
}

/** Data de vencimento da venda (date-only + 30 dias). */
export function saleDueDate(s: { date: string }): Date {
  const d = parseDateOnly(s.date);
  d.setDate(d.getDate() + SALE_DUE_DAYS);
  return d;
}

/** Expedite = venda A Receber com vencimento em ≤ 7 dias (inclusive vencidas). */
export function isExpedite(s: StageSale, today: Date = new Date()): boolean {
  if (saleStage(s) !== "a_receber") return false;
  return saleDueDate(s).getTime() - today.getTime() <= EXPEDITE_DAYS * 86400000;
}

export interface PipelineWip {
  aguardando: number;
  comprado: number;
  aExecutar: number;
  aReceber: number;
  recebido: number;
  cancelado: number;
  expedite: number;
  /** Vendas servico excluídas do WIP de milhas (contagem declarada). */
  servicoFora: number;
}

/**
 * Contagens WIP por estágio. WIP é só-observação (sem limites bloqueantes).
 * Cancelado é lateral (fora do fluxo); servico não entra no WIP de milhas.
 */
export function buildPipelineWip(
  entries: Pick<PointEntry, "amountPaid" | "amount">[],
  sales: StageSale[],
  today: Date = new Date(),
): PipelineWip {
  const wip: PipelineWip = {
    aguardando: 0,
    comprado: 0,
    aExecutar: 0,
    aReceber: 0,
    recebido: 0,
    cancelado: 0,
    expedite: 0,
    servicoFora: 0,
  };
  for (const e of entries) wip[entryStage(e)] += 1;
  for (const s of sales) {
    if ((s.kind ?? "milhas") === "servico") {
      wip.servicoFora += 1;
      continue;
    }
    const st = saleStage(s);
    if (st === "a_executar") wip.aExecutar += 1;
    else if (st === "a_receber") {
      wip.aReceber += 1;
      if (isExpedite(s, today)) wip.expedite += 1;
    } else if (st === "recebido") wip.recebido += 1;
    else wip.cancelado += 1;
  }
  return wip;
}
