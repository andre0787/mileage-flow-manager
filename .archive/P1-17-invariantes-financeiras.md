# Task Card — Invariantes financeiras + reversais

| Campo | Valor |
|-------|-------|
| `id` | P1-17 |
| `categoria` | test |
| `onda` | P1-B |
| `baseBranch` | main |
| `estado` | done |
| `origem` | veredito 2026-07-17, item #17 |
| `dependeDe` | [] |

## Objetivo
Garantir invariantes financeiras com casos de limite e falha: manter funções
puras, cobrir boundary cases e provar que cada operação de banco que falha não
deixa o fluxo reportado como sucesso.

## Não objetivos
- Mudar modelo de dados agora (considerar integração transacional antes disso).

## Contexto
O veredito (The Executor) ressalta que mudanças financeiras devem ter testes
puros e, quando possível, integração que verifique erro de Supabase e
invariantes de reversal. Hoje isso não está coberto de forma determinística.

## Arquivos permitidos
- `src/lib/accounts*` (ou local das funções financeiras)
- `tests/unit/*` (testes financeiros e de integração)
- `tests/unit/accounts.test.ts` (teste de integração — novo)
- `.gitignore` (apenas .pi-subagents/)

## Critérios de aceite
- [ ] Funções de saldo permanecem puras onde aplicável.
- [ ] Casos de limite cobertos (zero, negativo, overflow de precisão).
- [ ] Teste simula erro de Supabase e assera que o fluxo NÃO reporta sucesso.
- [ ] Reversal de operação composta (ex.: transferência) cobre falha parcial.

## Riscos / Invariantes
- Não introduzir dependência externa para testar (mockar Supabase).

## Testes obrigatórios
- `npm test`
- teste de integração novo.

## Evidência de pronto
- Suíte de invariantes + caso de falha documentado.
