# P3-29 — Design: migração de contas para RTK Query

## Intento
Migrar os cinco hooks do domínio `contas` de TanStack React Query para RTK Query,
preservando o contrato consumido por `DataContext`, `Contas.tsx` e demais páginas.
`alerts.ts` permanece fora deste card.

## Arquitetura
- `src/features/contas/contasApi.ts`: injeta cinco endpoints em `baseApi`:
  `getAccounts`, `addAccount`, `updateAccount`, `deleteAccount` e `recalcAccount`.
- `src/features/contas/shared.ts`: tipos e dependências comuns, incluindo `mapAccount`
  e conversão de erros para `FetchBaseQueryError`.
- `src/features/contas/hooks.ts` e módulos de wrappers: preservam
  `data`, `mutate`, `mutateAsync`, `isPending`, callbacks, logs e toasts.
- `src/features/contas/index.ts`: barrel público; `useDatabase/index.ts` passa a
  reexportar os wrappers do novo domínio.

## Regras de cache e segurança
- `getAccounts` recebe `userId` como argumento e usa `skip` quando não há usuário.
- A chave efetiva do RTK Query inclui o `userId`, evitando reutilização entre sessões.
- `accounts` é invalidada em todas as mutations; `entries` e `sales` também são
  invalidadas em delete/recalc, reproduzindo o comportamento anterior.
- As queries Supabase mantêm RLS e os mesmos filtros/colunas.

## Comportamento preservado
- Add/update/delete mantêm os mapeamentos snake_case e as atualizações otimistas
  observáveis pelos consumidores.
- Recalc mantém a fonte de verdade baseada em entradas confirmadas e vendas não
  canceladas, com saldo e investimento não negativos.
- Erros continuam registrados com `logError`; delete mantém o log destrutivo e toast
  existentes; recalc mantém seus toasts e logs de erro.

## Verificação
- Testes de API cobrem os cinco endpoints, isolamento por usuário, tags e cálculo de
  recálculo.
- Testes de wrappers cobrem o contrato público e callbacks.
- `npm test`, `npm run typecheck`, `npm run rule:40`, rule-19/41 e `npm run pre-pr`.
- Nenhuma dependência nova; nenhum ciclo no grafo.
