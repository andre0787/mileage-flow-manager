# Spec — Migração do domínio owners para RTK Query (P3-33)

> **Categoria:** refactor · **Card:** `docs/tasks/P3-33-blueprint-v4-p1-owners.md` · **Branch:** `refactor/blueprint-v4-p1-owners`
> **Base:** `main` (6353842) · **Padrão canônico:** P3-31 (vendas) e P3-32 (alerts)

## INTENT (rule-33)

- Código legado de owners fazia 1 query e 3 mutations via TanStack Query sobre a tabela `owners`;
- Testes esperados: novo domínio `src/features/owners/` com hooks públicos idênticos em shape aos legados;
- Esta spec diz: migrar para RTK Query seguindo o padrão de `src/features/alerts/`/`src/features/vendas/`.

## Objetivo

Mover o domínio **owners** do módulo legado de hooks (TanStack React Query) para **RTK Query** em `src/features/owners/`, preservando o contrato público e os comportamentos otimistas (cache update instantâneo + invalidação) dos consumidores.

## Estado atual (levantado com CRG)

- Módulo legado de owners (112 linhas): `useOwnersQuery`, `useAddOwnerMutation`, `useUpdateOwnerMutation`, `useDeleteOwnerMutation`; usava `supabase`, `useUserId` (shared), `useAuth`, `mapOwner` (mappers), `logError`/`logDestructiveOp`, `toast`.
- Query: `supabase.from("owners").select("*")` → `.map(mapOwner)`, enabled com userId.
- Mutations com **otimismo** (`queryClient.setQueryData<Owner[]>(["owners", userId], ...)`) e invalidação (`invalidateQueries { queryKey: ["owners"], refetchType: "all" }`).
- **Consumidores (CRG):** `DataProvider` (DataContext — `useOwnersQuery` → `isPending`, `.data`), `Entradas.tsx` (`addOwnerM.mutate(owner)`), `Configuracoes.tsx` (add/update/delete), `AccountDialog.tsx` (`addOwnerM.mutate(owner)`).

## Arquitetura alvo

```
src/features/owners/
  index.ts          (barrel — rule-40)
  ownersApi.ts      (baseApi.injectEndpoints: getOwners/addOwner/updateOwner/deleteOwner)
  shared.ts         (toQueryError, OwnersBuilder, mapOwner reuso, reexport supabase)
  getOwners.ts      (query com skip sem usuário; providesTags ["owners"])
  addOwner.ts       (insert com supabase.auth.getUser(); invalidatesTags ["owners"])
  updateOwner.ts    (update por id; invalidatesTags ["owners"])
  deleteOwner.ts    (delete por id; invalidatesTags ["owners"])
  hooks.ts          (wrappers públicos: data/isPending/isError/error/refetch + mutate/mutateAsync)
  mutationHooksLifecycle.ts (handlers de success/error: toast, logError, logDestructiveOp)
```

### Regras de cache

- Tag única: `"owners"` — adicionar em `tagTypes` de `src/features/api/baseApi.ts`.
- Query: `providesTags: ["owners"]`; `skip: !userId`.
- Mutations: `invalidatesTags: ["owners"]` (invalidação pós-sucesso; sem otimismo "setQueryData" manual — o RTK re-busca via invalidação, equivalente ao comportamento final dos legados).
- `addOwner`: `user_id` vem de `supabase.auth.getUser()` (padrão alerts/vendas).

### Contrato público preservado (shape)

- `useOwnersQuery()` → `{ data, isPending, isError, error, refetch }` (tanstack shape).
- `useAddOwnerMutation()` / `useUpdateOwnerMutation()` / `useDeleteOwnerMutation()` → `{ mutate, mutateAsync, isPending, ... }` com callbacks `onSuccess/onError`.
- Toasts pt-BR idênticos aos legados: `"Erro ao criar dono"`, `"Erro ao atualizar dono"`, `"Dono excluído com sucesso"`, `"Erro ao excluir dono"`.
- `logDestructiveOp("delete", "owner")` no delete.

## Arquivos e escopo (permitidos)

| Ação | Arquivo |
|---|---|
| criar | `src/features/owners/**` (index, ownersApi, shared, endpoints, hooks, lifecycle) |
| modificar | `src/features/api/baseApi.ts` (+tag `owners`) |
| modificar | `src/hooks/useDatabase/index.ts` (reexportar de `@/features/owners`, remover `./owners`) |
| excluir | módulo legado de owners (migrado para src/features/owners/) |
| criar | `tests/unit/features-owners-api.test.ts` e `features-owners-hooks.test.ts` |
| modificar | `docs/tasks/P3-33-blueprint-v4-p1-owners.md` (estado done ao final), `docs/MAP.md`, `docs/handoff.md`, `docs/tracking/*`, `docs/reports/*`, plano/spec histórica se referenciar o arquivo removido |

**Fora de escopo:** domínios não-owners (alerts/contas/clientes/entradas/programs/origemTypes/vendas), `shared.ts`/`mappers.ts` legados (ficam), UI/components.

## Verificação

1. `npx vitest run tests/unit/features-owners-api.test.ts tests/unit/features-owners-hooks.test.ts` — novos testes verdes;
2. `npm run test` — suíte completa verde;
3. `npm run lint` — 0 erros;
4. `npm run typecheck` — ok;
5. `npm run rule:40` — barrel + RLS de `owners`;
6. `node scripts/verify-docs.mjs --strict` — sem refs quebradas (atualizar plano/spec histórica se referenciarem o módulo legado de owners);
7. `npm run pre-pr` — 0 errors (relatório HTML);
8. Code review por subagente (rule-38) antes do PR.