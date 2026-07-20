# Task Card — AST onde o risco compensa

| Campo | Valor |
|-------|-------|
| `id` | P1-16 |
| `categoria` | refactor |
| `onda` | P1-B |
| `baseBranch` | main |
| `estado` | done |
>>>>>>> origin/chore/p1-16-done
| `origem` | veredito 2026-07-17, item #16 |
| `dependeDe` | [P1-15] |

## Objetivo
Substituir regras de regex frágeis por análise AST (TypeScript Compiler API)
apenas nos pontos de alto risco: mutations de saldo, `invalidateQueries`,
providers, imports órfãos e chamadas Supabase sem tratamento de erro.

## Não objetivos
- Migrar todas as regras para AST (somente as de alto risco).

## Contexto
O veredito (The Executor) diz que regras textuais/regex são frágeis e o
TypeScript Compiler API já está disponível no repo. AST só onde o risco
compensa, para não inflar complexidade.

## Arquivos permitidos
- `scripts/rules/*` (regras-alvo)
- `scripts/rules/__tests__/` (fixtures AST)
- `scripts/lib.mjs` (helpers AST compartilhados)

## Critérios de aceite
- [x] Identificadas regras de alto risco candidatas: rule-19 (stock validation).
- [x] Regras migradas usam AST; testes negativos/positivos preservados.
- [x] Nenhum falso-positivo novo em código atualmente válido.

## Riscos / Invariantes
- AST pode ser lenta; isolar para não impactar `check:fast`.

## Testes obrigatórios
- `npm test` (novos fixtures AST)
- `npm run check:fast` (tempo preservado)

## Evidência de pronto
- Lista de regras migradas + diff + tempo de check:fast antes/depois.
