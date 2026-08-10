# Task Card — Blueprint v4.0 P1: Migração do domínio contas (RTK Query)

| Campo        | Valor                                                          |
| ------------ | -------------------------------------------------------------- |
| `id`         | P3-29                                                          |
| `categoria`  | refactor                                                       |
| `onda`       | P1-A                                                           |
| `baseBranch` | main                                                           |
| `estado`     | review                                                        |
| `origem`     | Blueprint MilesControl v4.0 (ground truth do usuário), fase P1 |
| `dependeDe`  | P3-27 (fundação Feature-First)                                 |

## Objetivo

Migrar o domínio **contas** para `src/features/contas/` usando RTK Query
(substituição gradual do TanStack React Query nos hooks `useDatabase/*`).

## Não objetivos

- Migrar outros domínios (um domínio por PR).
- Nenhuma lib de UI nova (proibição de escopo Blueprint §6).

## Contexto

Card placeholder — preenchido no início da execução (spec em
`docs/superpowers/specs/` + INTENT gate + reconciliação com a realidade).

## Arquivos permitidos

- `src/features/contas/*` (novo — módulos do domínio RTK Query)
- `src/features/contas/index.ts` (novo — barrel)
- `src/features/contas/contasApi.ts` (novo — composição de cinco endpoints RTK Query)
- `src/features/contas/shared.ts` (novo — dependências compartilhadas)
- `src/features/contas/getAccounts.ts` (novo — query RTK)
- `src/features/contas/addAccount.ts` (novo — mutation RTK)
- `src/features/contas/updateAccount.ts` (novo — mutation RTK)
- `src/features/contas/deleteAccount.ts` (novo — mutation RTK)
- `src/features/contas/recalcAccount.ts` (novo — mutation RTK)
- `src/features/contas/hooks.ts` (novo — wrapper de query)
- `src/features/contas/mutationHooksBasic.ts` (novo — wrappers add/update)
- `src/features/contas/mutationHooksLifecycle.ts` (novo — wrappers delete/recalc)
- `src/features/api/baseApi.ts` (tag sales para invalidação cruzada)
- `src/hooks/useDatabase/index.ts` (reexport compatível)
- (removido) src/hooks/useDatabase/accounts.ts (migração concluída)
- `src/components/BalanceReconcileBanner.tsx` (import compatível)
- `tests/unit/features-contas-api.test.ts` (novo)
- `tests/unit/features-contas-hooks.test.ts` (novo)
- `tests/unit/cache-invalidation.test.ts` (cobertura de wrappers RTK)
- `docs/superpowers/specs/2026-08-10-blueprint-v4-p1-contas-design.md` (spec)
- `docs/tasks/ROADMAP.md` (estado do card)
- `docs/MAP.md` (registro da spec)
- `docs/RADAR.md` (artefato de sessão)
- `docs/tracking/events.jsonl` (eventos)
- `docs/tracking/quality.jsonl`, `docs/handoff.md` (artefatos workflow)

## Critérios de aceite

- [x] Hooks do domínio contas migrados para RTK Query em `src/features/contas/`.
- [x] Barrel `index.ts` presente (rule-40) e `npm run rule:40` verde.
- [x] Suíte completa verde (`npm run test`), lint, typecheck.

## Riscos / Invariantes

- Manter contrato público dos hooks consumidos pelas páginas (sem quebra de API).
- Não remover TanStack React Query até todos os domínios migrados.

## Testes obrigatórios

- `npm run test` (unit), `npm run lint`, `npm run typecheck`
- `npm run rule:40`, `npm run pre-pr`

## Evidência de pronto

- Spec + `npm run pre-pr` verde; PR único para `main` com eventos
  `coding:done`/`code-review:done` (subagent:true).
