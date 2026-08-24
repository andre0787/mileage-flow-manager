# Task Card — Blueprint v4.0 P1: Migração do domínio entradas (RTK Query)

| Campo | Valor |
|-------|-------|
| `id` | P3-28 |
| `categoria` | refactor |
| `onda` | P1-A |
| `baseBranch` | main |
| `estado` | done |
| `origem` | Blueprint MilesControl v4.0 (ground truth do usuário), fase P1, item 2 |
| `dependeDe` | P3-27 (fundação Feature-First) |
| `capability` | implementation |

## Objetivo
Migrar o domínio **entradas** de (legado) src/hooks/useDatabase/entries.ts (433 linhas,
5 hooks TanStack React Query) para `src/features/entradas/` usando **RTK Query**,
preservando o contrato público dos 5 hooks via wrappers de compatibilidade — nenhum
consumidor (DataContext, Entradas.tsx, DeleteEntryDialog) quebra.

## Não objetivos
- Migrar outros domínios (contas P3-29, clientes P3-30, vendas P3-31, alerts
  P3-32, owners P3-33, programs P3-34, origem-types P3-35).
- Remover TanStack React Query (só após todos os domínios migrados).
- Nenhuma lib de UI nova (proibição de escopo Blueprint §6).

## Contexto
- Spec: `docs/superpowers/specs/2026-08-10-blueprint-v4-p1-entradas-design.md`.
- Consumidores importam via barrel `@/hooks/useDatabase` (index.ts) — sem imports
  diretos de `./entries` fora do barrel.
- Lógica interna: insert com recorrência (`generateRecurringEntries`), delta de saldo
  de contas (`calcAccountUpdate`/`calcProportionalCost`), reversão de source, delete em
  cascata por `parentEntryId`, invalidação de cache entries+accounts com toast/logError.
- P3-27 entregou `store.ts` + `api/baseApi.ts` (placeholder, sem endpoints) — este card
  registra `baseApi` (reducer + middleware) e define `tagTypes`.

## Arquivos permitidos
- `src/features/entradas/index.ts` (novo — barrel, rule-40)
- `src/features/entradas/entradasApi.ts` (novo — composição injectEndpoints)
- `src/features/entradas/addEntry.ts` (novo — mutation RTK)
- `src/features/entradas/confirmEntry.ts` (novo — mutation RTK)
- `src/features/entradas/updateEntry.ts` (novo — mutation RTK)
- `src/features/entradas/deleteEntry.ts` (novo — mutation RTK)
- `src/features/entradas/getEntries.ts` (novo — query RTK)
- `src/features/entradas/shared.ts` (novo — dependências compartilhadas)
- `src/features/entradas/hooks.ts` (novo — wrapper de query)
- `src/features/entradas/mutationHooksBasic.ts` (novo — wrappers de add/confirm)
- `src/features/entradas/mutationHooksLifecycle.ts` (novo — wrappers de update/delete)
- (legado) src/hooks/useDatabase/entries.ts (remover — migrado)
- `src/hooks/useDatabase/index.ts` (reexport dos 5 hooks de `@/features/entradas`)
- `src/features/store.ts` (registrar `baseApi.reducer` + middleware)
- `src/features/api/baseApi.ts` (tagTypes entries/accounts)
- `tests/unit/features-entradas-api.test.ts` (novo)
- `tests/unit/features-entradas-hooks.test.ts` (novo)
- `docs/MAP.md` (sync-map — rule-17)
- `docs/tasks/ROADMAP.md` (estado do card)
- `docs/RADAR.md` (sync)
- `docs/tracking/events.jsonl` (artefato gerado)
- `docs/tracking/quality.jsonl` (artefato gerado)
- `docs/superpowers/specs/2026-08-10-blueprint-v4-p0-design.md`
- `docs/superpowers/specs/2026-08-10-blueprint-v4-p1-entradas-design.md`
- `scripts/rules/rule-19-stock-validation.mjs`
- `scripts/rules/rule-40-architect.mjs`
- `scripts/rules/__fixtures__/code/stock-violation/*/src/hooks/useDatabase/sales.ts`
- `tests/unit/cache-invalidation.test.ts`
- `docs/handoff.md`

## Critérios de aceite
- [ ] `src/features/entradas/` com barrel `index.ts` (rule-40) e 5 hooks de compat com shape público preservado.
- [ ] (legado) src/hooks/useDatabase/entries.ts removido; barrel reexporta de `@/features/entradas`.
- [ ] Store registra `baseApi` (reducer + middleware); `tagTypes` entries/accounts.
- [ ] Testes novos verdes + suíte completa (`npm run test`), lint, typecheck.
- [ ] `npm run rule:40` verde; `npm run pre-pr` verde; PR único para `main`.

## Riscos / Invariantes
- Não alterar o comportamento de saldo de contas (delta/reversão/cascata) — corpo das
  mutations idêntico, apenas transportado para `queryFn`.
- Contrato público dos hooks preservado (`mutate/mutateAsync/isPending/data/error`).
- Sem libs de UI novas; grafo 0 ciclos (sem ciclo feature↔store).

## Testes obrigatórios
- `npm run test` (unit), `npm run lint`, `npm run typecheck`
- `npm run rule:40`, `npm run pre-pr`

## Evidência de pronto
- Spec `2026-08-10-blueprint-v4-p1-entradas-design.md`, `npm run pre-pr` verde,
  PR único para `main` com eventos `coding:done`/`code-review:done` (subagent:true).
