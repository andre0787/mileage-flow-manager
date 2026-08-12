# Spec — Migração do domínio programs para RTK Query (P3-34)

> **Categoria:** refactor · **Card:** `docs/tasks/P3-34-blueprint-v4-p1-programs.md` · **Branch:** `refactor/blueprint-v4-p1-programs`
> **Base:** `main` (6353842) · **Padrão canônico:** P3-31 (vendas), P3-32 (alerts), P3-33 (owners)

## INTENT (rule-33)

- Código legado de programs fazia 1 query e 3 mutations via TanStack Query sobre as tabelas `programs` (e `origem_types` no add, quando `type === "pontos"`);
- Testes esperados: novo domínio `src/features/programs/` com hooks públicos idênticos em shape aos legados;
- Esta spec diz: migrar para RTK Query seguindo o padrão de `src/features/owners/`/`src/features/alerts/`.

## Objetivo

Mover o domínio **programs** do módulo legado de hooks (TanStack React Query) para **RTK Query** em `src/features/programs/`, preservando o contrato público e os comportamentos de cache (invalidação de `programs` E `origem_types` no add, quando aplicável).

## Estado atual (levantado com CRG + leitura)

- Módulo legado de programs (138 linhas): `useProgramsQuery`, `useAddProgramMutation`, `useUpdateProgramMutation`, `useDeleteProgramMutation`; usava `supabase`, `useUserId` (shared), `useAuth`, `mapProgram` (mappers), `logError`/`logDestructiveOp`, `toast`.
- Query: `supabase.from("programs").select("*")` → `.map(mapProgram)`, enabled com userId. **Sem order.**
- **Add especial**: insere em `programs` E, se `program.type === "pontos"`, faz `origem_types.upsert({ id, user_id, name, account_type: "pontos", color: "#3b82f6" }, { onConflict: "id" })`; invalida `["programs"]` E `["origem_types"]`.
- Update: campos mapeados camelCase→snake (name, type, max_passengers, passenger_cycle_type, passenger_cycle_days); invalida `["programs"]`.
- Delete: por id; invalida `["programs"]`; `logDestructiveOp("delete", "program")` + toast `"Programa excluído com sucesso"`.
- **Consumidores (CRG):** `DataProvider` (query), `AccountDialog`, `Configuracoes`, `Entradas` (mutations).

## Arquitetura alvo

```
src/features/programs/
  index.ts          (barrel — rule-40)
  programsApi.ts    (baseApi.injectEndpoints: getPrograms/addProgram/updateProgram/deleteProgram)
  shared.ts         (toQueryError, ProgramsBuilder, mapProgram reuso, reexport supabase)
  getPrograms.ts    (query com skip sem usuário; providesTags ["programs"])
  addProgram.ts     (insert programs + upsert origem_types se type pontos; invalidatesTags ["programs","origem_types"])
  updateProgram.ts  (update por id; invalidatesTags ["programs"])
  deleteProgram.ts  (delete por id; invalidatesTags ["programs"])
  hooks.ts          (wrappers públicos: data/isPending/isError/error/refetch + mutate/mutateAsync)
  mutationHooksLifecycle.ts (handlers: toast, logError, logDestructiveOp; invalidate no sucesso)
```

### Regras de cache

- Tags: `"programs"` e `"origem_types"` — **ambas** adicionadas em `tagTypes` de `src/features/api/baseApi.ts` (origem_types ainda é domínio legado; a tag serve para o add de programs invalidar o cache futuro do P3-35).
- Query: `providesTags: ["programs"]`; `skip: !userId`.
- addProgram: `invalidatesTags: ["programs", "origem_types"]` (espelha o `Promise.all` legado).
- updateProgram/deleteProgram: `invalidatesTags: ["programs"]`.
- `addProgram`: `user_id` de `supabase.auth.getUser()`; upsert de origem_types apenas quando `program.type === "pontos"` (com `onConflict: "id"`, color `#3b82f6`, account_type `"pontos"`).

### Contrato público preservado (shape)

- `useProgramsQuery()` → `{ data, isPending, isError, error, refetch }`.
- `useAddProgramMutation()` / `useUpdateProgramMutation()` / `useDeleteProgramMutation()` → `{ mutate, mutateAsync, isPending, ... }` com callbacks `onSuccess/onError`.
- Toasts pt-BR idênticos: `"Erro ao criar programa"`, `"Erro ao atualizar programa"`, `"Programa excluído com sucesso"`, `"Erro ao excluir programa"`.
- `logDestructiveOp("delete", "program")`.

## Arquivos e escopo (permitidos)

| Ação | Arquivo |
|---|---|
| criar | `src/features/programs/**` (index, programsApi, shared, endpoints, hooks, lifecycle) |
| modificar | `src/features/api/baseApi.ts` (+tags `programs`, `origem_types`) |
| modificar | `src/hooks/useDatabase/index.ts` (reexportar de `@/features/programs`, remover `./programs`) |
| excluir | módulo legado de programs (removido) |
| criar | `tests/unit/features-programs-api.test.ts` e `tests/unit/features-programs-hooks.test.ts` |
| modificar | `tests/unit/cache-invalidation.test.ts` (adicionar cobertura programs mantendo vendas/owners) |
| modificar | `docs/tasks/P3-34-blueprint-v4-p1-programs.md` (estado done ao final), `docs/MAP.md`, `docs/handoff.md`, `docs/tracking/*`, `docs/reports/*`, plano/spec histórica se referenciarem o módulo removido |

**Fora de escopo:** domínios não-programs (alerts/contas/clientes/entradas/origemTypes/owners/vendas), `shared.ts`/`mappers.ts` legados (ficam), UI/components.

## Verificação

1. `npx vitest run tests/unit/features-programs-api.test.ts tests/unit/features-programs-hooks.test.ts tests/unit/cache-invalidation.test.ts` — novos testes verdes;
2. `npm run test` — suíte completa verde;
3. `npm run lint` — 0 erros;
4. `npm run typecheck` — ok;
5. `npm run rule:40` — barrel + RLS de `programs`;
6. `node scripts/verify-docs.mjs --strict` — sem refs quebradas;
7. `npm run pre-pr` — 0 errors (relatório HTML);
8. Code review por subagente (rule-38) antes do PR.