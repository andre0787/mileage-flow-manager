# Task Card — Blueprint v4.0 P1: Migração do domínio alerts (RTK Query)

| Campo | Valor |
|-------|-------|
| `id` | P3-32 |
| `categoria` | refactor |
| `onda` | P1-A |
| `baseBranch` | main |
| `estado` | pending |
| `origem` | Blueprint MilesControl v4.0 (ground truth do usuário), fase P1 |
| `dependeDe` | P3-27 (fundação Feature-First) |

## Objetivo
Migrar o domínio **alerts** para `src/features/alerts/` usando RTK Query
(substituição gradual do TanStack React Query nos hooks `useDatabase/*`).

> **Reconciliação com a realidade (INTENT gate):** o card original
> (`P3-32-blueprint-v4-p1-controle-cpf.md`) assumia hooks de domínio para a
> página ControleCPF — mas `ControleCPF.tsx` consome dados via `useData()`
> (DataContext) e não tem hooks próprios em `useDatabase/`. O hook legado real
> restante alinhado a este card é o módulo `alerts.ts`
> (`useAccountAlerts`, `useAddAccountAlertMutation`, `useToggleAccountAlertMutation`),
> consumido por `Contas.tsx` e `AccountAlertsDialog.tsx`. Card renomeado/reescrito
> para refletir o domínio de migração real.

## Não objetivos
- Migrar outros domínios (um domínio por PR): owners (P3-33), programs (P3-34),
  origemTypes (P3-35).
- Nenhuma lib de UI nova (proibição de escopo Blueprint §6).

## Contexto
Hooks legados em `src/hooks/useDatabase/alerts.ts` ainda usam TanStack React Query
(`useQuery`/`useMutation` + `queryClient.invalidateQueries`). Padrão canônico já
estabelecido: entradas (P3-28), contas (P3-29), clientes (P3-30), vendas (P3-31) —
`baseApi.injectEndpoints` + barrel `index.ts` + wrappers com shape público
(`data`, `isPending`, `isError`, `error`, `refetch`, `mutate`, `mutateAsync`,
callbacks `onSuccess`/`onError`) + tags RTK.

## Arquivos permitidos
- (preenchido na execução — inclui `src/features/alerts/*` novo: barrel, api, endpoints, shared, hooks;
  tag `alerts` em `src/features/api/baseApi.ts`; reexport no barrel `src/hooks/useDatabase/index.ts`;
  remoção de `src/hooks/useDatabase/alerts.ts`; spec e testes novos do domínio
  (`tests/unit/features-alerts-*.test.ts` definidos na execução);
  artefatos de workflow: card, MAP, RADAR, tracking, relatório, handoff)

## Critérios de aceite
- [ ] Hooks do domínio alerts migrados para RTK Query em `src/features/alerts/`.
- [ ] Barrel `index.ts` presente (rule-40) e `npm run rule:40` verde.
- [ ] Suíte completa verde (`npm run test`), lint, typecheck.

## Riscos / Invariantes
- Manter contrato público dos hooks consumidos por `Contas`/`AccountAlertsDialog`
  (sem quebra de API: `data`, `isPending`/`isLoading`, `mutate`).
- Não remover TanStack React Query até todos os domínios migrados.

## Testes obrigatórios
- `npm run test` (unit), `npm run lint`, `npm run typecheck`
- `npm run rule:40`, `npm run pre-pr`

## Evidência de pronto
- Spec + `npm run pre-pr` verde; PR único para `main` com eventos
  `coding:done`/`code-review:done` (subagent:true).