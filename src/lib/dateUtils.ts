/**
 * Formata datas ISO date-only (YYYY-MM-DD) vindas do banco em pt-BR (dd/mm/aaaa).
 *
 * `new Date("2026-08-05")` interpreta como UTC meia-noite e, em fusos negativos
 * (ex: America/Sao_Paulo), formata o DIA ANTERIOR (04/08). O sufixo "T12:00:00"
 * (meio-dia) é imune a deslocamento de dia em qualquer fuso (UTC-12..UTC+14).
 */
export function formatDateBR(date: string): string {
  return new Date(date + "T12:00:00").toLocaleDateString("pt-BR");
}
