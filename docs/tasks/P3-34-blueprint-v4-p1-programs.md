# Task Card — Blueprint v4.0 P1: Migração do domínio programs (RTK Query)

| Campo | Valor |
|-------|-------|
| `id` | P3-34 |
| `categoria` | refactor |
| `onda` | P1-A |
| `baseBranch` | main |
| `estado` | pending |
| `origem` | Blueprint MilesControl v4.0 (ground truth do usuário), fase P1 |
| `dependeDe` | P3-27 (fundação Feature-First) |

## Objetivo
Migrar o domínio **programs** para `src/features/programs/` usando RTK Query
(substituição gradual do TanStack React Query nos hooks `useDatabase/*`).

> **Reconciliação com a realidade (INTENT gate):** o card original
> (`P3-34-blueprint-v4-p1-simulador-venda.md`) assumia hooks de domínio para o
> simulador de venda da página Vendas — mas `Vendas.tsx` consome dados via
> `useData()` (DataContext) e não tem hooks próprios em `useDatabase/`. O hook
> legado real restante alinhado a este card é o módulo `programs.ts`
> (`useProgramsQuery`, `useAddProgramMutation`, `useUpdateProgramMutation`,
> `useDeleteProgramMutation`), consumido por `DataContext.tsx`, `Entradas.tsx` e
> `Configuracoes.tsx`. Card renomeado/reescrito para refletir o domínio de
> migração real.

## Não objetivos
- Migrar outros domínios (um domínio por PR): alerts (P3-32), owners (P3-33),
  origemTypes (P3-35).
- Nenhuma lib de UI nova (proibição de escopo Blueprint §6).

## Contexto
Hooks legados em `src/hooks/useDatabase/programs.ts (removido)` ainda usam TanStack React Query
(`useQuery`/`useMutation` + `queryClient.invalidateQueries`). Padrão canônico já
estabelecido: entradas (P3-28), contas (P3-29), clientes (P3-30), vendas (P3-31) —
`baseApi.injectEndpoints` + barrel `index.ts` + wrappers com shape público
(`data`, `isPending`, `isError`, `error`, `refetch`, `mutate`, `mutateAsync`,
callbacks `onSuccess`/`onError`) + tags RTK.

## Arquivos permitidos
- (preenchido na execução — inclui `src/features/programs/*` novo: barrel, api, endpoints, shared, hooks;
  tag `programs` em `src/features/api/baseApi.ts`; reexport no barrel `src/hooks/useDatabase/index.ts`;
  remoção de `src/hooks/useDatabase/programs.ts (removido)`; spec e testes novos do domínio
  (`tests/unit/features-programs-*.test.ts` definidos na execução);
  artefatos de workflow: card, MAP, RADAR, tracking, relatório, handoff)

## Critérios de aceite
- [ ] Hooks do domínio programs migrados para RTK Query em `src/features/programs/`.
- [ ] Barrel `index.ts` presente (rule-40) e `npm run rule:40` verde.
- [ ] Suíte completa verde (`npm run test`), lint, typecheck.

## Riscos / Invariantes
- Manter contrato público dos hooks consumidos por `DataContext`/`Entradas`/`Configuracoes`
  (sem quebra de API: `data`, `isPending`/`isLoading`, `mutate`).
- Não remover TanStack React Query até todos os domínios migrados.
- `useProgramsQuery` alimenta `DataContext.programs` → manter shape do barrel.

## Testes obrigatórios
- `npm run test` (unit), `npm run lint`, `npm run typecheck`
- `npm run rule:40`, `npm run pre-pr`

## Evidência de pronto
- Spec + `npm run pre-pr` verde; PR único para `main` com eventos
  `coding:done`/`code-review:done` (subagent:true).