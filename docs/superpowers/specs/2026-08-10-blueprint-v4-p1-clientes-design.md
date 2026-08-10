# P3-30 — Design: migração de clientes para RTK Query

## Intento
Migrar os quatro hooks do domínio `clientes` de TanStack React Query para RTK
Query, preservando o contrato consumido por `Clientes.tsx`, `Vendas.tsx`,
`DataContext` e componentes que importam o barrel `@/hooks/useDatabase`.

INTENT: código fazia consulta e mutations Supabase no hook legado de clientes;
testes esperam os mesmos hooks, callbacks, estados e efeitos de cache; esta spec
diz que endpoints RTK Query em `src/features/clientes/` devem substituir apenas o
módulo legado de clientes.

## Arquitetura
- `clientesApi.ts` injeta `getClients`, `addClient`, `updateClient` e
  `deleteClient` em `baseApi`.
- `shared.ts` centraliza `ClientUpdate`, mapeamento, Supabase, conversão de erros
  e tipo do builder.
- Cada endpoint mantém os campos snake_case do banco e tags `clients`; delete
  também invalida `sales`, como o hook legado.
- `hooks.ts`, `mutationHooksBasic.ts` e `mutationHooksLifecycle.ts` adaptam os
  hooks gerados ao shape público (`data`, `isPending`, `isError`, `error`,
  `refetch`, `mutate`, `mutateAsync` e callbacks).
- O barrel legado reexporta `@/features/clientes`; TanStack Query permanece nos
  domínios ainda não migrados e é usado somente para invalidar o cache de vendas.

## Regras de cache e segurança
- `getClients` recebe `userId` e usa `skip` quando não há usuário.
- A query usa a tag `clients`; add/update invalidam `clients`; delete invalida
  `clients` e `sales`.
- A inserção obtém o usuário autenticado via Supabase Auth e mantém RLS.
- Erros continuam passando por `logError` e toasts em português; delete mantém
  `logDestructiveOp` e o toast de sucesso.

## Arquivos e escopo
- `src/features/clientes/`: barrel, composição API, endpoints, shared e wrappers.
- `src/features/api/baseApi.ts`: adiciona a tag `clients`.
- `src/hooks/useDatabase/index.ts`: reexporta os quatro wrappers.
- módulo legado de clientes: removido após a migração.
- `tests/unit/features-clientes-api.test.ts` e
  `tests/unit/features-clientes-hooks.test.ts`: cobertura dos endpoints e shape.
- Artefatos de workflow: card, roadmap, MAP, RADAR, tracking e handoff.

## Verificação
- Testes focados, `npm run test`, `npm run lint`, `npm run typecheck`,
  `npm run rule:40` e `npm run pre-pr`.
- Nenhuma dependência nova, nenhuma alteração em outros domínios e nenhum ciclo
  Feature-First introduzido.
