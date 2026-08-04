/**
 * sort.ts — Ordenação pura e imutável para tabelas.
 *
 * Regra do projeto (imutabilidade): nunca mutar arrays de useMemo/useState.
 * `sortByKey` sempre retorna uma cópia ordenada.
 *
 * ponytail: stdlib, zero deps
 */

export type SortDir = "asc" | "desc";

export interface SortState {
  key: string;
  dir: SortDir;
}

/** Alterna o estado de ordenação ao clicar numa coluna. */
export function toggleSort(current: SortState | null, key: string): SortState {
  if (current && current.key === key) {
    return { key, dir: current.dir === "asc" ? "desc" : "asc" };
  }
  return { key, dir: "asc" };
}

function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a == null) return -1;
  if (b == null) return 1;

  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }
  return String(a).localeCompare(String(b), "pt-BR", { numeric: true, sensitivity: "base" });
}

/**
 * Retorna uma cópia de `items` ordenada pela chave.
 * `getValue` extrai o valor comparável (ex: data string → timestamp).
 * Nunca muta o array de entrada (regra de imutabilidade).
 */
export function sortByKey<T>(
  items: T[],
  key: string,
  dir: SortDir,
  getValue?: (item: T) => unknown,
): T[] {
  const mul = dir === "asc" ? 1 : -1;
  const extract = getValue ?? ((item: T) => (item as Record<string, unknown>)[key]);
  return [...items].sort((a, b) => mul * compareValues(extract(a), extract(b)));
}
