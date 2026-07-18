# Task Card — CI executa `npm run check` em modo estrito

| Campo | Valor |
|-------|-------|
| `id` | P0-03 |
| `categoria` | chore |
| `onda` | P0 |
| `baseBranch` | main |
| `estado` | pending |
| `origem` | veredito 2026-07-17, item #3 |
| `dependeDe` | [P1-13, P0-08] |

## Objetivo
CI executar `npm run check` (ou equivalente) em modo estrito: typecheck, lint
sem warnings críticos, format check, unit, rules, docs e build.

## Não objetivos
- Tornar E2E remoto obrigatório em todo commit (isso é P1-14/P1-18).

## Contexto
O CI hoje não executa typecheck, não executa format check, tolera lint
(`continue-on-error: true`) e não impõe guardrails de docs. Um agente pode
quebrar tipos/formato e ainda receber CI verde.

## Arquivos permitidos
- `.github/workflows/*.yml`
- `package.json` (atalho `check`, se necessário)

## Critérios de aceite
- [ ] Existe `npm run check` encadeando typecheck + lint + format:check + unit + rules + build.
- [ ] CI roda `npm run check` em modo estrito (sem `continue-on-error` nos críticos).
- [ ] Um diff que introduz erro de tipo ou formato faz o CI falhar.

## Riscos / Invariantes
- Não introduzir flakiness novo; isolar passos que já são determinísticos.

## Testes obrigatórios
- `npm run check` local verde.
- Pipeline de CI refletindo os passos.

## Evidência de pronto
- YAML do CI + screenshot/log de run verde e de run falhando propositalmente.
