# Design — Blueprint v4.0 P1 item 2: domínio entradas (RTK Query)

> Data: 2026-08-10 · Card: `docs/tasks/P3-28-blueprint-v4-p1-entradas.md`
> Categoria: refactor · Branch: `refactor/blueprint-v4-p1-entradas`
> Origem: Blueprint MilesControl v4.0 (ground truth do usuário), fase P1 — um domínio por PR

## Contexto

A fundação Feature-First (P3-27, PR #335 merged) entregou `src/features/store.ts`
(configureStore + hooks tipados), `src/features/api/baseApi.ts` (RTK Query `createApi`
placeholder) e o domínio `auth` migrado. Este card migra o **domínio entradas**:
(legado) src/hooks/useDatabase/entries.ts (433 linhas, 5 hooks TanStack React Query) →
`src/features/entradas/` usando RTK Query.

### Superfície atual (evidência coletada em 2026-08-10)

| Hook (TanStack) | Consumidores diretos | Uso observado |
|---|---|---|
| `useEntriesQuery()` | `DataContext.tsx:41` | `entriesQ.isPending`, `entriesQ.data` |
| `useAddEntryMutation()` | `pages/Entradas.tsx:48` | `addEntryM.mutate(...)` |
| `useUpdateEntryMutation()` | `pages/Entradas.tsx:49` | `updateEntryM.mutate({oldEntry, updates})` |
| `useConfirmEntryMutation()` | `pages/Entradas.tsx:54` | `confirmEntryM.mutate(entry)` |
| `useDeleteEntryMutation()` | `DeleteEntryDialog.tsx:23` | `await deleteEntryM.mutateAsync(entry)` |

Todos os consumidores importam via barrel `@/hooks/useDatabase` (index.ts) — **nenhum
import direto de `./entries` fora do barrel**. A lógica interna (433 linhas) faz:
insert com recorrência (`generateRecurringEntries`), delta de saldo de contas
(`calcAccountUpdate`/`calcProportionalCost`), reversão de source, delete em cascata de
filhos por `parentEntryId`, e invalidação de cache de `entries`+`accounts` em
success/error (com toast + `logError`).

## Decisão de design

### 1. Compatibilidade de superfície (sem quebra de consumidores)

RTK Query expõe mutations como `[trigger, result]` e queries como
`useXQuery(undefined, {skip})`. Para **preservar o contrato público** dos 5 hooks, o
feature `src/features/entradas/` exporta **wrappers de compatibilidade** com o mesmo
shape TanStack:

- `useEntriesQuery()` → `{ data, isPending, isError, error, refetch }`
  (mapeia `isLoading` → `isPending`, habilita via `skip: !userId`).
- `use*Mutation()` → `{ mutate, mutateAsync, isPending, isError, error, reset }`
  (`mutate` fire-and-forget com invalidação+toast; `mutateAsync` com `unwrap()` +
  rethrow para o `DeleteEntryDialog`).

Os toasts e `logError` que hoje vivem em `onSuccess/onError` do TanStack movem-se
para dentro dos wrappers (mesmo comportamento observável).

### 2. Endpoints RTK Query com `queryFn` (Supabase direto)

`baseApi.injectEndpoints` com `tagTypes: ["entries", "accounts"]`:

- `getEntries: query<PointEntry[], void>` — `queryFn` idêntico ao atual
  (`supabase.from("entries").select("*")` + `mapEntry`), `providesTags: ["entries"]`.
- `addEntry: mutation<null, PointEntry>` — corpo idêntico ao atual (insert +
  recorrência + saldo source/dest), `invalidatesTags: ["entries", "accounts"]`.
- `confirmEntry: mutation<null, PointEntry>` — update description + saldo dest,
  `invalidatesTags` idem.
- `updateEntry: mutation<null, {oldEntry, updates}>` — delete+reinsert + delta,
  `invalidatesTags` idem.
- `deleteEntry: mutation<null, PointEntry>` — delete cascata + reversão de saldo,
  `invalidatesTags` idem.

Nota: como os endpoints usam `queryFn` (Supabase), o `baseQuery: fetchBaseQuery`
do placeholder permanece sem uso (não removido — será reavaliado quando houver um
domínio REST). O `baseApi.reducerPath` + `baseApi.middleware` são registrados no store
agora que há endpoints reais.

### 3. Integração (barrel de transição)

- (legado) src/hooks/useDatabase/entries.ts **deletado**; o barrel `useDatabase/index.ts`
  passa a reexportar os 5 hooks de `@/features/entradas` (transição — ao final da P1,
  consumidores apontam direto para features; barrel removido).
- `src/features/entradas/index.ts` (barrel, rule-40): reexporta api endpoints hooks
  + wrappers de compat.
- `src/features/store.ts`: adiciona `[baseApi.reducerPath]: baseApi.reducer` e
  `baseApi.middleware` (GET_DEFAULT_MIDDLEWARE concat).
- `src/features/api/baseApi.ts`: `tagTypes: ["entries", "accounts"]`.

### 4. Testes (rule-31/32)

- `tests/unit/features-entradas-api.test.ts`: endpoints `getEntries` (mock supabase
  resolve → data mapeado), `addEntry` (insert chamado + invalida tags), delete cascata.
- `tests/unit/features-entradas-hooks.test.ts`: wrappers de compat — `useEntriesQuery`
  expõe `isPending/data`, `mutate` fire-and-forget chama trigger + toast, `mutateAsync`
  rethrow no erro.
- Mock de `@/lib/supabase` via `vi.mock` (mesmo padrão de `features-auth.test.ts`).
- Suíte completa + lint + typecheck + `rule:40` + pre-pr.

## Fluxo de dados

```
Entradas.tsx → useAddEntryMutation() (compat) → trigger(addEntry) → supabase insert + saldos
             → invalidatesTags ["entries","accounts"] → useEntriesQuery refetch → UI
DeleteEntryDialog → deleteEntryM.mutateAsync(entry) → trigger(deleteEntry) → unwrap → toast
```

## Critérios de aceite

- [ ] `src/features/entradas/` com barrel `index.ts` (rule-40) e 5 hooks de compat com
      o mesmo shape público (nenhum consumidor quebrado).
- [ ] (legado) src/hooks/useDatabase/entries.ts removido; barrel reexporta de `@/features/entradas`.
- [ ] Store registra `baseApi` (reducer + middleware); `tagTypes` definidos.
- [ ] Testes novos verdes + suíte completa, lint, typecheck, `rule:40`, `pre-pr`.
- [ ] Nenhuma lib de UI nova (Blueprint §6); grafo 0 ciclos.

## Não-objetivos (cards futuros)

- Migrar contas (P3-29), clientes (P3-30), vendas (P3-31), controle-cpf (P3-32),
  relatorios (P3-33), simulador-venda (P3-34), dashboard (P3-35).
- Remover TanStack React Query (só após todos os domínios migrados).
- Nenhuma lib de UI nova (Blueprint §6).
