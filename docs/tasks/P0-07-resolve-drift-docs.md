# Task Card — Resolver drift atual de docs

| Campo | Valor |
|-------|-------|
| `id` | P0-07 |
| `categoria` | docs |
| `onda` | P0 |
| `baseBranch` | main |
| `estado` | pending |
| `origem` | veredito 2026-07-17, item #7 |
| `dependeDe` | [] |

## Objetivo
Eliminar contradições concretas de documentação: handoff branch/commit, README
`develop` vs `main`, link quebrado, e referências a comandos inexistentes/AGENDA.

## Não objetivos
- Reescrever toda a documentação (consolidar referências apenas).

## Contexto
Veredito aponta: handoff observado desatualizado vs branch/commit real; README
ainda descreve PRs para `develop` enquanto workflow usa `main`; 1 link quebrado em
`docs/superpowers/plans/2026-07-15-context-optimization-plan.md`; documentação
promete comandos inexistentes; AGENDA referenciada mas precisa de arquivamento.

## Arquivos permitidos
- `README.md`
- `docs/handoff.md`
- `docs/superpowers/plans/2026-07-15-context-optimization-plan.md`
- `docs/AGENDA.md` (arquivar/se necessário)
- quaisquer docs que referenciem `develop` como alvo

## Critérios de aceite
- [ ] `npm run verify-docs` sem links quebrados.
- [ ] Nenhuma referência a `develop` como alvo de PR; alvo canônico = `main`.
- [ ] Handoff descreve corretamente branch/commit após `handoff:snapshot`.
- [ ] Comandos prometidos em docs existem em `package.json` ou são removidos.

## Riscos / Invariantes
- Não alterar semântica de scripts enquanto corrige texto.

## Testes obrigatórios
- `npm run verify-docs`

## Evidência de pronto
- Diff das correções + saída verde do verify-docs.
