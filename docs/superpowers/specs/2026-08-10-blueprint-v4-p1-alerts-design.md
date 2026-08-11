# P3-32 — Design: migração de alerts para RTK Query

## Intento
Migrar os três hooks do domínio `alerts` de TanStack React Query para RTK
Query, preservando o contrato consumido por `Contas.tsx` e
`AccountAlertsDialog.tsx` via o barrel `@/hooks/useDatabase`.

INTENT: código legado de alerts fazia consulta e
mutations Supabase (query `account_alerts` ordenada por date desc, insert com
`user_id`, update de `read`), com `invalidateQueries(["account_alerts"])`,
toasts em pt-BR e `logError`; consumidores esperam `{ data }` da query e
`mutate`/`mutateAsync` + callbacks `onSuccess`/`onError` nas mutations; esta
spec diz que endpoints RTK Query em `src/features/alerts/` devem substituir
apenas o módulo legado de alerts, com tag `alerts` no cache.

## Arquitetura
- `alertsApi.ts` injeta `getAccountAlerts`, `addAccountAlert` e
  `toggleAccountAlert` em `baseApi` via `injectEndpoints`.
- `shared.ts` centraliza: `toQueryError`, tipo do builder, reexport de
  `supabase` e o mapper `mapAlert` (snake_case → camelCase: `account_id` →
  `accountId`, `user_id` → `userId`, `created_at` → `createdAt`).
- `getAccountAlerts`: query `AccountAlert[]` com `skip` quando não há usuário
  (`useUserId` do shared legado); `providesTags: ["alerts"]`; select `*` com
  `order("date", { ascending: false })` como o legado.
- `addAccountAlert`: mutation recebe `{ accountId, date, observation }`,
  obtém usuário via `supabase.auth.getUser()` (mantém RLS), insere com
  `read: false`, `invalidatesTags: ["alerts"]`.
- `toggleAccountAlert`: mutation recebe `{ id, read }`, faz update de `read`
  por `id`, `invalidatesTags: ["alerts"]`.
- `hooks.ts` adapta os hooks gerados ao shape público (`data`, `isPending`,
  `isError`, `error`, `refetch`, `mutate`, `mutateAsync` e callbacks).
- O barrel legado reexporta `@/features/alerts`; TanStack permanece nos
  domínios não migrados.

## Regras de cache e segurança
- `getAccountAlerts` usa `skip` quando `userId` é nulo.
- add/toggle invalidam a tag `alerts` (difusão via `baseApi.util.invalidateTags`).
- Erros passam por `logError` e toasts em português (mesmos textos do legado:
  "Alerta adicionado", "Erro ao adicionar alerta", "Erro ao atualizar alerta").
- Sem quebra de API: `useAccountAlerts()` continua retornando `data` com
  default `[]` no consumidor (Contas usa `= []`).

## Arquivos e escopo
- `src/features/alerts/`: barrel `index.ts`, `alertsApi.ts`, `shared.ts`,
  `getAccountAlerts.ts`, `addAccountAlert.ts`, `toggleAccountAlert.ts`,
  `hooks.ts` (wrappers básicos — sem lifecycle especial, domínio simples).
- `src/features/api/baseApi.ts`: adiciona a tag `"alerts"` a `tagTypes`.
- `src/hooks/useDatabase/index.ts`: reexporta os três wrappers
  (`useAccountAlerts`, `useAddAccountAlertMutation`, `useToggleAccountAlertMutation`).
- módulo legado de alerts: removido após a migração.
- `tests/unit/features-alerts-api.test.ts` e
  `tests/unit/features-alerts-hooks.test.ts`: cobertura dos endpoints e do shape
  público (padrão dos testes de vendas/clientes).
- Artefatos de workflow: card, MAP, RADAR, tracking e handoff.

## Verificação
- Testes focados, `npm run test`, `npm run lint`, `npm run typecheck`,
  `npm run rule:40`, `npm run pre-pr`.
- Nenhuma dependência nova, nenhuma alteração em outros domínios e nenhum ciclo
  Feature-First introduzido.