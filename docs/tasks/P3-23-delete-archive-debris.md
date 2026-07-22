# Task Card — Deletar artefatos obsoletos do archive

| Campo | Valor |
|-------|-------|
| `id` | P3-23 |
| `categoria` | chore |
| `onda` | P3 |
| `baseBranch` | main |
| `estado` | pending |
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

| Arquivo | Tamanho | Motivo |
|---------|---------|--------|
| `docs/archive/AVALIAR_ITENS_BUG_E_MELHORIA_HUMANO.md` | 0 bytes | Vazio, nunca preenchido |
| `docs/archive/progress.md` | 1.1KB | Progresso do redesign visual (entregue em Jul 5) |
| `docs/archive/task_plan.md` | 1.8KB | Plano do redesign visual (implementado) |
| `docs/archive/SPRINT5-QUICKSTART.md` | 3.8KB | Guia da Sprint 5 (9 sprints atrás) |
| `docs/archive/mobile-ios-notes.md` | 2.6KB | Notas iOS, todos os itens marcados "Já ajustado" |

Nenhum script ou doc referencia esses arquivos (fora o MAP.md).

## Arquivos permitidos
- `docs/archive/AVALIAR_ITENS_BUG_E_MELHORIA_HUMANO.md`
- `docs/archive/progress.md`
- `docs/archive/task_plan.md`
- `docs/archive/SPRINT5-QUICKSTART.md`
- `docs/archive/mobile-ios-notes.md`
- `docs/MAP.md`

## Critérios de aceite
- [ ] Os 5 arquivos foram deletados do disco
- [ ] `docs/MAP.md` não referencia mais os 5 arquivos como obsoletos (substituir por "Nenhum — todos removidos")
- [ ] `npm run verify-docs` passa (não quebra por arquivos removidos do archive)
- [ ] `git status` limpo

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
