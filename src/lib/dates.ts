/**
 * Módulo de constantes e utilitários de data/filtro de período.
 * Centraliza as opções de período usadas nos relatórios e filtros.
 */

export interface PeriodOption {
  value: string
  label: string
}

/** Opções de período para filtros de relatório */
export const PERIOD_OPTIONS: PeriodOption[] = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "365", label: "Último ano" },
];

/** Calcula a data de corte com base em dias atrás */
export function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

/** Filtra um array de itens com data por período */
export function filterByDate<T extends { date: string }>(
  items: T[],
  days: number,
): T[] {
  const cutoff = daysAgo(days);
  return items.filter(item => new Date(item.date) >= cutoff);
}

/** Verifica se uma data está no mês corrente */
export function isCurrentMonth(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

/** Retorna o mês anterior como { month, year } */
export function getPreviousMonth(): { month: number; year: number } {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { month: prev.getMonth(), year: prev.getFullYear() };
}
