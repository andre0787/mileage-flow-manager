# Plano Canônico — editar data do extrato de Saldo (adiantamentos)

Slug: `editar-data-saldo-cliente` | Branch: `feat/clientes-editar-data-saldo` | Integração owner: agente principal
Classe: complex (migration com RLS + endpoint/mutation + UI; cruza DB/API/UI; toca ledger financeiro).
Veredito: `docs/council/2026-09-14-editar-data-saldo-veredito.md`. Spec base: `docs/superpowers/specs/credito-cliente.md`.

## INTENT

Código exibe `created_at` como data do extrato e nega UPDATE (append-only);
o task espera editar a data só de adiantamentos (`earn`, `sale_id` nulo) com
reordenação; a spec/migração diz saldo sempre derivado e ledger append-only
de valor/kind. Divergência = reporte, não edição.

## 1. Success criteria

- Linha de adiantamento no extrato tem lápis; editar salva `created_at` e o
  extrato reordena por data; toast Sonner pt-BR confirma/erro.
- `spend`/`reversal`/`earn` com venda continuam sem edição.
- `npx tsc --noEmit` limpo; teste novo da trava de escopo + conversão de data verde.
- `npm run pre-pr` verde; rules 38/39 com evidência subagente; rule-43 ok
  (migration nova, nenhuma existente tocada, RLS com `auth.uid()`).

## 2. Scope / non-goals

In: migration UPDATE policy; endpoint `updateClientCreditDate` + hook;
UI em `ClientCreditInfo`; teste unitário escopo/data.
Out: coluna nova; editar valor/kind/note; editar spend/reversal/earn com
venda; reversal-reinsert; backfill histórico.

## 3. DAG / waves

- Wave 1 (worker único, sequencial): migration → endpoint+hook → UI → teste.
- Wave 2 (owner): inspeção do diff, `check:fast` afetado, review subagente
  (rule-38), `pre-pr` + relatório HTML, PR → `main`, `post-pr`.

## 4. Workstream boundaries (one-writer)

Worker (todos os arquivos abaixo; NÃO toca outros):
`supabase/migrations/20260914120000_update_client_credit_date.sql` (novo;
se o timestamp colidir, usar o próximo livre — nunca editar migrations
existentes), `src/features/clientes/updateCreditDate.ts` (novo, espelhar
`advance.ts`: auth, `toQueryError`, trava `kind==='earn' && sale_id===null`,
`created_at = date+T12:00:00-03:00`), registro em
`src/features/clientes/clientesApi.ts`, hook em
`src/features/clientes/hooks.ts` (+ export em `index.ts` e
`src/hooks/useDatabase/index.ts` se necessário), UI em
`src/pages/Clientes.tsx` (`ClientCreditInfo` apenas), teste novo
`tests/unit/clientCreditDate.test.ts`.

- Handoff único: identidade, arquivos, comandos+exit, omissões, desvios,
  riscos, notas. Sem `console.log`, sem `any`, `refetchType:'all'` se usar
  `invalidateQueries`, diff por arquivo ≤ 150 linhas (rule-41).

## 5. Acceptance checks

`npx tsc --noEmit`; `npx vitest run tests/unit/clientCreditDate.test.ts`
(ou o runner padrão do repo); manual: editar data de adiantamento reordena;
recusar edição em spend/reversal (sem botão); pre-pr verde.

## 6. Integração e rollback

Owner inspeciona diff + evidências e roda checks afetados.
Rollback: `git revert` + `DROP POLICY` da policy criada (migration down manual).

## 7. Riscos

- UPDATE policy ampla demais permitiria editar valor/kind via API direta
  (mitigado: trava de escopo no endpoint + policy só para dono da linha;
  considerar trigger de coluna numa iteração futura).
- `created_at` original perdido após edição (aceito pelo dono; sem auditoria).
- Fuso: reutilizar o padrão `T12:00:00-03:00` + `isValidISODate`/`formatDateBR`.

## 8. Progresso

- [x] Council + veredito + plano
- [x] Implementação (subagente, `coding:done`)
- [x] Review (subagente delegate: 7 achados, 5 corrigidos, 2 riscos aceitos) + fixes (worker, 12/12 testes)
- [x] pre-pr verde + relatório HTML + commit na branch
- [ ] Push + PR → `main` (aguarda AUTH do dono)
