# Task Card — Retirar CHANGELOG.md obsoleto

| Campo | Valor |
|-------|-------|
| `id` | P3-24 |
| `categoria` | chore |
| `onda` | P3 |
| `baseBranch` | main |
| `estado` | done ✅ |
| `origem` | auditoria ponytail 2026-07-22, item #2 |
| `dependeDe` | — |
| `feedbackRef` | — |

## Objetivo
Remover `CHANGELOG.md` (última atualização: Sprint #6, 2026-07-09 — 9 sprints atrás) e atualizar `scripts/verify-docs.mjs` para não esperá-lo.

## Não objetivos
- Não criar substituto para CHANGELOG (ninguém manteve por 9 sprints — YAGNI)
- Não alterar outras referências (só `verify-docs.mjs` lista CHANGELOG.md como entry doc)

## Contexto
`CHANGELOG.md` na raiz do projeto, 86 linhas. Última entrada documenta Sprint #6 (Jul 9). De lá pra cá foram ~9 sprints e dezenas de PRs. Ninguém manteve o arquivo.

O único lugar que o referencia é `scripts/verify-docs.mjs:170`:
```
const entryDocs = ["...", "CHANGELOG.md", ...];
```

## Arquivos permitidos
- `CHANGELOG.md` (raiz)
- `scripts/verify-docs.mjs`

## Critérios de aceite
- [x] `CHANGELOG.md` deletado
- [x] `scripts/verify-docs.mjs:170` — `"CHANGELOG.md"` removido da array `entryDocs`
- [x] `npm run verify-docs` passa (0 issues)
- [x] `npm run check:fast` passa

## Riscos / Invariantes
- `verify-docs.mjs` é o único validador que lista entry docs. Remover da array é suficiente.
- Nenhum outro script, teste ou doc referencia `CHANGELOG.md` (confirmado via `grep -rn`).

## Testes obrigatórios
- `npm run verify-docs`
- `npm run check:fast`

## Evidência de pronto
- `diff` da alteração em `verify-docs.mjs`
- Log confirmando `CHANGELOG.md` removido e `verify-docs` verde
