# Task Card — Blueprint v4.0 P1: Migração do domínio clientes (RTK Query)

| Campo | Valor |
|-------|-------|
| `id` | P3-30 |
| `categoria` | refactor |
| `onda` | P1-A |
| `baseBranch` | main |
| `estado` | done |
| `origem` | Blueprint MilesControl v4.0 (ground truth do usuário), fase P1 |
| `dependeDe` | P3-27 (fundação Feature-First) |

## Objetivo
Migrar o domínio **clientes** para `src/features/clientes/` usando RTK Query
(substituição gradual do TanStack React Query nos hooks `useDatabase/*`).

## Não objetivos
- Migrar outros domínios (um domínio por PR).
- Nenhuma lib de UI nova (proibição de escopo Blueprint §6).

## Contexto
Spec: `docs/superpowers/specs/2026-08-10-blueprint-v4-p1-clientes-design.md`.
A implementação segue os endpoints e wrappers descritos na spec, reconciliados
com o hook legado de clientes e os padrões dos domínios migrados.

## Arquivos permitidos
- `src/features/clientes/*` (módulos do domínio RTK Query)
- `src/features/clientes/index.ts` (barrel Feature-First)
- `src/features/clientes/clientesApi.ts` (composição de endpoints RTK Query)
- `src/features/clientes/shared.ts` (tipos, mapper e dependências compartilhadas)
- `src/features/clientes/getClients.ts` (query RTK)
- `src/features/clientes/addClient.ts` (mutation RTK)
- `src/features/clientes/updateClient.ts` (mutation RTK)
- `src/features/clientes/deleteClient.ts` (mutation RTK)
- `src/features/clientes/hooks.ts` (wrapper de query)
- `src/features/clientes/mutationHooksBasic.ts` (wrappers add/update)
- `src/features/clientes/mutationHooksLifecycle.ts` (wrapper delete)
- `src/features/api/baseApi.ts` (tag `clients`)
- `src/hooks/useDatabase/index.ts` (reexport compatível)
- `src/hooks/useDatabase/clients.*` (módulo legado removido)
- `tests/unit/cache-invalidation.test.ts` (cobertura de invalidação RTK)
- `tests/unit/features-clientes-api.test.ts`
- `tests/unit/features-clientes-hooks.test.ts`
- `docs/superpowers/specs/2026-08-10-blueprint-v4-p1-clientes-design.md`
- `docs/tasks/ROADMAP.md`
- `docs/MAP.md`
- `docs/RADAR.md`
- `docs/tracking/events.jsonl`
- `docs/tracking/quality.jsonl`
- `docs/handoff.md`
- `package.json` (serialização da suíte unitária)
- `tests/unit/scripts-pre-pr.test.ts` (cenário de relatório ausente)
- `scripts/pre-pr-check.mjs` (timeout da suíte unitária)

## Critérios de aceite
- [x] Hooks do domínio clientes migrados para RTK Query em `src/features/clientes/`.
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
