# Task Card — Remover `continue-on-error` de checks críticos

| Campo | Valor |
|-------|-------|
| `id` | P0-04 |
| `categoria` | chore |
| `onda` | P0 |
| `baseBranch` | main |
| `estado` | done ✅ |
| `origem` | veredito 2026-07-17, item #4 |
| `dependeDe` | [] |

## Objetivo
Remover `continue-on-error: true` de passos críticos; manter apenas diagnósticos
informativos explicitamente não bloqueantes.

## Não objetivos
- Remover checks informativos legítimos (manter como diagnóstico).

## Contexto
Hoje `lint` usa `continue-on-error: true` (9 warnings tolerados) e o veredito
classifica isso como "um agente obtém resultado verde mesmo quebrando o contrato".

## Arquivos permitidos
- `.github/workflows/*.yml`

## Critérios de aceite
- [x] Nenhum passo de lint/typecheck/format/rules usa `continue-on-error`.
- [x] Passos puramente informativos (ex.: docs-health semanal) seguem `continue-on-error`
      e são comentados como diagnósticos.
- [x] CI falha quando um check crítico falha (`ci.yml` executa `npm run check` sem `continue-on-error`).

## Riscos / Invariantes
- Pode expor warnings que viram bloqueio; alinhar com P0-07 (drift) antes.

## Testes obrigatórios
- `rg "continue-on-error" .github/workflows` mostra apenas `docs-health.yml` comentado como diagnóstico.
- `ci.yml` roda `npm run check` em modo bloqueante.

## Evidência de pronto
- `.github/workflows/ci.yml` sem `continue-on-error` em checks críticos.
- `.github/workflows/docs-health.yml` mantém `continue-on-error` apenas em job semanal informativo e comentado.
