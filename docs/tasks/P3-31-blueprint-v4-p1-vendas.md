# Task Card — Blueprint v4.0 P1: Migração do domínio vendas (RTK Query)

| Campo | Valor |
|-------|-------|
| `id` | P3-31 |
| `categoria` | refactor |
| `onda` | P1-A |
| `baseBranch` | main |
| `estado` | review |
| `origem` | Blueprint MilesControl v4.0 (ground truth do usuário), fase P1 |
| `dependeDe` | P3-27 (fundação Feature-First) |

## Objetivo
Migrar o domínio **vendas** para `src/features/vendas/` usando RTK Query
(substituição gradual do TanStack React Query nos hooks `useDatabase/*`).

## Não objetivos
- Migrar outros domínios (um domínio por PR).
- Nenhuma lib de UI nova (proibição de escopo Blueprint §6).

## Contexto
Card placeholder — preenchido no início da execução (spec em
`docs/superpowers/specs/` + INTENT gate + reconciliação com a realidade).

## Arquivos permitidos
- `src/features/vendas/*`
- `src/features/vendas`
- `src/hooks/useDatabase/*`
- `src/hooks/useDatabase/index.ts`
- (removido) src/hooks/useDatabase/sales.ts (migração concluída em P3-31)
- `src/hooks/useDatabase/mappers.ts`
- `src/features/api/baseApi.ts`
- `tests/unit/features-vendas-api.test.ts`
- `tests/unit/features-vendas-hooks.test.ts`
- `tests/unit/cache-invalidation.test.ts`
- `docs/tasks/P3-31-blueprint-v4-p1-vendas.md`
- `docs/superpowers/specs/2026-08-10-blueprint-v4-p1-vendas-design.md`
- `docs/MAP.md`
- `docs/RADAR.md`
- `docs/tracking/*`
- `docs/tracking`
- `docs/reports/*`
- `docs/reports`
- `docs/handoff.md`

## Critérios de aceite
- [ ] Hooks do domínio vendas migrados para RTK Query em `src/features/vendas/`.
- [ ] Barrel `index.ts` presente (rule-40) e `npm run rule:40` verde.
- [ ] Suíte completa verde (`npm run test`), lint, typecheck.

## Riscos / Invariantes
- Manter contrato público dos hooks consumidos pelas páginas (sem quebra de API).
- Não remover TanStack React Query até todos os domínios migrados.

## Testes obrigatórios
- `npm run test` (unit), `npm run lint`, `npm run typecheck`
- `npm run rule:40`, `npm run pre-pr`

## Evidência de pronto
- Spec + `npm run pre-pr` verde; PR único para `main` com eventos
  `coding:done`/`code-review:done` (subagent:true).
