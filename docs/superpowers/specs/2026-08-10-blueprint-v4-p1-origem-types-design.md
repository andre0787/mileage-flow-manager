# Spec — Migração do domínio origemTypes para RTK Query (P3-35)

> **Categoria:** refactor · **Card:** `docs/tasks/P3-35-blueprint-v4-p1-origem-types.md` · **Branch:** `refactor/blueprint-v4-p1-origem-types`
> **Base:** `main` (6353842) · **Padrão canônico:** P3-31 (vendas), P3-32 (alerts), P3-33 (owners), P3-34 (programs)

## INTENT (rule-33)

- Código legado de origemTypes fazia 1 query e 3 mutations via TanStack Query sobre a tabela `origem_types`;
- Testes esperados: novo domínio `src/features/origemTypes/` com hooks públicos idênticos em shape aos legados;
- Esta spec diz: migrar para RTK Query seguindo o padrão de `src/features/vendas/`/`src/features/programs/`.

## Objetivo

Mover o domínio **origemTypes** do módulo legado de hooks (TanStack React Query) para **RTK Query** em `src/features/origemTypes/`, preservando o contrato público e os comportamentos de cache.

## Estado atual (levantado com CRG + leitura)

- Módulo legado de origemTypes (102 linhas): `useOrigemTypesQuery`, `useAddOrigemTypeMutation`, `useUpdateOrigemTypeMutation`, `useDeleteOrigemTypeMutation`; usava `supabase`, `useUserId` (shared), `useAuth`, `mapOrigemType` (mappers), `logError`/`logDestructiveOp`, `toast`.
- Query: `supabase.from("origem_types").select("*")` → `.map(mapOrigemType)`, enabled com userId. **Sem order.**
- Mutations: insert (com `description` condicional — coluna de migração), update por id (name/account_type/color/description), delete por id; invalidam via `queryClient.invalidateQueries` com `queryKey: ["origem_types"]`.
- **Consumidores (CRG):** `DataProvider` (via `useOrigemTypesQuery`), `Entradas.tsx`/`Configuracoes.tsx` (mutations).

## Arquitetura alvo

```
src/features/origemTypes/
  index.ts          (barrel — rule-40)
  origemTypesApi.ts (baseApi.injectEndpoints: getOrigemTypes/addOrigemType/updateOrigemType/deleteOrigemType)
  shared.ts         (toQueryError, OrigemTypesBuilder, mapOrigemType reuso, reexport supabase)
  getOrigemTypes.ts (query com skip sem usuário; providesTags ["origem_types"])
  addOrigemType.ts  (insert com supabase.auth.getUser() para user_id; invalidatesTags ["origem_types"])
  updateOrigemType.ts (update por id; invalidatesTags ["origem_types"])
  deleteOrigemType.ts (delete por id; invalidatesTags ["origem_types"])
  hooks.ts          (wrappers públicos: data/isPending/isError/error/refetch + mutate/mutateAsync)
  mutationHooksLifecycle.ts (handlers: toast, logError, logDestructiveOp; invalidate no sucesso)
```

### Regras de cache

- Tag única: `"origem_types"` (snake_case, consistente com a invalidação do addProgram do P3-34) — adicionar em `tagTypes` de `src/features/api/baseApi.ts`.
- Query: `providesTags: ["origem_types"]`; `skip: !userId`.
- Mutations: `invalidatesTags: ["origem_types"]` (invalidação pós-sucesso).

### Contrato público preservado (shape)

- `useOrigemTypesQuery()` → `{ data, isPending, isError, error, refetch }`.
- `useAddOrigemTypeMutation()` / `useUpdateOrigemTypeMutation()` / `useDeleteOrigemTypeMutation()` → `{ mutate, mutateAsync, isPending, ... }` com callbacks `onSuccess/onError`.
- Toasts pt-BR idênticos ao legado real: `"Erro ao criar tipo de operação"`, `"Erro ao atualizar tipo de operação"`, `"Tipo de operação excluído com sucesso"`, `"Erro ao excluir tipo de operação"`.
- `logDestructiveOp("delete", "origem_type")`.

## Arquivos e escopo (permitidos)

| Ação | Arquivo |
|---|---|
| criar | `src/features/origemTypes/**` (index, origemTypesApi, shared, endpoints, hooks, lifecycle) |
| modificar | `src/features/api/baseApi.ts` (+tag `origem_types`) |
| modificar | `src/hooks/useDatabase/index.ts` (reexportar de `@/features/origemTypes`, remover `./origemTypes`) |
| excluir | `src/hooks/useDatabase/origemTypes.ts (removido)` |
| criar | tests/unit/features-origemTypes-api.test.ts e features-origemTypes-hooks.test.ts |
| modificar | `tests/unit/cache-invalidation.test.ts` (adicionar cobertura origemTypes mantendo vendas/owners/programs) |
| modificar | `docs/tasks/P3-35-blueprint-v4-p1-origem-types.md` (estado done ao final), `docs/MAP.md`, `docs/handoff.md`, `docs/tracking/*`, `docs/reports/*`, plano/spec histórica se referenciarem o módulo removido |

**Fora de escopo:** domínios não-origemTypes (alerts/contas/clientes/entradas/programs/owners/vendas), `shared.ts`/`mappers.ts` legados (ficam), UI/components.

## Verificação

1. `npx vitest run tests/unit/features-origemTypes-api.test.ts tests/unit/features-origemTypes-hooks.test.ts tests/unit/cache-invalidation.test.ts` — novos testes verdes;
2. `npm run test` — suíte completa verde;
3. `npm run lint` — 0 erros;
4. `npm run typecheck` — ok;
5. `npm run rule:40` — barrel + RLS de `origem_types`;
6. `node scripts/verify-docs.mjs --strict` — sem refs quebradas;
7. `npm run pre-pr` — 0 errors (relatório HTML);
8. Code review por subagente (rule-38) antes do PR.
