# Task Card — Regra de escopo (diff ≠ arquivosPermitidos)

| Campo | Valor |
|-------|-------|
| `id` | P1-10 |
| `categoria` | feat |
| `onda` | P1-A |
| `baseBranch` | main |
| `estado` | pending |
| `origem` | veredito 2026-07-17, item #10 |
| `dependeDe` | [P1-08] |

## Objetivo
Regra que falha quando o diff altera arquivos fora de `arquivosPermitidos` do
card ativo, sem que o card tenha sido atualizado. Arquivos sensíveis exigem
confirmação/revisão adicional.

## Não objetivos
- Substituir code review humano.
- Bloquear modo `explore` (somente leitura).

## Contexto
Sem gate de escopo, um modelo menor pode "vazar" mudanças para arquivos não
declarados. O veredito (Revisão A) considera o gate de escopo mais importante
que um mapa sofisticado.

## Arquivos permitidos
- `scripts/rules/rule-scope.*` (novo)
- `package.json` (atalho, se necessário)
- `scripts/pre-pr.*` (invocar a regra)

## Critérios de aceite
- [ ] Regra lê o card ativo e compara com diff (base→HEAD + staged).
- [ ] Arquivo fora de `arquivosPermitidos` ⇒ falha com lista clara.
- [ ] Arquivos sensíveis (`src/hooks/useDatabase`, `src/lib/accounts`, workflows,
      RLS) exigem flag explícita de confirmação.
- [ ] Existe teste negativo (diff fora do escopo) e positivo (dentro do escopo).

## Riscos / Invariantes
- Não impedir atualização legítima do card para incluir novo arquivo.

## Testes obrigatórios
- `npm test` (fixtures negativa/positiva)
- `npm run pre-pr -- --strict`

## Evidência de pronto
- Saída da regra para diff dentro e fora do escopo.
