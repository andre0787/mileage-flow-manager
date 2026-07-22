# Task Card — Deletar artefatos obsoletos do archive

| Campo | Valor |
|-------|-------|
| `id` | P3-23 |
| `categoria` | chore |
| `onda` | P3 |
| `baseBranch` | main |
| `estado` | done ✅ |
| `origem` | auditoria ponytail 2026-07-22, item #1 |
| `dependeDe` | — |
| `feedbackRef` | — |

## Objetivo
Remover 5 arquivos obsoletos de `docs/archive/` que o próprio `MAP.md` já classifica como "artefatos obsoletos", e atualizar `MAP.md` para não referenciá-los.

## Não objetivos
- Não alterar arquivos de `docs/archive/specs/`, `docs/archive/plans/`, `docs/archive/council/` (são históricos legítimos)
- Não deletar `docs/AGENDA.md` (ainda referenciado por 5+ scripts — esforço > benefício)
- Não alterar `scripts/verify-docs.mjs` (só lista `docs/archive/` como um todo)

## Contexto
`docs/MAP.md:96` lista 5 arquivos como "artefatos obsoletos" mas eles nunca foram deletados:

Os 5 arquivos foram deletados conforme planejado. Nenhum script ou doc os referenciava (fora o MAP.md, que foi atualizado).

## Arquivos permitidos
- `docs/MAP.md`

> Nota: os 5 arquivos (`AVALIAR_ITENS_BUG_E_MELHORIA_HUMANO.md`, `progress.md`, `task_plan.md`, `SPRINT5-QUICKSTART.md`, `mobile-ios-notes.md`) foram deletados conforme o plano.

## Critérios de aceite
- [x] Os 5 arquivos foram deletados do disco
- [x] `docs/MAP.md` não referencia mais os 5 arquivos como obsoletos (substituir por "Nenhum — todos removidos")
- [x] `npm run verify-docs` passa (0 issues)
- [x] `git status` limpo

## Riscos / Invariantes
- `verify-docs.mjs` não lista arquivos individuais do archive — só a pasta `docs/archive/` é ignorada. Não deve quebrar.
- Nenhum script lê esses arquivos. Confirmado via `grep -rn` em toda a base.

## Testes obrigatórios
- `npm run verify-docs`
- `npm test` (regras não-testam archive)
- `npm run check:fast`

## Evidência de pronto
- Listagem de `docs/archive/` antes/depois (3 subpastas mantidas, 5 arquivos removidos)
- `diff` da alteração em `MAP.md`
