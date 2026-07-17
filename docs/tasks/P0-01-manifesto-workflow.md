# Task Card — Manifesto único de workflow

| Campo | Valor |
|-------|-------|
| `id` | P0-01 |
| `categoria` | docs |
| `onda` | P0 |
| `baseBranch` | main |
| `estado` | pending |
| `origem` | veredito 2026-07-17, item #1 |
| `dependeDe` | [] |

## Objetivo
Estabelecer um único documento canônico que define categorias, estados, comandos
obrigatórios, alvo de PR, artefatos e política de bypass do workflow.

## Não objetivos
- Reescrever CONVENTIONS/WORKFLOW inteiros (consolidar, não expandir).
- Migrar skills agora.

## Contexto
Hoje a fonte de verdade está espalhada entre `AGENTS.md`, `WORKFLOW.md`,
`CONVENTIONS.md`, `README.md` e `docs/handoff.md`. Um agente novo não sabe qual é
autoritativo (ver veredito: Advisor The Outsider e The Contrarian).

## Arquivos permitidos
- novo manifesto canônico em `docs/` _(arquivo WORKFLOW-MANIFEST, criado por este card)_
- `docs/WORKFLOW.md` (passa a apontar p/ o manifesto)
- `AGENTS.md` (linha apontando p/ o manifesto)
- `README.md` (apontar p/ o manifesto)

## Critérios de aceite
- [ ] `WORKFLOW-MANIFEST.md` contém: categorias, estados, comandos obrigatórios,
      alvo de PR (`main`), artefatos por estado e política de bypass (`--no-verify`).
- [ ] Demais docs referenciam o manifesto como fonte única; não há definições
      conflitantes de alvo de PR nem de comandos obrigatórios.
- [ ] `npm run verify-docs` passa (sem links quebrados).

## Riscos / Invariantes
- Não quebrar links internos existentes.
- Não remover conteúdo histórico sem archiving.

## Testes obrigatórios
- `npm run verify-docs`

## Evidência de pronto
- Diff do manifesto + diff de referências; relatório de verify-docs verde.
