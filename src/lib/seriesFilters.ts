/** Predicados de filtro das séries de negócio (ponto único). Funções PURAS. */

/** Venda ativa de milhas num dia — serviço e canceladas ficam fora. */
export function isActiveMilesSale(
  s: { status?: string; kind?: string; date?: string },
  day: string,
): boolean {
  return (
    s.status !== "cancelado" && (s.kind ?? "milhas") === "milhas" && (s.date ?? "").startsWith(day)
  );
}

/** Entrada confirmada num dia — aguardando fica fora. */
export function isConfirmedDayEntry(
  e: { entryStatus?: string; date?: string },
  day: string,
): boolean {
  return e.entryStatus !== "aguardando" && (e.date ?? "").startsWith(day);
}

/** Soma miles (geradas ou amount) de entradas sem conta origem. */
export function sumEntriesMiles(
  entries: { sourceAccountId?: string; milesGenerated?: number; amount: number }[],
): number {
  return entries
    .filter((e) => !e.sourceAccountId)
    .reduce((sum, e) => sum + (e.milesGenerated ?? e.amount), 0);
}
