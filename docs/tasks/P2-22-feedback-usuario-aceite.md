# Task Card — Feedback de usuário como critério de aceite

| Campo | Valor |
|-------|-------|
| `id` | P2-22 |
| `categoria` | feat |
| `onda` | P2 |
| `baseBranch` | main |
| `estado` | pending |
| `origem` | veredito 2026-07-17, item #22 |
| `dependeDe` | [P1-08] |

## Objetivo
Estruturar feedback real de usuário como critério de aceite: sintomas,
reprodução, resultado esperado, área e teste de regressão.

## Não objetivos
- Construir produto de tickets externo (usar GitHub Issues + template).

## Contexto
O veredito (The Expansionist) recomenda transformar feedback em critérios de
aceite, evitando que o agente implemente só o texto superficial do pedido.

## Arquivos permitidos
- `.github/ISSUE_TEMPLATE/*` (template estruturado)
- `docs/tasks/_TEMPLATE.md` (campo opcional `feedbackRef`)
- manifesto de workflow em `docs/` _(referência ao uso — criado em P0-01)_

## Critérios de aceite
- [ ] Template de issue captura: sintomas, reprodução, esperado, área.
- [ ] Task-card pode referenciar a issue como `feedbackRef`.
- [ ] Critério de aceite do card deriva dos campos da issue quando aplicável.

## Riscos / Invariantes
- Não tornar obrigatório para mudanças sem feedback direto.

## Testes obrigatórios
- Revisão humana de um card exemplo gerado a partir de issue real.

## Evidência de pronto
- Template + card exemplo vinculado a uma issue.
