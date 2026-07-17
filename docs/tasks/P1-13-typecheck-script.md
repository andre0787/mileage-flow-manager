# Task Card — npm run typecheck no package.json + CI

| Campo | Valor |
|-------|-------|
| `id` | P1-13 |
| `categoria` | chore |
| `onda` | P1-B |
| `baseBranch` | main |
| `estado` | pending |
| `origem` | veredito 2026-07-17, item #13 |
| `dependeDe` | [] |

## Objetivo
Adicionar `npm run typecheck` (= `tsc --noEmit`) ao `package.json` e ao CI.

## Não objetivos
- Acoplar typecheck a watch/HMR (somente validação).

## Contexto
Hoje `npx tsc --noEmit` passa, mas não há atalho npm nem etapa no CI (veredito,
evidências da linha de base). Isso deixa regressões de tipo invisíveis no CI.

## Arquivos permitidos
- `package.json` (atalho `typecheck`)
- `.github/workflows/*.yml` (etapa typecheck)

## Critérios de aceite
- [ ] `npm run typecheck` executa `tsc --noEmit` com saída não-zero em erro.
- [ ] CI executa `npm run typecheck`.
- [ ] Introduzir erro de tipo em um arquivo faz CI falhar.

## Riscos / Invariantes
- Garantir `tsconfig.json` compatível (não mudar emit do build).

## Testes obrigatórios
- `npm run typecheck` local verde.
- Demonstração de CI falhando com tipo quebrado.

## Evidência de pronto
- Diff do package.json + YAML de CI + log.
