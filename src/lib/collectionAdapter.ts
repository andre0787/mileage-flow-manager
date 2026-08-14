import { createEntityAdapter, type EntityState } from "@reduxjs/toolkit";

/**
 * Factory de createEntityAdapter (rule-44 — RTK Auditor, Blueprint v9.0).
 *
 * Normaliza coleções (Contas, Vendas, Clientes...) como cache de entidades
 * sobre RTK Query: `toEntityState` converte o array do queryFn em
 * `{ ids, entities }` e os seletores memoizados (`selectAll`/`selectById`/
 * `selectEntities`) dão acesso O(1) por id sem `.find()` em arrays.
 *
 * RTK 2.x: com `T extends { id: string }`, o Id do adapter é derivado de
 * `T["id"]` (= string) — `selectId` não precisa ser passado.
 *
 * Uso por feature:
 *   const { adapter, toEntityState, selectAll, selectById } =
 *     createCollectionAdapter<Account>();
 */

export interface CollectionAdapter<T extends { id: string }> {
  adapter: ReturnType<typeof createEntityAdapter<T>>;
  /** Converte array → EntityState (para transformResponse do query). */
  toEntityState: (rows: T[]) => EntityState<T, string>;
  /** Seletores memoizados (getSelectors do adapter). */
  selectAll: (state: EntityState<T, string>) => T[];
  selectById: (state: EntityState<T, string>, id: string) => T | undefined;
  selectEntities: (state: EntityState<T, string>) => Record<string, T>;
  selectIds: (state: EntityState<T, string>) => string[];
}

export function createCollectionAdapter<T extends { id: string }>(): CollectionAdapter<T> {
  const adapter = createEntityAdapter<T>();
  const initialState = adapter.getInitialState();
  const { selectAll, selectById, selectEntities, selectIds } = adapter.getSelectors();

  return {
    adapter,
    toEntityState: (rows: T[]) => adapter.setAll(initialState, rows),
    selectAll,
    selectById,
    selectEntities,
    selectIds,
  };
}
