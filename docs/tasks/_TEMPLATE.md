# Task Card — <TÍTULO>

| Campo | Valor |
|-------|-------|
| `id` | P?-NN |
| `categoria` | chore \| feat \| fix \| docs \| refactor |
| `onda` | P0 \| P1-A \| P1-B \| P2 |
| `baseBranch` | main |
| `estado` | pending \| planned \| implementing \| verified \| review \| done |
| `origem` | veredito 2026-07-17, item #N |
| `dependeDe` | [P?-NN, ...] |
| `feedbackRef` | opcional — issue #NN de feedback de usuário |
| `capability` | opcional — capability do router |
| `phase` | opcional — fase operacional |
| `modelProfileOverride` | opcional — perfil/alias validado pelo router |
| `retrySafety` | opcional — `read-only` ou `may-write` |

## Objetivo
<uma frase observável>

## Não objetivos
- <o que explicitamente não entra neste card>

## Contexto
<2-4 linhas. Onde está o problema hoje, com `caminho:linha`.>

## Arquivos permitidos
- `caminho/arquivo.ts`

## Critérios de aceite
- [ ] <critério verificável>
- [ ] <critério verificável>

## Riscos / Invariantes
- <o que não pode quebrar>

## Testes obrigatórios
- `npm run <comando>`
- <teste negativo/positivo, se aplicável>

## Evidência de pronto
- <artefato: diff, log, relatório, screenshot>
