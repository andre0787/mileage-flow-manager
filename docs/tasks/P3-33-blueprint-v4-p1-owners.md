# Task Card — Blueprint v4.0 P1: Migração do domínio owners (RTK Query)

| Campo | Valor |
|-------|-------|
| `id` | P3-33 |
| `categoria` | refactor |
| `onda` | P1-A |
| `baseBranch` | main |
| `estado` | pending |
| `origem` | Blueprint MilesControl v4.0 (ground truth do usuário), fase P1 |
| `dependeDe` | P3-27 (fundação Feature-First) |

## Objetivo
Migrar o domínio **owners** para `src/features/owners/` usando RTK Query
(substituição gradual do TanStack React Query nos hooks `useDatabase/*`).

> **Reconciliação com a realidade (INTENT gate):** o card original
> (`P3-33-blueprint-v4-p1-relatorios.md`) assumia hooks de domínio para a página
> Relatorios — mas `Relatorios.tsx` consome dados via `useData()` (DataContext) e
> não tem hooks próprios em `useDatabase/`. O hook legado real restante alinhado a
> este card é o módulo `owners.ts` (`useOwnersQuery`, `useAddOwnerMutation`,
> `useUpdateOwnerMutation`, `useDeleteOwnerMutation`), consumido por
> `DataContext.tsx`, `Entradas.tsx` e `Configuracoes.tsx`. Card renomeado/reescrito
> para refletir o domínio de migração real.

## Não objetivos
- Migrar outros domínios (um domínio por PR): alerts (P3-32), programs (P3-34),
  origemTypes (P3-35).
- Nenhuma lib de UI nova (proibição de escopo Blueprint §6).

## Contexto
Hooks legados em `src/hooks/useDatabase/owners.ts` ainda usam TanStack React Query
(`useQuery`/`useMutation` + `queryClient.invalidateQueries`). Padrão canônico já
estabelecido: entradas (P3-28), contas (P3-29), clientes (P3-30), vendas (P3-31) —
`baseApi.injectEndpoints` + barrel `index.ts` + wrappers com shape público
(`data`, `isPending`, `isError`, `error`, `refetch`, `mutate`, `mutateAsync`,
callbacks `onSuccess`/`onError`) + tags RTK.

## Arquivos permitidos
- (preenchido na execução — inclui `src/features/owners/*` novo: barrel, api, endpoints, shared, hooks;
  tag `owners` em `src/features/api/baseApi.ts`; reexport no barrel `src/hooks/useDatabase/index.ts`;
  remoção de `src/hooks/useDatabase/owners.ts`; spec e testes novos do domínio
  (`tests/unit/features-owners-*.test.ts` definidos na execução);
  artefatos de workflow: card, MAP, RADAR, tracking, relatório, handoff)

## Critérios de aceite
- [ ] Hooks do domínio owners migrados para RTK Query em `src/features/owners/`.
- [ ] Barrel `index.ts` presente (rule-40) e `npm run rule:40` verde.
- [ ] Suíte completa verde (`npm run test`), lint, typecheck.

## Riscos / Invariantes
- Manter contrato público dos hooks consumidos por `DataContext`/`Entradas`/`Configuracoes`
  (sem quebra de API: `data`, `isPending`/`isLoading`, `mutate`).
- Não remover TanStack React Query até todos os domínios migrados.
- `useOwnersQuery` alimenta `DataContext.owners` → remover do DataContext
  implicitamente desliga venda/compra de owners; manter shape do barrel.

## Testes obrigatórios
- `npm run test` (unit), `npm run lint`, `npm run typecheck`
- `npm run rule:40`, `npm run pre-pr`

## Evidência de pronto
- Spec + `npm run pre-pr` verde; PR único para `main` com eventos
  `coding:done`/`code-review:done` (subagent:true).