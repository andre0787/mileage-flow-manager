# Task Card — Blueprint v4.0 P1: Migração do domínio origem-types (RTK Query)

| Campo | Valor |
|-------|-------|
| `id` | P3-35 |
| `categoria` | refactor |
| `onda` | P1-A |
| `baseBranch` | main |
| `estado` | done |
| `origem` | Blueprint MilesControl v4.0 (ground truth do usuário), fase P1 |
| `dependeDe` | P3-27 (fundação Feature-First) |

## Objetivo
Migrar o domínio **origem-types** para `src/features/origem-types/` usando RTK Query
(substituição gradual do TanStack React Query nos hooks `useDatabase/*`).

> **Reconciliação com a realidade (INTENT gate):** o card original
> (`P3-35-blueprint-v4-p1-dashboard.md`) assumia hooks de domínio para a página
> Dashboard — mas `Dashboard.tsx` consome dados via `useData()` (DataContext) e
> não tem hooks próprios em `useDatabase/`. O hook legado real restante alinhado a
> este card é o módulo `origemTypes.ts` (`useOrigemTypesQuery`,
> `useAddOrigemTypeMutation`, `useUpdateOrigemTypeMutation`,
> `useDeleteOrigemTypeMutation`), consumido por `DataContext.tsx`, `Entradas.tsx` e
> `Configuracoes.tsx`. Card renomeado/reescrito para refletir o domínio de
> migração real.

## Não objetivos
- Migrar outros domínios (um domínio por PR): alerts (P3-32), owners (P3-33),
  programs (P3-34).
- Nenhuma lib de UI nova (proibição de escopo Blueprint §6).

## Contexto
Hooks legados em `src/hooks/useDatabase/origemTypes.ts (removido)` ainda usam TanStack React
Query (`useQuery`/`useMutation` + `queryClient.invalidateQueries`). Padrão canônico
já estabelecido: entradas (P3-28), contas (P3-29), clientes (P3-30), vendas (P3-31) —
`baseApi.injectEndpoints` + barrel `index.ts` + wrappers com shape público
(`data`, `isPending`, `isError`, `error`, `refetch`, `mutate`, `mutateAsync`,
callbacks `onSuccess`/`onError`) + tags RTK.

## Arquivos permitidos
- (preenchido na execução — inclui `src/features/origem-types/*` novo: barrel, api, endpoints, shared, hooks;
  tag `origem_types` em `src/features/api/baseApi.ts`; reexport no barrel `src/hooks/useDatabase/index.ts`;
  remoção de `src/hooks/useDatabase/origemTypes.ts (removido)`; spec e testes novos do domínio
  (`tests/unit/features-origem-types-*.test.ts` definidos na execução);
  artefatos de workflow: card, MAP, RADAR, tracking, relatório, handoff)

## Critérios de aceite
- [x] Hooks do domínio origemTypes migrados para RTK Query em `src/features/origemTypes/`.
- [x] Barrel `index.ts` presente (rule-40) e `npm run rule:40` verde.
- [x] Suíte completa verde (`npm run test`), lint, typecheck.

## Riscos / Invariantes
- Manter contrato público dos hooks consumidos por `DataContext`/`Entradas`/`Configuracoes`
  (sem quebra de API: `data`, `isPending`/`isLoading`, `mutate`).
- Não remover TanStack React Query até todos os domínios migrados.
- `useOrigemTypesQuery` alimenta `DataContext.origemTypes` → manter shape do barrel.

## Testes obrigatórios
- `npm run test` (unit), `npm run lint`, `npm run typecheck`
- `npm run rule:40`, `npm run pre-pr`

## Evidência de pronto
- Spec + `npm run pre-pr` verde; PR único para `main` com eventos
  `coding:done`/`code-review:done` (subagent:true).