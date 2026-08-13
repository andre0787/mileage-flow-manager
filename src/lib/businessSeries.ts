/**
 * businessSeries.ts — Séries de negócio diárias para o painel KPI
 * (Datadog interno). Funções PURAS (sem React/Supabase).
 *
 * regra-31: lib com teste unitário (tests/unit/businessSeries.test.ts)
 */

export interface DailyBusinessPoint {
  day: string;
  label: string;
  revenue: number;
  profit: number;
  milesIn: number;
  milesOut: number;
}

interface SeriesSale {
  date: string;
  status?: string;
  saleValue?: number;
  profit?: number;
  milesUsed?: number;
}

interface SeriesEntry {
  date: string;
  amount: number;
  milesGenerated?: number;
  sourceAccountId?: string;
  entryStatus?: string;
}

/**
 * "2026-08-13" → "13/08" (client). Espelho de formatDayLabel em
 * scripts/data-refresh.mjs — mantenha em sincronia.
 */
export function businessDayLabel(day: string): string {
  const [, m, d] = day.split("-");
  return d && m ? `${d}/${m}` : day;
}

/**
 * Série diária de negócio dos últimos N dias (mais antigo → mais recente).
 * Exclui vendas canceladas, entradas não confirmadas e transferências
 * (não criam milhas novas) — mesmas regras do computeDashboardMetrics.
 */
export function computeDailyBusinessSeries(
  sales: SeriesSale[],
  entries: SeriesEntry[],
  days = 14,
): DailyBusinessPoint[] {
  const out: DailyBusinessPoint[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;

    const daySales = sales.filter(
      (s) => s.status !== "cancelado" && (s.date ?? "").startsWith(day),
    );
    const dayEntries = entries.filter(
      (e) => e.entryStatus !== "aguardando" && (e.date ?? "").startsWith(day),
    );

    const revenue = daySales.reduce((sum, s) => sum + (s.saleValue ?? 0), 0);
    const profit = daySales.reduce((sum, s) => sum + (s.profit ?? 0), 0);
    const milesIn = dayEntries
      .filter((e) => !e.sourceAccountId)
      .reduce((sum, e) => sum + (e.milesGenerated ?? e.amount), 0);
    const milesOut = daySales.reduce((sum, s) => sum + (s.milesUsed ?? 0), 0);

    out.push({ day, label: businessDayLabel(day), revenue, profit, milesIn, milesOut });
  }

  return out;
}
