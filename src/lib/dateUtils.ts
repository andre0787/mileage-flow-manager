/**
 * Formata datas ISO date-only (YYYY-MM-DD) vindas do banco em pt-BR (dd/mm/aaaa).
 *
 * `new Date("2026-08-05")` interpreta como UTC meia-noite e, em fusos negativos
 * (ex: America/Sao_Paulo), formata o DIA ANTERIOR (04/08). O sufixo "T12:00:00"
 * (meio-dia) é imune a deslocamento de dia em qualquer fuso (UTC-12..UTC+14).
 */
export function formatDateBR(date: string): string {
  return parseDateOnly(date).toLocaleDateString("pt-BR");
}

/**
 * Converte data ISO date-only (YYYY-MM-DD) do banco em Date sem deslocar o dia
 * (mesmo bug de fuso de formatDateBR, mas para CÁLCULOS: agrupamento mensal,
 * comparação de período etc.). Strings com hora (ISO completo) passam direto.
 *
 * Ex: em America/Sao_Paulo, `new Date("2026-08-01")` → 31/07 21h → getMonth()
 * errado (entrada do dia 1º contada no mês anterior). O meio-dia evita isso.
 */
export function parseDateOnly(date: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(date + "T12:00:00") : new Date(date);
}

/** Data de hoje em ISO date-only (YYYY-MM-DD), padrão dos campos de data dos forms. */
export function todayISODate(): string {
  return new Date().toISOString().split("T")[0];
}

/** Valida string de data ISO date-only (YYYY-MM-DD) com dia real do calendário. */
export function isValidISODate(value: unknown): boolean {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** Adds calendar months while clamping the day to the target month's last day. */
export function addMonthsClamped(date: string, months: number, dayOfMonth?: number): string {
  const base = new Date(/^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T00:00:00Z` : date);
  const monthIndex = base.getUTCMonth() + months;
  const year = base.getUTCFullYear() + Math.floor(monthIndex / 12);
  const month = ((monthIndex % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const day = Math.min(dayOfMonth ?? base.getUTCDate(), lastDay);

  return new Date(Date.UTC(year, month, day)).toISOString().split("T")[0];
}
