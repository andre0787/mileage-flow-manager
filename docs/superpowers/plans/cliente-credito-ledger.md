# Plano Canônico — Crédito por cliente (ledger + atomicidade)

Slug: `cliente-credito-ledger` | Branch: `feat/cliente-credito-ledger` | Integração owner: agente principal
Classe: complex (2 slices, migration com CREATE TABLE + RLS, cruza UI/API/DB). Spec: `docs/superpowers/specs/credito-cliente.md`.

## INTENT
Código aplica recebimento+crédito atomicamente e deriva saldo de ledger; teste espera excedente→earn, uso→spend, cancel→reversal e saldo convergente; spec diz `docs/superpowers/specs/credito-cliente.md`. Divergência = reporte, não edição.

## 1. Success criteria
- Excedente no recebimento gera `earn` automático (toast avisa); dialog permite `spend` manual misto; cancel estorna espelhado; saldo visível em dialog/tabela/cliente.
- `npm run pre-pr` verde; rules 38/39 com evidência subagente; rule-43 ok (migration nova com RLS).
- E2E reais C1–C6 verdes; testes de estorno como gate.

## 2. Scope / non-goals
In: migration `client_credit_movements` (+RLS); tipos/mappers; mutations add/update/cancelVenda com crédito atômico; lib `clientCredits.ts` (saldo derivado, extrato); dialog + tabela + card + ficha cliente; CSV com crédito? não — fora.
Out: expiração de crédito; transferência de crédito entre clientes; crédito em criação de venda (só recebimento/edição); conciliação automática.

## 3. DAG / waves
- Wave 1 paralelo: A=dados/API, B=UI (contrato: `Sale.amountReceived`, `ClientCredit {id,clientId,saleId,kind,amount}`, `getClientBalance(clientId)`, `receiveWithCredit(saleId, {cash, useCredit})`).
- Wave 2 (owner): integração + checks + 2 reviews + report + pre-pr + PR + CI + merge + **aplicar/sondar migration** + deploy + validar writes em prod.

## 4. Workstream boundaries (one-writer)
- Worker A (dados/API): `supabase/migrations/*_client_credit_movements.sql` (timestamp, CREATE TABLE + CREATE POLICY USING auth.uid()), `src/lib/supabase-types.ts`, `src/types/index.ts`, `src/lib/clientCredits.ts` (novo, puro), `src/hooks/useDatabase/mappers.ts`, `src/features/vendas/addVenda.ts`, `src/features/vendas/updateVenda.ts`, `src/features/vendas/cancelVenda.ts`, `src/features/clientes/*` (leitura de saldo/extrato), `tests/unit/client-credits*.test.ts`. NÃO toca SaleForm/Table/Row/Mobile/Vendas.tsx/SaleReceiveDialog.
- Worker B (UI): `src/components/sales/SaleReceiveDialog.tsx`, `SaleTable.tsx`, `SaleTableRow.tsx`, `SaleMobileCard.tsx`, `src/pages/Vendas.tsx` + ficha cliente (só leitura de saldo/extrato via contrato de A), `tests/vendas-credito.spec.ts` (C1–C6). Lê tipos como contrato. NÃO toca migration/mappers/API/ledger.
- Handoff único por worker: identidade, arquivos, comandos+exit, omissões, desvios, riscos, notas.

## 5. Acceptance checks
`npx tsc --noEmit`; unit ledger (derivação, clamps, estorno); E2E C1–C6 reais; manual: excedente→crédito, misto, cancel→estorno, reabertura mostra saldo.

## 6. Integração e rollback
Owner inspeciona diffs + evidências, resolve pelo plano, roda affected + cross-workstream. Rollback: `git revert` + migration down manual (`DROP TABLE client_credit_movements`).

## 7. Riscos
- Concorrência em recebimentos simultâneos (last-write-wins documentado; revalidação no UI).
- Arredondamento de centavos (clamp + epsilon 1e-9 como em amountReceived).
- Divergência soma/derivação (mitigado: saldo sempre derivado, append-only).
- Migration não aplicada em prod (gate: sondar colunas/tabela ANTES do merge).

## 8. Progresso
- [x] Council + veredito + spec + plano
- [ ] Worker A done
- [ ] Worker B done
- [ ] Integração + reviews + report + pre-pr + PR + CI + migration + prod
