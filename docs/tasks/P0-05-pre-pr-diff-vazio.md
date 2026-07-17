# Task Card — pre-pr: detectar diff vazio corretamente

| Campo | Valor |
|-------|-------|
| `id` | P0-05 |
| `categoria` | fix |
| `onda` | P0 |
| `baseBranch` | main |
| `estado` | pending |
| `origem` | veredito 2026-07-17, item #5 |
| `dependeDe` | [] |

## Objetivo
Corrigir a detecção de diff vazio e a validação de relatório no `pre-pr`:
avaliar mudanças entre base e HEAD, staged e working tree — não depender só da
data atual.

## Não objetivos
- Reescrever todo o gerador de relatório.

## Contexto
O `pre-pr` pode terminar com saída zero mesmo sem mudanças reais, e a regra de
relatório depende da data atual, o que quebra quando workflows concorrentes
renomeiam relatórios (veredito: Advisor The Outsider).

## Arquivos permitidos
- `scripts/pre-pr.*` (localizar pelo package.json)
- `scripts/rules/*` (validação de relatório, se aplicável)

## Critérios de aceite
- [ ] Sem diff (base→HEAD + staged + working tree) ⇒ `pre-pr` falha com mensagem clara.
- [ ] Validação de relatório não depende apenas da data atual.
- [ ] Existe teste negativo (sem diff) e positivo (com diff) para a detecção.

## Riscos / Invariantes
- Não quebrar o caminho feliz atual de PRs com diff.

## Testes obrigatórios
- `npm test` (testes novo de script)
- `npm run pre-pr -- --strict` em branch sem alterações (esperado: falha).

## Evidência de pronto
- Logs das duas execuções (vazio/com diff).
