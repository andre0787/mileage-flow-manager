# Spec — Migração do domínio origemTypes para RTK Query (P3-35)

> **Categoria:** refactor · **Card:** `docs/tasks/P3-35-blueprint-v4-p1-origem-types.md` · **Branch:** `refactor/blueprint-v4-p1-origem-types`
> **Base:** `main` (6353842) · **Padrão canônico:** P3-31 (vendas), P3-32 (alerts), P3-33 (owners), P3-34 (programs)

## INTENT (rule-33)

- Código legado de origemTypes fazia 1 query e 3 mutations via TanStack Query sobre a tabela `origem_types`;
- Testes esperados: novo domínio `src/features/origemTypes/` com hooks públicos idênticos em shape aos legados;
- Esta spec diz: migrar para RTK Query seguindo o padrão de `src/features/owners/`/`src/features/alerts/`.

## Objetivo

Mover o domínio **origemTypes** do módulo legado de hooks (TanStack React Query) para **RTK Query** em `src/features/origemTypes/`, preservando o contrato público e os comportamentos de cache.

## Estado atual (levantado com CRG + leitura)

- Módulo legado de origemTypes (102 linhas): `useOrigemTypesQuery`, `useAddOrigemTypeMutation`, `useUpdateOrigemTypeMutation`, `useDeleteOrigemTypeMutation`; usava `supabase`, `useUserId` (shared), `useAuth`, `mapOrigemType` (mappers), `logError`/`logDestructiveOp`, `toast`.
- Query: `supabase.from("origem_types").select("*")` → `.map(mapOrigemType)`, enabled com userId. **Sem order.**
- Mutations: operações padrão de insert, update (por id), delete (por id); invalidam o cache via `invalidateQueries` no legacy (não presentes no código, mas o legacy usava `queryClient.invalidateQueries` com `queryKey: ["origem_types"]`).
- **Consumidores (CRG):** `DataProvider` (via `useOrigemTypesQuery`), e também pelo módulo de programas (no addProgram, quando `type === "pontos"`, faz upsert em `origem_types`).

## Arquitetura alvo

```
src/features/origemTypes/
  index.ts          (barrel — rule-40)
  origemTypesApi.ts (baseApi.injectEndpoints: getOrigemTypes/addOrigemType/updateOrigemType/deleteOrigemType)
  shared.ts         (toQueryError, OrigemTypesBuilder, mapOrigemType reuso, reexport supabase)
  getOrigemTypes.ts (query com skip sem usuário; providesTags ["origemTypes"])
  addOrigemType.ts  (insert com supabase.auth.getUser() para user_id; invalidatesTags ["origemTypes"])
  updateOrigemType.ts (update por id; invalidatesTags ["origemTypes"])
  deleteOrigemType.ts (delete por id; invalidatesTags ["origemTypes"])
  hooks.ts          (wrappers públicos: data/isPending/isError/error/refetch + mutate/mutateAsync)
  mutationHooksLifecycle.ts (handlers: toast, logError, logDestructiveOp; invalidate no sucesso)
```

### Regras de cache

- Tag única: `"origemTypes"` — adicionar em `tagTypes` de `src/features/api/baseApi.ts`.
- Query: `providesTags: ["origemTypes"]`; `skip: !userId`.
- Mutations: `invalidatesTags: ["origemTypes"]` (invalidação pós-sucesso).

### Contrato público preservado (shape)

- `useOrigemTypesQuery()` → `{ data, isPending, isError, error, refetch }`.
- `useAddOrigemTypeMutation()` / `useUpdateOrigemTypeMutation()` / `useDeleteOrigemTypeMutation()` → `{ mutate, mutateAsync, isPending, ... }` com callbacks `onSuccess/onError`.
- Toasts pt-BR idênticos: `"Erro ao criar origem"`, `"Erro ao atualizar origem"`, `"Origem excluída com sucesso"`, `"Erro ao excluir origem"`.
- `logDestructiveOp("delete", "origemType")`.

## Arquivos e escopo (permitidos)

| Ação | Arquivo |
|---|---|
| criar | `src/features/origemTypes/**` (index, origemTypesApi, shared, endpoints, hooks, lifecycle) |
| modificar | `src/features/api/baseApi.ts` (+tag `origemTypes`) |
| modificar | `src/hooks/useDatabase/index.ts` (reexportar de `@/features/origemTypes`, remover `./origemTypes`) |
| excluir | `src/hooks/useDatabase/origemTypes.ts` |
| criar | tests/unit/features-origemTypes-api.test.ts e features-origemTypes-hooks.test.ts (legado, ainda não migrados para RTK Query) |
| modificar | `tests/unit/cache-invalidation.test.ts` (adicionar cobertura origemTypes mantendo vendas/owners/programs) |
| modificar | `docs/tasks/P3-35-blueprint-v4-p1-origem-types.md` (estado done ao final), `docs/MAP.md`, `docs/handoff.md`, `docs/tracking/*`, `docs/reports/*`, plano/spec histórica se referenciarem o módulo removido |

**Fora de escopo:** domínios não-origemTypes (alerts/contas/clientes/entradas/programs/owners/vendas), `shared.ts`/`mappers.ts` legados (ficam), UI/components.

## Verificação

1. `npx vitest run tests/unit/features-origemTypes-api.test.ts tests/unit/features-origemTypes-hooks.test.ts tests/unit/cache-invalidation.test.ts` — novos testes verdes;
2. `npm run test` — suíte completa verde;
3. `npm run lint` — 0 erros;
4. `npm run typecheck` — ok;
5. `npm run rule:40` — barrel + RLS de `origemTypes`;
6. `node scripts/verify-docs.mjs --strict` — sem refs quebradas;
7. `npm run pre-pr` — 0 errors (relatório HTML);
8. Code review por subagente (rule-38) antes do PR.