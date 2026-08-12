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
