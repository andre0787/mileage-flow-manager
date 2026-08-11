# P3-31 — Design: migração de vendas para RTK Query

## Intento
Migrar os quatro hooks do domínio `vendas` de TanStack React Query para RTK
Query, preservando o contrato consumido por componentes que importam o barrel
`@/hooks/useDatabase`.

INTENT: código fazia consulta e mutations Supabase no hook legado de vendas;
testes esperam os mesmos hooks, callbacks, estados e efeitos de cache; esta spec
diz que endpoints RTK Query em `src/features/vendas/` devem substituir apenas o
módulo legado de vendas.

## Arquitetura
- `vendasApi.ts` injeta `getVendas`, `addVenda`, `updateVenda` e
  `deleteVenda` em `baseApi`.
- `shared.ts` (se existir) centraliza `VendaUpdate`, mapeamento, Supabase,
  conversão de erros e tipo do builder. (Atualmente não há shared.ts pois o
  domínio é simples.)
- Cada endpoint mantém os campos snake_case do banco e tags `vendas`; delete
  também invalida `vendas`, como o hook legado.
- `hooks.ts` adapta os hooks gerados ao shape público (`data`, `isPending`,
  `isError`, `error`, `refetch`, `mutate`, `mutateAsync` e callbacks).
- O barrel legado reexporta `@/features/vendas`; TanStack Query permanece nos
  domínios ainda não migrados e é usado somente para invalidar o cache de vendas.

## Regras de cache e segurança
- `getVendas` recebe `userId` e usa `skip` quando não há usuário.
- A query usa a tag `vendas`; add/update invalidam `vendas`; delete invalida
  `vendas`.
- A inserção obtém o usuário autenticado via Supabase Auth e mantém RLS.
- Erros continuam passando por `logError` e toasts em português; delete mantém
  `logDestructiveOp` e o toast de sucesso.

## Arquivos e escopo
- `src/features/vendas/`: barrel, composição API, endpoints, shared (se aplicável)
  e wrappers.
- `src/features/api/baseApi.ts`: adiciona a tag `vendas`.
- `src/hooks/useDatabase/index.ts`: reexporta os quatro wrappers.
- módulo legado de vendas: removido após a migração.
- `tests/unit/features-vendas-api.test.ts` e
  `tests/unit/features-vendas-hooks.test.ts`: cobertura dos endpoints e shape.
  (Criar testes se necessário.)
- Artefatos de workflow: card, roadmap, MAP, RADAR, tracking e handoff.

## Verificação
- Testes focados, `npm run test`, `npm run lint`, `npm run typecheck`,
  `npm run rule:40` e `npm run pre-pr`.
- Nenhuma dependência nova, nenhuma alteração em outros domínios e nenhum ciclo
  Feature-First introduzido.