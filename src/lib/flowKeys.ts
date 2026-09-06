/**
 * 4-keys adaptadas da operação (spec pipeline-operacao, F2). Puras, sem React.
 * Calculadas live de useData (não do JSON nightly). Toda key carrega a
 * margem de interpretação — o componente exibe janela de medição ao lado.
 * Lead via FIFO entry↔sale é PROXY declarado (sem vínculo direto no banco).
 */
import { parseDateOnly } from "@/lib/dateUtils";
import type { ClientCredit, PointEntry } from "@/types";

const DAY_MS = 86400000;
/** Lead com n < 20 é preliminar (trava do council). */
export const LEAD_MIN_N = 20;

export interface FlowKeys {
  throughputPerDay: number;
  /** Vendas pagas+concluídas consideradas. */
  throughputCount: number;
  /** Dias da janela (vem do filtro de período da página). */
  windowDays: number;
  leadP50: number | null;
  leadP85: number | null;
  leadN: number;
  leadPreliminary: boolean;
  divergencePct: number;
  divergenceNum: number;
  divergenceDen: number;
  /** null = sem pares reversal↔spend (nunca 0). */
  mttrDays: number | null;
  mttrPairs: number;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

/** Percentil sobre array ordenado asc (p50/p85). null sem dados. */
export function percentile(sortedAsc: number[], q: number): number | null {
  if (sortedAsc.length === 0) return null;
  const idx = Math.min(sortedAsc.length - 1, Math.max(0, Math.ceil(q * sortedAsc.length) - 1));
  return sortedAsc[idx];
}

type SaleLike = { date: string; status: string; kind?: string | null; id: string };
type EntryLike = Pick<PointEntry, "date">;
type MoveLike = Pick<ClientCredit, "saleId" | "kind" | "reversalOf" | "createdAt">;

function isMilhas(s: SaleLike): boolean {
  return (s.kind ?? "milhas") === "milhas";
}

/**
 * Lead dias por venda: sale.date − FIFO entry.date (entradas ordenadas por
 * data, consumidas uma única vez). Só vendas milhas pagas/concluídas.
 */
export function computeLeadDays(sales: SaleLike[], entries: EntryLike[]): number[] {
  const pool = [...entries].map((e) => parseDateOnly(e.date).getTime()).sort((a, b) => a - b);
  const eligible = [...sales]
    .filter((s) => isMilhas(s) && (s.status === "pago" || s.status === "concluido"))
    .sort((a, b) => parseDateOnly(a.date).getTime() - parseDateOnly(b.date).getTime());
  const leads: number[] = [];
  for (const s of eligible) {
    const t = parseDateOnly(s.date).getTime();
    const i = pool.findIndex((e) => e <= t);
    if (i < 0) continue;
    leads.push(Math.max(0, Math.round((t - pool[i]) / DAY_MS)));
    pool.splice(i, 1);
  }
  return leads.sort((a, b) => a - b);
}

/** Reversões por venda (kind reversal) — base do CFR e do MTTR. */
function reversalSaleIds(movements: MoveLike[]): Set<string> {
  return new Set(movements.filter((m) => m.kind === "reversal").map((m) => m.saleId));
}

/**
 * MTTR em dias: média de reversal.created_at − spend.created_at por par
 * (mesma venda, reversalOf === 'spend', pareando o i-ésimo com o i-ésimo
 * spend mais antigo). null sem pares.
 */
export function computeMttrDays(movements: MoveLike[]): { days: number | null; pairs: number } {
  const bySale = new Map<string, MoveLike[]>();
  for (const m of movements) {
    const list = bySale.get(m.saleId) ?? [];
    list.push(m);
    bySale.set(m.saleId, list);
  }
  const diffs: number[] = [];
  for (const list of bySale.values()) {
    const spends = list
      .filter((m) => m.kind === "spend")
      .sort((a, b) => daysBetween(parseDateOnly(a.createdAt), parseDateOnly(b.createdAt)));
    const revs = list
      .filter((m) => m.kind === "reversal" && m.reversalOf === "spend")
      .sort((a, b) => daysBetween(parseDateOnly(a.createdAt), parseDateOnly(b.createdAt)));
    const n = Math.min(spends.length, revs.length);
    for (let i = 0; i < n; i++) {
      diffs.push(
        Math.max(
          0,
          daysBetween(parseDateOnly(spends[i].createdAt), parseDateOnly(revs[i].createdAt)),
        ),
      );
    }
  }
  if (diffs.length === 0) return { days: null, pairs: 0 };
  return { days: diffs.reduce((s, d) => s + d, 0) / diffs.length, pairs: diffs.length };
}

export function computeFlowKeys(
  sales: SaleLike[],
  entries: EntryLike[],
  movements: MoveLike[],
  windowDays: number,
): FlowKeys {
  const paid = sales.filter(
    (s) => isMilhas(s) && (s.status === "pago" || s.status === "concluido"),
  );
  const leads = computeLeadDays(sales, entries);
  const revIds = reversalSaleIds(movements);
  const diverged = sales.filter((s) => s.status === "cancelado" || revIds.has(s.id)).length;
  const mttr = computeMttrDays(movements);
  return {
    throughputPerDay: windowDays > 0 ? paid.length / windowDays : 0,
    throughputCount: paid.length,
    windowDays,
    leadP50: percentile(leads, 0.5),
    leadP85: percentile(leads, 0.85),
    leadN: leads.length,
    leadPreliminary: leads.length < LEAD_MIN_N,
    divergencePct: sales.length > 0 ? (diverged / sales.length) * 100 : 0,
    divergenceNum: diverged,
    divergenceDen: sales.length,
    mttrDays: mttr.days,
    mttrPairs: mttr.pairs,
  };
}
