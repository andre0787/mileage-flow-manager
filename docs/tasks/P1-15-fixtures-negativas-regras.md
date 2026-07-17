# Task Card — Testes de regras com fixtures negativas/positivas

| Campo | Valor |
|-------|-------|
| `id` | P1-15 |
| `categoria` | test |
| `onda` | P1-B |
| `baseBranch` | main |
| `estado` | pending |
| `origem` | veredito 2026-07-17, item #15 |
| `dependeDe` | [] |

## Objetivo
Transformar os testes das regras em fixtures negativas/positivas: cada regra
deve provar que bloqueia uma violação, não apenas imprimir o estado atual.

## Não objetivos
- Reescrever regras em AST agora (isso é P1-16, somente onde compensa).

## Contexto
O veredito (Revisão C) aponta que os testes de regras são em boa parte
tautológicos — executam contra o estado atual e "passam". Sem fixture negativa,
não se sabe se a regra detectaria regressão.

## Arquivos permitidos
- `scripts/rules/__tests__/` (ou local equivalente)
- `scripts/rules/__fixtures__/` (novo: amostras inválidas/válidas)

## Critérios de aceite
- [ ] Cada regra tem pelo menos 1 fixture inválido (deve falhar) e 1 válido.
- [ ] Teste executa a regra contra ambos e verifica expectativa.
- [ ] Cobertura: regras sem fixture negativa são listadas como dívida.

## Riscos / Invariantes
- Fixtures não devem ser interpretadas como código real do produto.

## Testes obrigatórios
- `npm test`

## Evidência de pronto
- Relatório de cobertura de fixtures por regra.
