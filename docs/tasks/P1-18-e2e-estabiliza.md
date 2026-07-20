# Task Card — E2E: eliminar waitForTimeout, separar smoke/integração

| Campo | Valor |
|-------|-------|
| `id` | P1-18 |
| `categoria` | test |
| `onda` | P1-B |
| `baseBranch` | main |
| `estado` | review |
| `origem` | veredito 2026-07-17, item #18 |
| `dependeDe` | [] |

## Objetivo
Estabilizar E2E: eliminar `waitForTimeout` onde possível (usar locators/
assertions), marcar skips explicitamente no relatório, estabilizar seletores,
separar smoke de integração e tratar Supabase remoto como dependência dedicada.

## Não objetivos
- Remover o full E2E (manter como integração — Revisão C).

## Contexto
O veredito aponta: E2E usa Supabase remoto, cria usuários reais, tem
`waitForTimeout` frequente, pula o fluxo completo no CI e depende de
serviço externo. Isso mascara skips e gera flakiness.

## Arquivos permitidos
- `tests/*` (specs, helpers, fixtures)
- `.github/workflows/*` (separação smoke/integração)
- `playwright.config.*`
- `package.json` (apenas scripts novos)

## Critérios de aceite
- [ ] `waitForTimeout` removido em favor de locators/assertions (onde possível).
- [ ] Skips explícitos e visíveis no relatório (não silenciosos).
- [ ] Smoke roda no CI de PR; integração remota roda em suíte dedicada.
- [ ] Seletores estabilizados (data-testid onde fator de flakiness).

## Riscos / Invariantes
- Smoke não deve depender de Supabase remoto.

## Testes obrigatórios
- `npm run test:e2e:smoke` (ou equivalente) determinístico local.

## Evidência de pronto
- Relatório de smoke + contagem de waitForTimeout antes/depois.
